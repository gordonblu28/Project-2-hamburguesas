// Reglas de las reservaciones en línea: configuración (src/data/reservaciones.yaml), precios con
// depósito, horarios, cupo y validación de lo que envía el cliente.
// Es código puro (sin Astro, sin Vite, sin Node): lo usan la página /reservations/ para mostrar
// precios y reglas, y el servidor (worker/index.ts), que es la única autoridad para calcular,
// cobrar y confirmar. Las pruebas están en tests/reservas.test.ts.
import { instanteLocal, fechaHoraLocal, sumarDias, diaSemana } from './hora.ts';

/** Zona horaria del restaurante (la misma de negocio.yaml). */
export const ZONA = 'America/Chicago';

const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;
type Dia = (typeof DIAS)[number];

export interface Tramo {
  desde: string;
  hasta: string;
}

export interface ConfigReservas {
  activas: boolean;
  moneda: string;
  tarifa: { tipo: 'por_persona' | 'por_reserva'; monto: number | null };
  deposito_porcentaje: number;
  horario: Record<Dia, Tramo[]>;
  intervalo_minutos: number;
  duracion_minutos: number;
  cupo_personas: number;
  personas_min: number;
  personas_max: number;
  anticipacion_minima_minutos: number;
  dias_adelante: number;
  cerrado: string[];
  minutos_para_pagar: number;
}

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const esEntero = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

/** Valida reservaciones.yaml ya leído. Lanza un error que dice qué corregir. */
export function validarConfig(datos: unknown): ConfigReservas {
  const errores: string[] = [];
  const d = (datos ?? {}) as Record<string, unknown>;
  const tarifa = (d.tarifa ?? {}) as Record<string, unknown>;
  const horario = (d.horario ?? {}) as Record<string, unknown>;

  if (typeof d.activas !== 'boolean') errores.push('activas: use true o false.');
  if (typeof d.moneda !== 'string' || !/^[a-z]{3}$/.test(d.moneda)) errores.push('moneda: código de 3 letras en minúsculas, como "usd".');
  if (tarifa.tipo !== 'por_persona' && tarifa.tipo !== 'por_reserva') errores.push('tarifa.tipo: por_persona o por_reserva.');
  if (tarifa.monto !== null && tarifa.monto !== undefined && !(typeof tarifa.monto === 'number' && tarifa.monto > 0 && tarifa.monto < 100000))
    errores.push('tarifa.monto: un número mayor que 0 (en dólares, ej. 10.00) o vacío (null) mientras no se defina.');
  if (!esEntero(d.deposito_porcentaje, 1, 100)) errores.push('deposito_porcentaje: entero entre 1 y 100.');
  for (const dia of DIAS) {
    const tramos = horario[dia] ?? [];
    if (!Array.isArray(tramos)) {
      errores.push(`horario.${dia}: una lista de tramos ([] si no hay reservas ese día).`);
      continue;
    }
    tramos.forEach((t: Record<string, unknown>, i) => {
      if (!t || typeof t.desde !== 'string' || typeof t.hasta !== 'string' || !HORA.test(t.desde) || !HORA.test(t.hasta))
        errores.push(`horario.${dia}[${i}]: use { desde: "17:00", hasta: "21:00" } (24 horas).`);
      else if (aMinutos(t.hasta) < aMinutos(t.desde)) errores.push(`horario.${dia}[${i}]: "hasta" no puede ser antes que "desde".`);
    });
  }
  if (!esEntero(d.intervalo_minutos, 5, 240)) errores.push('intervalo_minutos: entero entre 5 y 240.');
  if (!esEntero(d.duracion_minutos, 15, 600)) errores.push('duracion_minutos: entero entre 15 y 600.');
  if (!esEntero(d.cupo_personas, 1, 10000)) errores.push('cupo_personas: entero mayor que 0.');
  if (!esEntero(d.personas_min, 1, 1000)) errores.push('personas_min: entero mayor que 0.');
  if (!esEntero(d.personas_max, 1, 1000)) errores.push('personas_max: entero mayor que 0.');
  else if (esEntero(d.personas_min, 1, 1000) && d.personas_max < d.personas_min) errores.push('personas_max no puede ser menor que personas_min.');
  if (!esEntero(d.anticipacion_minima_minutos, 0, 60 * 24 * 30)) errores.push('anticipacion_minima_minutos: entero (0 o más).');
  if (!esEntero(d.dias_adelante, 0, 730)) errores.push('dias_adelante: entero entre 0 y 730.');
  const cerrado = d.cerrado ?? [];
  if (!Array.isArray(cerrado) || cerrado.some((f) => typeof f !== 'string' || !FECHA.test(f))) errores.push('cerrado: lista de fechas "AAAA-MM-DD".');
  // Stripe no deja que una sesión de pago venza antes de 30 minutos ni después de 24 horas.
  if (!esEntero(d.minutos_para_pagar, 30, 1440)) errores.push('minutos_para_pagar: entero entre 30 y 1440.');

  if (errores.length) throw new Error(`src/data/reservaciones.yaml tiene errores:\n${errores.map((e) => `  - ${e}`).join('\n')}`);
  return {
    ...(d as unknown as ConfigReservas),
    tarifa: { tipo: tarifa.tipo as ConfigReservas['tarifa']['tipo'], monto: (tarifa.monto as number | null | undefined) ?? null },
    horario: Object.fromEntries(DIAS.map((dia) => [dia, (horario[dia] as Tramo[] | undefined) ?? []])) as Record<Dia, Tramo[]>,
    cerrado: cerrado as string[],
  };
}

