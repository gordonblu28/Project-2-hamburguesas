// Servidor de The Rodeo (Cloudflare Worker con archivos estáticos). La entrada es worker/index.ts,
// que le pasa la configuración (src/data/reservaciones.yaml); las pruebas le pasan otra.
// · Todo lo que no es /api/ lo sirve tal cual desde dist/ (el sitio de Astro).
// · /api/reservations/…  reservaciones en línea con depósito (base de datos D1 + Stripe Checkout).
// · /api/stripe/webhook   avisos firmados de Stripe: aquí se confirman las reservas pagadas.
// · /api/admin/…          lista y estado de las reservas para el personal (ADMIN_TOKEN).
//
// Una reserva solo queda "confirmada" cuando Stripe confirma el pago del depósito (por webhook o
// al consultar la sesión). Mientras se paga, el lugar queda apartado `minutos_para_pagar`; si no
// se paga, se libera solo. El cupo se comprueba en una sola sentencia SQL, así dos personas que
// reservan al mismo tiempo no pueden pasarse del cupo.
import {
  estadoReservas,
  calcularPrecios,
  horariosReservables,
  ventanaFechas,
  validarSolicitud,
  ocupacion,
  aMinutos,
  horaLegible,
  fechaLegible,
  dinero,
  type ConfigReservas,
  type Ocupada,
} from '../src/lib/reservas.ts';
import { Stripe, ErrorStripe, verificarFirma, iguales, type SesionStripe } from './stripe.ts';

// ── Tipos mínimos de Cloudflare (sin dependencias extra) ──
interface D1Resultado<T> {
  results: T[];
  meta: { changes: number };
}
interface D1Sentencia {
  bind(...valores: unknown[]): D1Sentencia;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<D1Resultado<T>>;
  run(): Promise<D1Resultado<unknown>>;
}
interface D1 {
  prepare(sql: string): D1Sentencia;
}

export interface Env {
  ASSETS: { fetch(peticion: Request): Promise<Response> };
  DB?: D1;
  /** wrangler secret put STRIPE_SECRET_KEY  (sk_live_… o sk_test_…) */
  STRIPE_SECRET_KEY?: string;
  /** wrangler secret put STRIPE_WEBHOOK_SECRET  (whsec_…) */
  STRIPE_WEBHOOK_SECRET?: string;
  /** wrangler secret put ADMIN_TOKEN  (clave larga para el panel /reservations/admin/) */
  ADMIN_TOKEN?: string;
  /** Solo para pruebas locales: dirección de un Stripe simulado. */
  STRIPE_API_BASE?: string;
}

let CONFIG: ConfigReservas;
/** Teléfono del restaurante (negocio.yaml), para los mensajes que piden llamar. */
let TEL = '';

/** La entrada (worker/index.ts o la de las pruebas) fija la configuración al cargar. */
export function configurar(config: ConfigReservas, telefono: string) {
  CONFIG = config;
  TEL = telefono;
}

/** Estados que ocupan lugar. "pendiente_pago" solo mientras no venza su apartado. */
const OCUPAN = `(estado IN ('confirmada', 'procesando_pago', 'sentada') OR (estado = 'pendiente_pago' AND apartada_hasta > ?))`;

interface Fila {
  id: string;
  codigo: string;
  nombre: string;
  telefono: string;
  email: string;
  fecha: string;
  hora: string;
  inicio_min: number;
  fin_min: number;
  personas: number;
  peticiones: string | null;
  total_centavos: number;
  deposito_centavos: number;
  moneda: string;
  estado: string;
  estado_pago: string;
  stripe_sesion: string | null;
  stripe_pago: string | null;
  apartada_hasta: number | null;
  creada: number;
  actualizada: number;
  confirmada: number | null;
}

// ── Respuestas ──
function json(datos: unknown, estado = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extra,
    },
  });
}

const error = (estado: number, codigo: string, mensaje: string, extra: Record<string, unknown> = {}) => json({ error: codigo, mensaje, ...extra }, estado);


