// Panel del personal (/reservations/admin/). La clave se guarda solo en esta pestaña
// (sessionStorage) y viaja en la cabecera Authorization; el servidor decide qué se puede cambiar.
import { fechaHoraLocal, sumarDias } from '../lib/hora';
import { dinero, ZONA } from '../lib/reservas';

const CLAVE = 'rodeo-admin';

interface Reserva {
  id: string;
  codigo: string;
  nombre: string;
  telefono: string;
  email: string;
  fechaTexto: string;
  horaTexto: string;
  personas: number;
  peticiones: string | null;
  total: number;
  deposito: number;
  resto: number;
  moneda: string;
  estado: string;
  estadoPago: string;
  stripePago: string | null;
}

const ETIQUETA: Record<string, string> = {
  confirmada: 'Confirmed',
  procesando_pago: 'Payment processing',
  pendiente_pago: 'Paying now',
  sentada: 'Seated',
  completada: 'Completed',
  no_llego: 'No-show',
  cancelada: 'Cancelled',
  vencida: 'Expired',
  pago_fallido: 'Payment failed',
  revision: 'Needs review',
};

// Lo mismo que permite el servidor (worker/app.ts); el servidor tiene la última palabra.
const ACCIONES: Record<string, [string, string][]> = {
  confirmada: [['sentada', 'Seated'], ['completada', 'Completed'], ['no_llego', 'No-show'], ['cancelada', 'Cancel']],
  sentada: [['completada', 'Completed'], ['confirmada', 'Undo seated']],
  completada: [['sentada', 'Undo completed']],
  no_llego: [['confirmada', 'Undo no-show']],
  revision: [['confirmada', 'Confirm'], ['cancelada', 'Cancel']],
  procesando_pago: [['cancelada', 'Cancel']],
};

export function iniciarAdmin() {
  const raiz = document.querySelector<HTMLElement>('[data-admin]');
  if (!raiz) return;
  const acceso = raiz.querySelector<HTMLFormElement>('[data-acceso]')!;
  const errorAcceso = raiz.querySelector<HTMLElement>('[data-acceso-error]')!;
  const panel = raiz.querySelector<HTMLElement>('[data-panel]')!;
  const filtros = raiz.querySelector<HTMLFormElement>('[data-filtros]')!;
  const lista = raiz.querySelector<HTMLElement>('[data-lista]')!;
  const resumen = raiz.querySelector<HTMLElement>('[data-resumen]')!;
  const hoy = fechaHoraLocal(Date.now(), ZONA).fecha;
  (filtros.elements.namedItem('from') as HTMLInputElement).value = hoy;
  (filtros.elements.namedItem('to') as HTMLInputElement).value = sumarDias(hoy, 14);

  let clave = '';
  try {
    clave = sessionStorage.getItem(CLAVE) ?? '';
  } catch {
    /* sin almacenamiento: se pide cada vez */
  }

  const pedir = (ruta: string, init: RequestInit = {}) =>
    fetch(ruta, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${clave}` }, cache: 'no-store' });

  function bloquear(mensaje?: string) {
    clave = '';
    try {
      sessionStorage.removeItem(CLAVE);
    } catch {
      /* nada */
    }
    panel.hidden = true;
    acceso.hidden = false;
    errorAcceso.hidden = !mensaje;
    errorAcceso.textContent = mensaje ?? '';
  }

  async function cargar() {
    const q = new URLSearchParams(new FormData(filtros) as unknown as Record<string, string>);
    if (!q.get('status')) q.delete('status');
    resumen.textContent = 'Loading…';
    const r = await pedir(`/api/admin/reservations?${q}`).catch(() => null);
    if (!r) return (resumen.textContent = 'Could not reach the server.');
    const datos = await r.json().catch(() => ({}));
    if (r.status === 401) return bloquear('Wrong access key.');
    if (!r.ok) return bloquear(datos.mensaje ?? 'The reservations panel is not available.');
    acceso.hidden = true;
    panel.hidden = false;
    pintar(datos.reservaciones as Reserva[]);
  }

  function pintar(reservas: Reserva[]) {
    const confirmadas = reservas.filter((r) => ['confirmada', 'sentada', 'completada'].includes(r.estado));
    const personas = confirmadas.reduce((n, r) => n + r.personas, 0);
    resumen.textContent = `${reservas.length} reservations · ${confirmadas.length} confirmed · ${personas} guests`;
    lista.replaceChildren(
      ...reservas.map((r) => {
        const el = document.createElement('article');
        el.className = 'res';
        el.dataset.estado = r.estado;
        const cabeza = document.createElement('div');
        cabeza.className = 'res__cabeza';
        const cuando = document.createElement('span');
        cuando.className = 'res__cuando';
        cuando.textContent = `${r.fechaTexto} · ${r.horaTexto} · ${r.personas} guests`;
        const estado = document.createElement('span');
        estado.className = 'res__estado';
        estado.textContent = ETIQUETA[r.estado] ?? r.estado;
        const codigo = document.createElement('strong');
        codigo.textContent = r.codigo;
        cabeza.append(cuando, estado, codigo);
        const datos = document.createElement('p');
        datos.className = 'res__datos';
        // textContent: los datos del cliente nunca se interpretan como HTML.
        datos.textContent = [
          `${r.nombre} · ${r.telefono} · ${r.email}`,
          `Deposit ${dinero(r.deposito, r.moneda)} (${r.estadoPago}) · due at restaurant ${dinero(r.resto, r.moneda)} · total ${dinero(r.total, r.moneda)}`,
          r.peticiones ? `Requests: ${r.peticiones}` : '',
        ]
          .filter(Boolean)
          .join('\n');
        el.append(cabeza, datos);
        const acciones = document.createElement('div');
        acciones.className = 'res__acciones';
        for (const [estadoNuevo, texto] of ACCIONES[r.estado] ?? []) {
          const b = document.createElement('button');
          b.type = 'button';
          b.textContent = texto;
          b.addEventListener('click', () => cambiar(r, estadoNuevo, texto));
          acciones.append(b);
        }
        if (r.stripePago) {
          const a = document.createElement('a');
          a.href = `https://dashboard.stripe.com/payments/${encodeURIComponent(r.stripePago)}`;
          a.target = '_blank';
          a.rel = 'noopener';
          a.className = 'enlace';
          a.textContent = 'Payment in Stripe';
          acciones.append(a);
        }
        if (acciones.childElementCount) el.append(acciones);
        return el;
      }),
    );
  }

  async function cambiar(r: Reserva, estado: string, texto: string) {
    if (estado === 'cancelada' && !confirm(`Cancel ${r.codigo} for ${r.nombre}? The deposit is NOT refunded automatically — refund it in Stripe if needed.`)) return;
    const res = await pedir(`/api/admin/reservations/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    if (!res.ok) alert((await res.json().catch(() => ({}))).mensaje ?? `Could not mark as ${texto}.`);
    cargar();
  }

  acceso.addEventListener('submit', (e) => {
    e.preventDefault();
    clave = (acceso.querySelector('input') as HTMLInputElement).value.trim();
    try {
      sessionStorage.setItem(CLAVE, clave);
    } catch {
      /* nada */
    }
    cargar();
  });
  filtros.addEventListener('submit', (e) => {
    e.preventDefault();
    cargar();
  });
  raiz.querySelector('[data-salir]')?.addEventListener('click', () => bloquear());
  if (clave) cargar();
}