/** ¿Se puede reservar en línea? Si no, por qué (para el aviso de la página y la respuesta del servidor). */
export function estadoReservas(cfg: ConfigReservas): { listas: true } | { listas: false; motivo: 'apagadas' | 'sin_tarifa' | 'sin_horario' } {
  if (!cfg.activas) return { listas: false, motivo: 'apagadas' };
  if (cfg.tarifa.monto === null) return { listas: false, motivo: 'sin_tarifa' };
  if (DIAS.every((dia) => cfg.horario[dia].length === 0)) return { listas: false, motivo: 'sin_horario' };
  return { listas: true };
}

export interface Precios {
  /** Total de la reserva, en centavos. */
  total: number;
  /** Depósito que se cobra en línea, en centavos. */
  deposito: number;
  /** Lo que queda por pagar en el restaurante, en centavos. */
  resto: number;
}

/** Total, depósito y resto en centavos (enteros: nunca se cobra con decimales flotantes). */
export function calcularPrecios(cfg: ConfigReservas, personas: number): Precios | null {
  if (cfg.tarifa.monto === null) return null;
  const unidad = Math.round(cfg.tarifa.monto * 100);
  const total = cfg.tarifa.tipo === 'por_persona' ? unidad * personas : unidad;
  const deposito = Math.round((total * cfg.deposito_porcentaje) / 100);
  return { total, deposito, resto: total - deposito };
}