/** Por qué no se puede reservar en línea ahora (o null si se puede). */
function motivoNoDisponible(env: Env): string | null {
  const e = estadoReservas(CONFIG);
  if (!e.listas) return e.motivo;
  if (!env.DB) return 'sin_base_de_datos';
  if (!env.STRIPE_SECRET_KEY) return 'sin_pagos';
  return null;
}

const stripe = (env: Env) => new Stripe(env.STRIPE_SECRET_KEY!, env.STRIPE_API_BASE || undefined);

function codigoCorto(): string {
  // Sin 0/O ni 1/I/L: se dicta por teléfono sin confusiones.
  const letras = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const azar = crypto.getRandomValues(new Uint8Array(6));
  return `RDO-${[...azar].map((b) => letras[b % letras.length]).join('')}`;
}

/** Datos que puede ver el cliente con el enlace de su reserva (sin teléfono ni correo). */
function publica(f: Fila) {
  return {
    id: f.id,
    codigo: f.codigo,
    nombre: f.nombre,
    fecha: f.fecha,
    fechaTexto: fechaLegible(f.fecha),
    hora: f.hora,
    horaTexto: horaLegible(f.hora),
    personas: f.personas,
    peticiones: f.peticiones,
    total: f.total_centavos,
    deposito: f.deposito_centavos,
    resto: f.total_centavos - f.deposito_centavos,
    moneda: f.moneda,
    estado: f.estado,
    estadoPago: f.estado_pago,
  };
}

async function ocupadas(db: D1, fecha: string, ahora: number): Promise<Ocupada[]> {
  const r = await db
    .prepare(`SELECT inicio_min AS inicio, fin_min AS fin, personas FROM reservaciones WHERE fecha = ? AND ${OCUPAN}`)
    .bind(fecha, ahora)
    .all<Ocupada>();
  return r.results;
}

// ── GET /api/reservations/config ──
function config(env: Env, ahora: number): Response {
  const motivo = motivoNoDisponible(env);
  return json({
    disponible: motivo === null,
    motivo,
    moneda: CONFIG.moneda,
    tarifa: CONFIG.tarifa,
    depositoPorcentaje: CONFIG.deposito_porcentaje,
    personasMin: CONFIG.personas_min,
    personasMax: CONFIG.personas_max,
    ventana: ventanaFechas(CONFIG, ahora),
  });
}

// ── GET /api/reservations/availability?date=AAAA-MM-DD&guests=N ──
async function disponibilidad(env: Env, url: URL, ahora: number): Promise<Response> {
  const motivo = motivoNoDisponible(env);
  if (motivo) return error(503, 'no_disponible', `Online reservations are not available right now. Please call ${TEL}.`, { motivo });
  const fecha = url.searchParams.get('date') ?? '';
  const personas = Number(url.searchParams.get('guests') ?? CONFIG.personas_min);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return error(400, 'fecha_invalida', 'Please choose a valid date.');
  if (!Number.isInteger(personas) || personas < CONFIG.personas_min || personas > CONFIG.personas_max)
    return error(400, 'personas_invalidas', `Online reservations are for ${CONFIG.personas_min}–${CONFIG.personas_max} guests.`);

  const horas = horariosReservables(CONFIG, fecha, ahora);
  const tomadas = horas.length ? await ocupadas(env.DB!, fecha, ahora) : [];
  const horarios = horas.map((hora) => {
    const inicio = aMinutos(hora);
    const libres = CONFIG.cupo_personas - ocupacion(tomadas, inicio, inicio + CONFIG.duracion_minutos);
    return { hora, texto: horaLegible(hora), disponible: libres >= personas };
  });
  return json({ fecha, personas, horarios, precios: calcularPrecios(CONFIG, personas) });
}

