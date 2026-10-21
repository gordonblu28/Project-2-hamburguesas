// Formulario de reservaciones (/reservations/). El navegador solo muestra y valida para ayudar:
// los horarios disponibles, el precio que se cobra y la confirmación los decide el servidor
// (worker/app.ts). Nunca se muestra un horario como disponible sin preguntarle al servidor.
import { fechaHoraLocal, sumarDias } from '../lib/hora';
import {
  calcularPrecios,
  validarSolicitud,
  horaLegible,
  fechaLegible,
  dinero,
  ZONA,
  type ConfigReservas,
  type Precios,
  type Campo,
} from '../lib/reservas';

const BORRADOR = 'rodeo-reserva-borrador';

interface Horario {
  hora: string;
  texto: string;
  disponible: boolean;
}

const MENSAJES: Record<string, { titulo: string; texto: string }> = {
  sin_tarifa: {
    titulo: 'Online reservations are almost ready',
    texto: 'We’re finishing setting up online booking. In the meantime, please call us to reserve — we’d love to save you a table.',
  },
  sin_horario: {
    titulo: 'Online reservations are almost ready',
    texto: 'Our reservation hours are being set up. In the meantime, please call us to reserve.',
  },
  apagadas: {
    titulo: 'Online reservations are paused',
    texto: 'We’re not taking online reservations right now. Please call us — we’re happy to help.',
  },
  sin_servidor: {
    titulo: 'Online reservations are not available right now',
    texto: 'Please call us to reserve your table.',
  },
};