export const aMinutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));
export const aHora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** "19:30" → "7:30 PM" */
export function horaLegible(hora: string): string {
  const m = aMinutos(hora);
  const h = Math.floor(m / 60);
  return `${h % 12 || 12}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "2026-10-31" → "Saturday, October 31, 2026" */
export function fechaLegible(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(a, m - 1, d)));
}

export function dinero(centavos: number, moneda = 'usd'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: moneda.toUpperCase() }).format(centavos / 100);
}

/** Primera y última fecha reservable (hora local del restaurante). */
export function ventanaFechas(cfg: ConfigReservas, ahora: number): { primera: string; ultima: string } {
  const hoy = fechaHoraLocal(ahora, ZONA).fecha;
  return { primera: hoy, ultima: sumarDias(hoy, cfg.dias_adelante) };
}

/** Horarios de llegada que el horario permite ese día, sin mirar cupo ni la hora actual. */
export function horariosDelDia(cfg: ConfigReservas, fecha: string): string[] {
  if (!FECHA.test(fecha) || cfg.cerrado.includes(fecha)) return [];
  const tramos = cfg.horario[DIAS[diaSemana(fecha)]];
  const horas = new Set<string>();
  for (const t of tramos) {
    for (let m = aMinutos(t.desde); m <= aMinutos(t.hasta); m += cfg.intervalo_minutos) horas.add(aHora(m));
  }
  return [...horas].sort();
}

/** Horarios de ese día a los que todavía se puede llegar (dentro de la ventana y con la anticipación mínima). */
export function horariosReservables(cfg: ConfigReservas, fecha: string, ahora: number): string[] {
  const { primera, ultima } = ventanaFechas(cfg, ahora);
  if (!FECHA.test(fecha) || fecha < primera || fecha > ultima) return [];
  const limite = ahora + cfg.anticipacion_minima_minutos * 60_000;
  return horariosDelDia(cfg, fecha).filter((h) => instanteLocal(`${fecha}T${h}`, ZONA).getTime() >= limite);
}

export interface Ocupada {
  inicio: number;
  fin: number;
  personas: number;
}

/** Personas con reserva que se cruzan con [inicio, fin) — se cuentan todas las que se traslapan. */
export function ocupacion(ocupadas: Ocupada[], inicio: number, fin: number): number {
  return ocupadas.filter((o) => o.inicio < fin && o.fin > inicio).reduce((n, o) => n + o.personas, 0);
}

export interface Solicitud {
  nombre: string;
  telefono: string;
  email: string;
  fecha: string;
  hora: string;
  personas: number;
  peticiones: string;
}

export type Campo = keyof Solicitud;

const texto = (v: unknown) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');

/** Valida lo que envía el formulario. En el servidor, `ahora` es la hora del servidor. */
export function validarSolicitud(
  cfg: ConfigReservas,
  datos: unknown,
  ahora: number,
): { ok: true; valor: Solicitud } | { ok: false; errores: Partial<Record<Campo, string>> } {
  const d = (datos ?? {}) as Record<string, unknown>;
  const errores: Partial<Record<Campo, string>> = {};
  const nombre = texto(d.nombre);
  const telefono = texto(d.telefono);
  const email = texto(d.email).toLowerCase();
  const fecha = texto(d.fecha);
  const hora = texto(d.hora);
  const personas = typeof d.personas === 'string' ? Number(d.personas) : d.personas;
  // Las peticiones conservan los saltos de línea.
  const peticiones = typeof d.peticiones === 'string' ? d.peticiones.trim().slice(0, 2000) : '';

  if (nombre.length < 2 || nombre.length > 80) errores.nombre = 'Please enter your full name.';
  const digitos = telefono.replace(/\D/g, '');
  if (!/^[+\d\s().-]+$/.test(telefono) || digitos.length < 10 || digitos.length > 15) errores.telefono = 'Please enter a valid phone number, including area code.';
  if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errores.email = 'Please enter a valid email address.';
  if (!esEntero(personas, cfg.personas_min, cfg.personas_max))
    errores.personas = `Online reservations are for ${cfg.personas_min}–${cfg.personas_max} guests. For larger groups, please call us.`;
  if (!FECHA.test(fecha)) errores.fecha = 'Please choose a date.';
  else {
    const { primera, ultima } = ventanaFechas(cfg, ahora);
    if (fecha < primera) errores.fecha = 'That date has already passed.';
    else if (fecha > ultima) errores.fecha = `Reservations open up to ${cfg.dias_adelante} days ahead.`;
  }
  if (!errores.fecha) {
    if (!HORA.test(hora)) errores.hora = 'Please choose a time.';
    else if (!horariosReservables(cfg, fecha, ahora).includes(hora)) errores.hora = 'That time is not available for online booking. Please choose another.';
  }
  if (peticiones.length > 500) errores.peticiones = 'Please keep special requests under 500 characters.';

  if (Object.keys(errores).length) return { ok: false, errores };
  return { ok: true, valor: { nombre, telefono, email, fecha, hora, personas: personas as number, peticiones } };
}