// ── POST /api/reservations ──
async function crear(env: Env, peticion: Request, url: URL, ahora: number): Promise<Response> {
  const motivo = motivoNoDisponible(env);
  if (motivo) return error(503, 'no_disponible', `Online reservations are not available right now. Please call ${TEL}.`, { motivo });
  if (!(peticion.headers.get('Content-Type') ?? '').includes('application/json')) return error(415, 'formato', 'Send JSON.');
  if (Number(peticion.headers.get('Content-Length') ?? 0) > 8_000) return error(413, 'muy_grande', 'Request too large.');

  let datos: Record<string, unknown>;
  try {
    datos = (await peticion.json()) as Record<string, unknown>;
  } catch {
    return error(400, 'formato', 'Invalid request.');
  }
  // Campo trampa: invisible para personas; los robots lo llenan.
  if (typeof datos.sitio_web === 'string' && datos.sitio_web.trim()) return error(400, 'rechazada', 'Your request could not be processed.');

  const v = validarSolicitud(CONFIG, datos, ahora);
  if (!v.ok) return error(422, 'datos_invalidos', 'Please check the highlighted fields.', { errores: v.errores });
  const s = v.valor;
  const precios = calcularPrecios(CONFIG, s.personas)!;
  // Stripe no cobra menos de 50 centavos de dólar.
  if (precios.deposito < 50) return error(503, 'no_disponible', `Online reservations are not available right now. Please call ${TEL}.`, { motivo: 'deposito_minimo' });

  const db = env.DB!;
  const id = crypto.randomUUID();
  const codigo = codigoCorto();
  const inicio = aMinutos(s.hora);
  const fin = inicio + CONFIG.duracion_minutos;
  const venceSesion = Math.floor(ahora / 1000) + CONFIG.minutos_para_pagar * 60 + 60;
  // El apartado dura un poco más que la sesión de pago: nadie puede pagar después de que se libera.
  const apartadaHasta = (venceSesion + 5 * 60) * 1000;

  // Apartar el lugar solo si cabe: la suma y la inserción ocurren en la misma sentencia.
  const insercion = await db
    .prepare(
      `INSERT INTO reservaciones
        (id, codigo, nombre, telefono, email, fecha, hora, inicio_min, fin_min, personas, peticiones,
         total_centavos, deposito_centavos, moneda, estado, estado_pago, apartada_hasta, creada, actualizada)
       SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente_pago', 'sin_pagar', ?, ?, ?
       WHERE (SELECT COALESCE(SUM(personas), 0) FROM reservaciones
              WHERE fecha = ? AND inicio_min < ? AND fin_min > ? AND ${OCUPAN}) + ? <= ?`,
    )
    .bind(
      id, codigo, s.nombre, s.telefono, s.email, s.fecha, s.hora, inicio, fin, s.personas, s.peticiones || null,
      precios.total, precios.deposito, CONFIG.moneda, apartadaHasta, ahora, ahora,
      s.fecha, fin, inicio, ahora, s.personas, CONFIG.cupo_personas,
    )
    .run();
  if (!insercion.meta.changes)
    return error(409, 'sin_cupo', 'Sorry — that time just filled up. Please choose another time.', { errores: { hora: 'That time just filled up. Please choose another.' } });

  const descripcion = `${fechaLegible(s.fecha)} · ${horaLegible(s.hora)} · ${s.personas} ${s.personas === 1 ? 'guest' : 'guests'}`;
  let sesion: SesionStripe;
  try {
    sesion = await stripe(env).crearSesion(
      {
        mode: 'payment',
        customer_email: s.email,
        client_reference_id: id,
        expires_at: venceSesion,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: CONFIG.moneda,
              unit_amount: precios.deposito,
              product_data: {
                name: `Reservation deposit (${CONFIG.deposito_porcentaje}%) — The Rodeo Bar And Grill`,
                description: `${descripcion}. Booking total ${dinero(precios.total, CONFIG.moneda)}; remaining ${dinero(precios.resto, CONFIG.moneda)} is paid at the restaurant. Ref. ${codigo}`,
              },
            },
          },
        ],
        metadata: { reservacion: id, codigo },
        payment_intent_data: { metadata: { reservacion: id, codigo }, description: `Reservation ${codigo} — ${descripcion}`, receipt_email: s.email },
        success_url: `${url.origin}/reservations/confirmation/?id=${id}`,
        cancel_url: `${url.origin}/reservations/?cancelled=${id}`,
      },
      `reservacion-${id}`,
    );
  } catch (e) {
    // Sin sesión de pago no hay reserva: se libera el lugar.
    await db.prepare(`UPDATE reservaciones SET estado = 'cancelada', apartada_hasta = NULL, actualizada = ? WHERE id = ?`).bind(Date.now(), id).run();
    console.error('Stripe: no se pudo crear la sesión', e instanceof Error ? e.message : e);
    return error(502, 'pago_no_disponible', `We couldn't start the payment. Your card was not charged. Please try again or call ${TEL}.`);
  }
  await db.prepare(`UPDATE reservaciones SET stripe_sesion = ?, actualizada = ? WHERE id = ?`).bind(sesion.id, Date.now(), id).run();
  return json({ id, codigo, url: sesion.url }, 201);
}

