// Datos del negocio, la sección de temporada y los destacados (src/data/*.yaml).
// Se validan al compilar: si falta un campo o tiene otro formato, la compilación lo indica.
import { parse } from 'yaml';
import { z } from 'astro/zod';
import negocioYaml from '../data/negocio.yaml?raw';
import temporadaYaml from '../data/temporada.yaml?raw';
import destacadosYaml from '../data/destacados.yaml?raw';
import portadaYaml from '../data/portada.yaml?raw';

function validar<T>(esquema: z.ZodType<T>, texto: string, archivo: string): T {
  const r = esquema.safeParse(parse(texto));
  if (!r.success) {
    const detalle = r.error.issues.map((i) => `  - ${i.path.join('.') || '(raíz)'}: ${i.message}`).join('\n');
    throw new Error(`src/data/${archivo} tiene errores:\n${detalle}`);
  }
  return r.data;
}

const esquemaNegocio = z.object({
  nombre: z.string(),
  subtitulo: z.string(),
  lema: z.string(),
  direccion: z.object({ calle: z.string(), ciudad: z.string(), estado: z.string(), cp: z.string(), pais: z.string() }),
  telefono: z.object({ visible: z.string(), enlace: z.string().regex(/^\+\d{8,15}$/) }),
  instagram: z.object({ usuario: z.string(), url: z.string().url() }),
  horario: z.array(z.object({ dias: z.string(), horas: z.string() })).nullable().default([]),
  zona_horaria: z.string(),
});

const esquemaTemporada = z.object({
  activa: z.boolean(),
  nombre_corto: z.string(),
  titulo: z.string(),
  subtitulo: z.string(),
  tema: z.enum(['halloween', 'ninguno']),
  titulo_portada: z.string(),
  titulo_portada_cursiva: z.string(),
  bajada: z.string(),
  termina: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Use el formato AAAA-MM-DDTHH:MM.'),
  zona_horaria: z.string(),
  al_terminar: z.enum(['mensaje', 'ocultar']),
  mensaje_final: z.string(),
  mensaje_final_detalle: z.string(),
  sin_productos: z.string(),
  productos: z
    .array(
      z
        .object({
          nombre: z.string(),
          tipo: z.enum(['bebida', 'platillo', 'promocion']).default('bebida'),
          descripcion: z.string().optional(),
          precio: z.number().positive().optional(),
          foto: z.string().optional(),
        })
        .strict(),
    )
    .nullable()
    .default([]),
});

export const NEGOCIO = validar(esquemaNegocio, negocioYaml, 'negocio.yaml');
export const TEMPORADA_DATOS = validar(esquemaTemporada, temporadaYaml, 'temporada.yaml');
export const DESTACADOS = validar(z.array(z.string()), destacadosYaml, 'destacados.yaml');
export const PORTADA = validar(z.object({ galeria: z.array(z.string()).min(1) }), portadaYaml, 'portada.yaml');

const d = NEGOCIO.direccion;
export const DIRECCION_LINEA = `${d.calle}, ${d.ciudad}, ${d.estado} ${d.cp}`;
const consulta = encodeURIComponent(`${NEGOCIO.nombre}, ${DIRECCION_LINEA}`);
export const MAPAS = {
  google: `https://www.google.com/maps/search/?api=1&query=${consulta}`,
  apple: `https://maps.apple.com/?q=${encodeURIComponent(NEGOCIO.nombre)}&address=${encodeURIComponent(DIRECCION_LINEA)}`,
};
export const TEL_HREF = `tel:${NEGOCIO.telefono.enlace}`;

/** Diferencia en minutos entre la hora local de `zona` y UTC en el instante `t`. */
function desfaseMinutos(t: number, zona: string): number {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: zona,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(t));
  const v = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value);
  return (Date.UTC(v('year'), v('month') - 1, v('day'), v('hour'), v('minute'), v('second')) - t) / 60000;
}

/** Convierte "AAAA-MM-DDTHH:MM" en hora local de `zona` al instante UTC equivalente (respeta horario de verano). */
export function instanteLocal(fechaHora: string, zona: string): Date {
  const [f, h] = fechaHora.split('T');
  const [a, m, dia] = f.split('-').map(Number);
  const [hh, mm] = h.split(':').map(Number);
  const pared = Date.UTC(a, m - 1, dia, hh, mm);
  let t = pared;
  for (let i = 0; i < 3; i++) {
    const siguiente = pared - desfaseMinutos(t, zona) * 60000;
    if (siguiente === t) break;
    t = siguiente;
  }
  return new Date(t);
}

const fin = instanteLocal(TEMPORADA_DATOS.termina, TEMPORADA_DATOS.zona_horaria);
const zona = TEMPORADA_DATOS.zona_horaria;
// "Medianoche" se lee como el final del día anterior: 2026-11-01T00:00 → "Saturday, October 31 at midnight".
const esMedianoche = TEMPORADA_DATOS.termina.endsWith('T00:00');
const diaFinal = new Date(fin.getTime() - (esMedianoche ? 60_000 : 0));
const fecha = (opciones: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-US', { timeZone: zona, ...opciones }).format(diaFinal);
const hora = esMedianoche ? 'midnight' : new Intl.DateTimeFormat('en-US', { timeZone: zona, hour: 'numeric', minute: '2-digit' }).format(fin);
const siglaZona = new Intl.DateTimeFormat('en-US', { timeZone: zona, timeZoneName: 'short' }).formatToParts(fin).find((p) => p.type === 'timeZoneName')?.value ?? '';
const nombreZona = zona === 'America/Chicago' ? 'Central Time' : siglaZona;
const finTexto = `${fecha({ weekday: 'long', month: 'long', day: 'numeric' })} at ${hora}`;

const vigenteAlCompilar = Date.now() < fin.getTime();

/** Temporada lista para usar. Si se compila después del vencimiento, la página ya sale con el
 *  mensaje final (o sin los accesos); en el navegador, el contador hace lo mismo al llegar a cero. */
export const TEMPORADA = {
  ...TEMPORADA_DATOS,
  productos: TEMPORADA_DATOS.productos ?? [],
  /** Página propia de la temporada (src/pages/halloween/). */
  ruta: '/halloween/',
  finISO: fin.toISOString(),
  /** "Saturday, October 31 at midnight" */
  finTexto,
  /** "Oct 31" */
  finCorto: fecha({ month: 'short', day: 'numeric' }),
  nombreZona,
  vigenteAlCompilar,
  visible: TEMPORADA_DATOS.activa && (vigenteAlCompilar || TEMPORADA_DATOS.al_terminar === 'mensaje'),
};
