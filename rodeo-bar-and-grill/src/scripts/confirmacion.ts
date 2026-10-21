// Página de confirmación (/reservations/confirmation/?id=…). Pregunta al servidor por la reserva
// hasta que el pago quede verificado (o falle); el servidor consulta a Stripe si su aviso tarda.
import { dinero } from '../lib/reservas';
import { instanteLocal } from '../lib/hora';

interface Reserva {
  id: string;
  codigo: string;
  nombre: string;
  fecha: string;
  fechaTexto: string;
  hora: string;
  horaTexto: string;
  personas: number;
  peticiones: string | null;
  deposito: number;
  resto: number;
  moneda: string;
  estado: string;
}

const NO_CONFIRMADA: Record<string, string> = {
  cancelada: 'The payment was cancelled, so no table was reserved and you were not charged.',
  vencida: 'The time to complete the payment ran out, so the table was released. You were not charged.',
  pago_fallido: 'Your bank declined or reversed the deposit payment, so the table was released.',
};

export function iniciarConfirmacion() {
  const raiz = document.querySelector<HTMLElement>('[data-confirmacion]');
  if (!raiz) return;
  const id = new URLSearchParams(location.search).get('id') ?? '';
  const mostrar = (estado: string) => raiz.querySelectorAll<HTMLElement>('[data-estado]').forEach((e) => (e.hidden = e.dataset.estado !== estado));
  const poner = (k: string, v: string) => {
    const el = raiz.querySelector<HTMLElement>(`[data-dato="${k}"]`);
    if (el) el.textContent = v;
  };

  if (!/^[0-9a-f-]{36}$/.test(id)) return mostrar('error');

  let intentos = 0;
  let fallos = 0;

  async function consultar() {
    intentos++;
    try {
      const r = await fetch(`/api/reservations/${id}`, { cache: 'no-store' });
      if (r.status === 404) return mostrar('error');
      if (!r.ok) throw new Error(String(r.status));
      fallos = 0;
      pintar((await r.json()) as Reserva);
    } catch {
      // Un tropiezo de la red no es un rechazo: se reintenta unas veces antes de avisar.
      if (++fallos >= 4) {
        poner('error-titulo', 'We couldn’t check your reservation');
        poner('error-texto', 'Please refresh this page in a moment. If you were charged, your reservation is safe — call us with any questions.');
        return mostrar('error');
      }
      setTimeout(consultar, 2500);
    }
  }

  function pintar(r: Reserva) {
    if (['confirmada', 'sentada', 'completada'].includes(r.estado)) {
      try {
        sessionStorage.removeItem('rodeo-reserva-borrador');
      } catch {
        /* sin almacenamiento */
      }
      poner('saludo', `You’re all set, ${r.nombre.split(' ')[0]}!`);
      poner('codigo', r.codigo);
      poner('fecha', r.fechaTexto);
      poner('hora', `${r.horaTexto} (Texas time)`);
      poner('personas', `${r.personas} ${r.personas === 1 ? 'guest' : 'guests'}`);
      poner('peticiones', r.peticiones ?? '');
      raiz!.querySelector<HTMLElement>('[data-fila="peticiones"]')!.hidden = !r.peticiones;
      poner('deposito', dinero(r.deposito, r.moneda));
      poner('resto', dinero(r.resto, r.moneda));
      raiz!.querySelector('[data-calendario]')?.addEventListener('click', () => calendario(r));
      return mostrar('confirmada');
    }
    if (r.estado === 'revision') return mostrar('revision');
    if (NO_CONFIRMADA[r.estado]) {
      poner('motivo', NO_CONFIRMADA[r.estado]);
      return mostrar('no_confirmada');
    }
    // pendiente_pago o procesando_pago: se sigue preguntando (más espaciado con el tiempo).
    mostrar(r.estado === 'procesando_pago' ? 'procesando' : 'pendiente');
    setTimeout(consultar, intentos < 15 ? 2000 : 10000);
  }

  // Archivo .ics para agregar la reserva al calendario (se genera aquí; no sale del navegador).
  function calendario(r: Reserva) {
    const inicio = instanteLocal(`${r.fecha}T${r.hora}`, 'America/Chicago');
    const fin = new Date(inicio.getTime() + 90 * 60_000);
    const ics = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const negocio = raiz!.dataset.negocio ?? '';
    const texto = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//The Rodeo Bar And Grill//Reservations//EN',
      'BEGIN:VEVENT',
      `UID:${r.id}@therodeo`,
      `DTSTAMP:${ics(new Date())}`,
      `DTSTART:${ics(inicio)}`,
      `DTEND:${ics(fin)}`,
      `SUMMARY:Table for ${r.personas} at ${negocio}`,
      `LOCATION:${(raiz!.dataset.direccion ?? '').replace(/,/g, '\\,')}`,
      `DESCRIPTION:Confirmation ${r.codigo}. Deposit paid: ${dinero(r.deposito, r.moneda)}. Due at the restaurant: ${dinero(r.resto, r.moneda)}.`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([texto], { type: 'text/calendar' }));
    a.download = `the-rodeo-${r.codigo}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  consultar();
}
