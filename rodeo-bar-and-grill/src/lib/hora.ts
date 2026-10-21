// Hora local del negocio (America/Chicago) sin librerías: la usan el sitio, el contador de la
// temporada y el sistema de reservaciones (también en el servidor, worker/index.ts).

/** Diferencia en minutos entre la hora local de `zona` y UTC en el instante `t`. */
export function desfaseMinutos(t: number, zona: string): number {
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

/** Fecha (AAAA-MM-DD) y minutos desde la medianoche en hora local de `zona` para el instante `t`. */
export function fechaHoraLocal(t: number, zona: string): { fecha: string; minutos: number } {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(t));
  const v = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  return { fecha: `${v('year')}-${v('month')}-${v('day')}`, minutos: Number(v('hour')) * 60 + Number(v('minute')) };
}

/** Suma días a una fecha AAAA-MM-DD (calendario, sin zona horaria). */
export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** Día de la semana de una fecha AAAA-MM-DD: 0 = domingo … 6 = sábado. */
export function diaSemana(fecha: string): number {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}