/** Aplica a la reserva lo que dice Stripe de su sesión de pago. Las actualizaciones solo avanzan
 *  desde estados válidos, así un aviso repetido o fuera de orden no deshace nada. */
async function aplicarSesion(db: D1, f: Fila, sesion: SesionStripe): Promise<void> {
  const ahora = Date.now();
  if (sesion.payment_status === 'paid') {
    const coincide = sesion.amount_total === f.deposito_centavos && (sesion.currency ?? '').toLowerCase() === f.moneda;
    if (!coincide) {
      // Nunca debería pasar (el monto lo pone el servidor): queda para que el personal lo revise.
      await db
        .prepare(`UPDATE reservaciones SET estado = 'revision', estado_pago = 'pagado', stripe_pago = ?, actualizada = ? WHERE id = ? AND estado IN ('pendiente_pago', 'procesando_pago', 'vencida')`)
        .bind(sesion.payment_intent, ahora, f.id)
        .run();
      return;
    }
    await db
      .prepare(
        `UPDATE reservaciones SET estado = 'confirmada', estado_pago = 'pagado', stripe_pago = ?, apartada_hasta = NULL, confirmada = ?, actualizada = ?
         WHERE id = ? AND estado IN ('pendiente_pago', 'procesando_pago', 'vencida')`,
      )
      .bind(sesion.payment_intent, ahora, ahora, f.id)
      .run();
  } else if (sesion.status === 'complete') {
    // Pago enviado pero aún no acreditado (algunos métodos tardan): el lugar sigue apartado.
    await db
      .prepare(`UPDATE reservaciones SET estado = 'procesando_pago', estado_pago = 'procesando', apartada_hasta = NULL, actualizada = ? WHERE id = ? AND estado = 'pendiente_pago'`)
      .bind(ahora, f.id)
      .run();
  } else if (sesion.status === 'expired') {
    await db.prepare(`UPDATE reservaciones SET estado = 'vencida', apartada_hasta = NULL, actualizada = ? WHERE id = ? AND estado = 'pendiente_pago'`).bind(ahora, f.id).run();
  }
}

const buscar = (db: D1, id: string) => db.prepare(`SELECT * FROM reservaciones WHERE id = ?`).bind(id).first<Fila>();

// ── GET /api/reservations/:id ── (la página de confirmación consulta hasta que Stripe confirme)
async function consultar(env: Env, id: string): Promise<Response> {
  if (!env.DB) return error(503, 'no_disponible', 'Reservations are not available right now.');
  let f = await buscar(env.DB, id);
  if (!f) return error(404, 'no_encontrada', 'Reservation not found.');
  // Si el aviso de Stripe aún no llega, se le pregunta directamente.
  if ((f.estado === 'pendiente_pago' || f.estado === 'procesando_pago') && f.stripe_sesion && env.STRIPE_SECRET_KEY) {
    try {
      await aplicarSesion(env.DB, f, await stripe(env).verSesion(f.stripe_sesion));
      f = (await buscar(env.DB, id))!;
    } catch (e) {
      console.error('Stripe: no se pudo consultar la sesión', e instanceof Error ? e.message : e);
    }
  }
  return json(publica(f));
}