export function iniciarReservas() {
  const form = document.querySelector<HTMLFormElement>('[data-reserva]');
  if (!form) return;
  const { config: cfg, estado } = JSON.parse(form.querySelector('[data-config]')!.textContent!) as {
    config: ConfigReservas;
    estado: { listas: boolean; motivo?: string };
  };

  const $ = <T extends HTMLElement>(sel: string) => form.querySelector<T>(sel)!;
  const campo = (n: Campo) => $<HTMLInputElement>(`[data-campo="${n}"]`);
  const fecha = campo('fecha');
  const personas = campo('personas') as unknown as HTMLSelectElement;
  const lista = $<HTMLElement>('[data-horarios]');
  const estadoHorarios = $<HTMLElement>('[data-horarios-estado]');
  const pagar = $<HTMLButtonElement>('[data-pagar]');
  const pagarTexto = $<HTMLElement>('[data-pagar-texto]');
  const errorGeneral = $<HTMLElement>('[data-error-general]');
  const aviso = document.querySelector<HTMLElement>('[data-aviso]')!;
  const peticiones = campo('peticiones') as unknown as HTMLTextAreaElement;

  let disponible = estado.listas;
  let horarios: Horario[] = [];
  let preciosServidor: Precios | null = null;
  let consulta: AbortController | null = null;
  let enviando = false;

  // ── Fechas: de hoy (hora de Texas) a dias_adelante ──
  const hoy = fechaHoraLocal(Date.now(), ZONA).fecha;
  fecha.min = hoy;
  fecha.max = sumarDias(hoy, cfg.dias_adelante);

  function mostrarAviso(motivo: string) {
    const m = MENSAJES[motivo] ?? MENSAJES.sin_servidor;
    aviso.querySelector('[data-aviso-titulo]')!.textContent = m.titulo;
    aviso.querySelector('[data-aviso-texto]')!.textContent = m.texto;
    aviso.hidden = false;
    disponible = false;
    // El formulario queda a la vista (para conocer precios y reglas) pero no se puede llenar.
    form!.querySelectorAll<HTMLFieldSetElement>('fieldset.bloque').forEach((f) => (f.disabled = true));
    estadoHorarios.textContent = 'Online booking is not available right now — please call us.';
    lista.replaceChildren();
    actualizar();
  }

  // ── Resumen ──
  function precios(): Precios | null {
    return preciosServidor ?? calcularPrecios(cfg, Number(personas.value));
  }

  function horaElegida(): string {
    return form!.querySelector<HTMLInputElement>('input[name="hora"]:checked')?.value ?? '';
  }

  function actualizar() {
    const n = Number(personas.value);
    const p = precios();
    const h = horaElegida();
    const poner = (k: string, v: string) => (form!.querySelector(`[data-resumen="${k}"]`)!.textContent = v);
    poner('fecha', fecha.value ? fechaLegible(fecha.value) : '—');
    poner('hora', h ? horaLegible(h) : '—');
    poner('personas', `${n} ${n === 1 ? 'guest' : 'guests'}`);
    if (cfg.tarifa.monto !== null && cfg.tarifa.tipo === 'por_persona') poner('tarifa', `${dinero(Math.round(cfg.tarifa.monto * 100), cfg.moneda)} × ${n}`);
    poner('total', p ? dinero(p.total, cfg.moneda) : '—');
    poner('deposito', p ? dinero(p.deposito, cfg.moneda) : '—');
    poner('resto', p ? dinero(p.resto, cfg.moneda) : '—');
    pagar.disabled = !disponible || !p || enviando;
    if (!enviando) pagarTexto.textContent = p ? `Pay ${dinero(p.deposito, cfg.moneda)} deposit & reserve` : 'Pay deposit & reserve';
  }

  // ── Errores por campo ──
  function marcarError(n: Campo, mensaje?: string) {
    const caja = form!.querySelector<HTMLElement>(`[data-error="${n}"]`);
    const control = n === 'hora' ? null : campo(n);
    if (caja) {
      caja.hidden = !mensaje;
      caja.textContent = mensaje ?? '';
      caja.id = `error-${n}`;
    }
    if (control) {
      control.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
      if (mensaje) control.setAttribute('aria-describedby', `error-${n}`);
      else control.removeAttribute('aria-describedby');
    }
  }

  function limpiarErrores() {
    (['nombre', 'telefono', 'email', 'fecha', 'hora', 'personas', 'peticiones'] as Campo[]).forEach((n) => marcarError(n));
    errorGeneral.hidden = true;
  }

  function mostrarErrores(errores: Partial<Record<Campo, string>>) {
    let primero: HTMLElement | null = null;
    for (const [n, m] of Object.entries(errores) as [Campo, string][]) {
      marcarError(n, m);
      primero ??= n === 'hora' ? lista.querySelector('input') ?? estadoHorarios : campo(n);
    }
    primero?.focus();
  }

  // ── Horarios: siempre los dice el servidor ──
  async function cargarHorarios() {
    marcarError('hora');
    preciosServidor = null;
    if (!disponible) return actualizar();
    if (!fecha.value) {
      estadoHorarios.textContent = 'Choose a date to see available times.';
      lista.replaceChildren();
      return actualizar();
    }
    if (fecha.value < fecha.min || fecha.value > fecha.max) {
      marcarError('fecha', fecha.value < fecha.min ? 'That date has already passed.' : `Reservations open up to ${cfg.dias_adelante} days ahead.`);
      lista.replaceChildren();
      estadoHorarios.textContent = 'Choose another date.';
      return actualizar();
    }
    marcarError('fecha');
    const anterior = horaElegida();
    consulta?.abort();
    consulta = new AbortController();
    estadoHorarios.textContent = 'Checking available tables…';
    lista.setAttribute('aria-busy', 'true');
    try {
      const r = await fetch(`/api/reservations/availability?date=${fecha.value}&guests=${personas.value}`, { signal: consulta.signal });
      const datos = await r.json().catch(() => null);
      if (r.status === 503 && datos?.motivo) return mostrarAviso(datos.motivo);
      if (!r.ok || !datos) throw new Error(datos?.mensaje ?? 'error');
      horarios = datos.horarios;
      preciosServidor = datos.precios;
      pintarHorarios(anterior);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      lista.replaceChildren();
      estadoHorarios.textContent = 'We couldn’t load available times. Please try again in a moment, or call us.';
    } finally {
      lista.removeAttribute('aria-busy');
      actualizar();
    }
  }

  function pintarHorarios(anterior: string) {
    const libres = horarios.filter((h) => h.disponible).length;
    if (!horarios.length) estadoHorarios.textContent = 'We don’t take online reservations on this date. Please choose another day or call us.';
    else if (!libres) estadoHorarios.textContent = 'This date is fully booked online. Please choose another day or call us.';
    else estadoHorarios.textContent = `${libres} ${libres === 1 ? 'time' : 'times'} available on ${fechaLegible(fecha.value)}.`;
    lista.replaceChildren(
      ...horarios.map((h) => {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'hora';
        input.value = h.hora;
        input.disabled = !h.disponible;
        input.checked = h.disponible && h.hora === anterior;
        label.append(input, document.createTextNode(h.texto));
        if (!h.disponible) {
          const s = document.createElement('small');
          s.textContent = 'Full';
          label.append(s);
          label.title = 'Fully booked';
        }
        return label;
      }),
    );
  }

  // ── Borrador: si la persona vuelve de Stripe sin pagar, sus datos siguen ahí ──
  const camposBorrador: Campo[] = ['nombre', 'telefono', 'email', 'personas', 'fecha', 'peticiones'];
  function guardarBorrador() {
    try {
      const datos = Object.fromEntries(camposBorrador.map((n) => [n, campo(n).value]));
      sessionStorage.setItem(BORRADOR, JSON.stringify({ ...datos, hora: horaElegida() }));
    } catch {
      /* sin almacenamiento: no pasa nada */
    }
  }

  function restaurarBorrador(): string {
    try {
      const b = JSON.parse(sessionStorage.getItem(BORRADOR) ?? 'null') as Record<string, string> | null;
      if (!b) return '';
      camposBorrador.forEach((n) => b[n] !== undefined && (campo(n).value = b[n]));
      return b.hora ?? '';
    } catch {
      return '';
    }
  }

  // ── Enviar: el servidor aparta la mesa y devuelve la página de pago de Stripe ──
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (enviando || !disponible) return;
    limpiarErrores();
    const datos = {
      nombre: campo('nombre').value,
      telefono: campo('telefono').value,
      email: campo('email').value,
      fecha: fecha.value,
      hora: horaElegida(),
      personas: Number(personas.value),
      peticiones: peticiones.value,
      sitio_web: form.querySelector<HTMLInputElement>('[name="sitio_web"]')!.value,
    };
    const v = validarSolicitud(cfg, datos, Date.now());
    if (!v.ok) return mostrarErrores(v.errores);

    enviando = true;
    pagar.setAttribute('aria-busy', 'true');
    pagarTexto.textContent = 'Holding your table…';
    actualizar();
    try {
      const r = await fetch('/api/reservations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
      const res = await r.json().catch(() => null);
      if (r.status === 201 && res?.url) {
        guardarBorrador();
        pagarTexto.textContent = 'Opening secure payment…';
        location.assign(res.url);
        return;
      }
      if (r.status === 503 && res?.motivo) mostrarAviso(res.motivo);
      if (res?.errores) mostrarErrores(res.errores);
      if (r.status === 409) await cargarHorarios();
      errorGeneral.textContent = res?.mensaje ?? 'Something went wrong. Please try again, or call us.';
      errorGeneral.hidden = false;
    } catch {
      errorGeneral.textContent = 'We couldn’t reach the reservation system. Check your connection and try again, or call us.';
      errorGeneral.hidden = false;
    }
    enviando = false;
    pagar.removeAttribute('aria-busy');
    actualizar();
  });

  // ── Eventos ──
  fecha.addEventListener('change', cargarHorarios);
  personas.addEventListener('change', cargarHorarios);
  lista.addEventListener('change', () => {
    marcarError('hora');
    actualizar();
  });
  peticiones.addEventListener('input', () => ($<HTMLElement>('[data-contador]').textContent = String(peticiones.value.length)));
  (['nombre', 'telefono', 'email'] as Campo[]).forEach((n) => campo(n).addEventListener('input', () => marcarError(n)));

  // ── Inicio ──
  const params = new URLSearchParams(location.search);
  const cancelada = params.get('cancelled');
  let horaPrevia = '';
  if (cancelada) {
    horaPrevia = restaurarBorrador();
    history.replaceState(null, '', location.pathname + '#reservar');
    if (/^[0-9a-f-]{36}$/.test(cancelada)) {
      fetch(`/api/reservations/${cancelada}/cancel`, { method: 'POST' })
        .then((r) => r.json())
        .then((res) => {
          // Si en otra pestaña sí se pagó, la reserva está confirmada: se muestra.
          if (['confirmada', 'procesando_pago'].includes(res?.estado)) location.replace(`/reservations/confirmation/?id=${cancelada}`);
          else document.querySelector<HTMLElement>('[data-cancelada]')!.hidden = false;
        })
        .catch(() => (document.querySelector<HTMLElement>('[data-cancelada]')!.hidden = false));
    }
  }

  if (!estado.listas) {
    mostrarAviso(estado.motivo ?? 'sin_servidor');
    return;
  }
  // El servidor confirma que puede tomar reservas (base de datos y pagos configurados).
  fetch('/api/reservations/config')
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then(async (c: { disponible: boolean; motivo: string | null }) => {
      if (!c.disponible) return mostrarAviso(c.motivo ?? 'sin_servidor');
      if (fecha.value) {
        await cargarHorarios();
        if (horaPrevia) {
          const h = lista.querySelector<HTMLInputElement>(`input[value="${horaPrevia}"]:not(:disabled)`);
          if (h) h.checked = true;
          actualizar();
        }
      }
    })
    .catch(() => mostrarAviso('sin_servidor'));
  actualizar();
}