// ── POST /api/reservations/:id/cancel ── (la persona volvió de Stripe sin pagar)
async function cancelar(env: Env, id: string): Promise<Response> {
  if (!env.DB) return error(503, 'no_disponible', 'Reservations are not available right now.');
  const f = await buscar(env.DB, id);
  if (!f) return error(404, 'no_encontrada', 'Reservation not found.');
  if (f.estado !== 'pendiente_pago') return json(publica(f));
  if (f.stripe_sesion && env.STRIPE_SECRET_KEY) {
    try {
      // Vencer la sesión impide que se pague después en otra pestaña.
      await stripe(env).vencerSesion(f.stripe_sesion);
    } catch (e) {
      // Si ya no está abierta (se pagó o venció), lo que manda es lo que diga Stripe.
      if (e instanceof ErrorStripe) {
        await aplicarSesion(env.DB, f, await stripe(env).verSesion(f.stripe_sesion));
        return json(publica((await buscar(env.DB, id))!));
      }
      throw e;
    }
  }
  await env.DB.prepare(`UPDATE reservaciones SET estado = 'cancelada', apartada_hasta = NULL, actualizada = ? WHERE id = ? AND estado = 'pendiente_pago'`)
    .bind(Date.now(), id)
    .run();
  return json(publica((await buscar(env.DB, id))!));
}

// ── POST /api/stripe/webhook ──
async function webhook(env: Env, peticion: Request): Promise<Response> {
  if (!env.STRIPE_WEBHOOK_SECRET || !env.DB) return error(503, 'no_configurado', 'Webhook not configured.');
  const cuerpo = await peticion.text();
  const valida = await verificarFirma(cuerpo, peticion.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET, Math.floor(Date.now() / 1000));
  if (!valida) return error(400, 'firma_invalida', 'Invalid signature.');
  const evento = JSON.parse(cuerpo) as { id: string; type: string; data: { object: SesionStripe } };
  const tipos = ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed', 'checkout.session.expired'];
  if (!tipos.includes(evento.type)) return json({ recibido: true });

  const sesion = evento.data.object;
  const id = sesion.metadata?.reservacion;
  const f = id ? await buscar(env.DB, id) : null;
  if (!f || f.stripe_sesion !== sesion.id) return json({ recibido: true, ignorado: 'reserva desconocida' });

  // El mismo evento puede llegar más de una vez: las actualizaciones solo avanzan desde estados
  // válidos, así que repetirlo no cambia nada. Se registra después de aplicarlo: si algo falla,
  // Stripe lo reenvía y se vuelve a intentar.
  if (evento.type === 'checkout.session.async_payment_failed') {
    await env.DB.prepare(
      `UPDATE reservaciones SET estado = 'pago_fallido', estado_pago = 'fallido', apartada_hasta = NULL, actualizada = ? WHERE id = ? AND estado IN ('pendiente_pago', 'procesando_pago')`,
    )
      .bind(Date.now(), f.id)
      .run();
  } else {
    await aplicarSesion(env.DB, f, sesion);
  }
  await env.DB.prepare(`INSERT OR IGNORE INTO eventos_stripe (id, tipo, recibido) VALUES (?, ?, ?)`).bind(evento.id, evento.type, Date.now()).run();
  return json({ recibido: true });
}

// ── Panel del personal: /api/admin/reservations ──
function autorizado(env: Env, peticion: Request): boolean {
  const token = (peticion.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  return !!env.ADMIN_TOKEN && env.ADMIN_TOKEN.length >= 16 && iguales(token, env.ADMIN_TOKEN);
}

async function adminLista(env: Env, url: URL): Promise<Response> {
  const desde = url.searchParams.get('from') ?? '0000-00-00';
  const hasta = url.searchParams.get('to') ?? '9999-12-31';
  const estado = url.searchParams.get('status');
  const r = await env
    .DB!.prepare(
      `SELECT * FROM reservaciones WHERE fecha BETWEEN ? AND ? ${estado ? 'AND estado = ?' : ''} ORDER BY fecha, inicio_min, creada LIMIT 500`,
    )
    .bind(...[desde, hasta, ...(estado ? [estado] : [])])
    .all<Fila>();
  return json({ reservaciones: r.results.map((f) => ({ ...publica(f), telefono: f.telefono, email: f.email, stripePago: f.stripe_pago, creada: f.creada })) });
}

/** Cambios de estado que puede hacer el personal (no toca pagos: los reembolsos se hacen en Stripe). */
const TRANSICIONES: Record<string, string[]> = {
  confirmada: ['sentada', 'completada', 'no_llego', 'cancelada'],
  sentada: ['completada', 'confirmada'],
  completada: ['sentada'],
  no_llego: ['confirmada'],
  revision: ['confirmada', 'cancelada'],
  procesando_pago: ['cancelada'],
};

async function adminCambiar(env: Env, id: string, peticion: Request): Promise<Response> {
  const datos = (await peticion.json().catch(() => ({}))) as { estado?: string };
  const f = await buscar(env.DB!, id);
  if (!f) return error(404, 'no_encontrada', 'Reservation not found.');
  if (!datos.estado || !(TRANSICIONES[f.estado] ?? []).includes(datos.estado))
    return error(409, 'transicion_invalida', `A reservation that is "${f.estado}" can't be changed to "${datos.estado}".`);
  await env.DB!.prepare(`UPDATE reservaciones SET estado = ?, actualizada = ? WHERE id = ? AND estado = ?`).bind(datos.estado, Date.now(), id, f.estado).run();
  return json(publica((await buscar(env.DB!, id))!));
}

// ── Enrutador ──
async function api(peticion: Request, env: Env, url: URL): Promise<Response> {
  const ahora = Date.now();
  const ruta = url.pathname.replace(/\/+$/, '');
  const metodo = peticion.method;

  // Las acciones del navegador solo se aceptan desde el propio sitio.
  const origen = peticion.headers.get('Origin');
  if (metodo !== 'GET' && ruta !== '/api/stripe/webhook' && origen && origen !== url.origin) return error(403, 'origen', 'Forbidden.');

  if (ruta === '/api/reservations/config' && metodo === 'GET') return config(env, ahora);
  if (ruta === '/api/reservations/availability' && metodo === 'GET') return disponibilidad(env, url, ahora);
  if (ruta === '/api/reservations' && metodo === 'POST') return crear(env, peticion, url, ahora);
  if (ruta === '/api/stripe/webhook' && metodo === 'POST') return webhook(env, peticion);

  const una = ruta.match(/^\/api\/reservations\/([0-9a-f-]{36})(\/cancel)?$/);
  if (una && metodo === 'GET' && !una[2]) return consultar(env, una[1]);
  if (una && metodo === 'POST' && una[2]) return cancelar(env, una[1]);

  if (ruta.startsWith('/api/admin/')) {
    if (!env.ADMIN_TOKEN || !env.DB) return error(503, 'no_configurado', 'The reservations panel is not configured yet.');
    if (!autorizado(env, peticion)) return error(401, 'no_autorizado', 'Wrong or missing access key.', {});
    if (ruta === '/api/admin/reservations' && metodo === 'GET') return adminLista(env, url);
    const cambio = ruta.match(/^\/api\/admin\/reservations\/([0-9a-f-]{36})$/);
    if (cambio && metodo === 'PATCH') return adminCambiar(env, cambio[1], peticion);
  }
  return error(404, 'no_existe', 'Not found.');
}

export const app = {
  async fetch(peticion: Request, env: Env): Promise<Response> {
    const url = new URL(peticion.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(peticion);
    try {
      return await api(peticion, env, url);
    } catch (e) {
      console.error('Error en', url.pathname, e instanceof Error ? e.stack : e);
      return error(500, 'error', `Something went wrong. Please try again or call ${TEL}.`);
    }
  },
};
