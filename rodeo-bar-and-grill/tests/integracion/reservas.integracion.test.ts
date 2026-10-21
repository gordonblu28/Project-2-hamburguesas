// Prueba de punta a punta de las reservaciones: el Worker real (wrangler dev, D1 local) contra un
// Stripe simulado. Requiere `npm run build` antes (sirve dist/).   npm run test:integracion
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripeSimulado } from './stripe-simulado.ts';
import { firmar } from '../../worker/stripe.ts';
import { fechaHoraLocal, sumarDias } from '../../src/lib/hora.ts';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const PUERTO = 8790;
const PUERTO_STRIPE = 12111;
const BASE = `http://127.0.0.1:${PUERTO}`;
const SECRETO = 'whsec_prueba_simulada';
const ADMIN = 'clave-de-prueba-larga-1234567890';
const stripe = stripeSimulado(PUERTO_STRIPE);
const estado = mkdtempSync(path.join(tmpdir(), 'rodeo-d1-'));
const config = path.join(aqui, 'wrangler.prueba.jsonc');
// Las peticiones locales no deben salir por un proxy del sistema: wrangler dev manda por el proxy
// todo lo que pide el Worker (también al Stripe simulado en 127.0.0.1) si encuentra estas variables.
const entorno: NodeJS.ProcessEnv = { ...process.env, WRANGLER_SEND_METRICS: 'false' };
const sinProxy: NodeJS.ProcessEnv = Object.fromEntries(Object.entries(entorno).filter(([k]) => !/^(https?|all)_proxy$/i.test(k)));
let wrangler: ChildProcess;

// Una fecha que siempre está dentro de la ventana y con horarios futuros.
const FECHA = sumarDias(fechaHoraLocal(Date.now(), 'America/Chicago').fecha, 3);

const api = (ruta: string, init: RequestInit = {}) => fetch(BASE + ruta, init);
const crear = (datos: Record<string, unknown>, cabeceras: Record<string, string> = {}) =>
  api('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE, ...cabeceras },
    body: JSON.stringify({ nombre: 'Ana García', telefono: '(210) 555-0134', email: 'ana@example.com', fecha: FECHA, hora: '19:00', personas: 2, peticiones: '', ...datos }),
  });

async function avisar(tipo: string, sesion: unknown, secreto = SECRETO) {
  const cuerpo = JSON.stringify({ id: `evt_${Math.random().toString(36).slice(2)}`, type: tipo, data: { object: sesion } });
  const t = Math.floor(Date.now() / 1000);
  return api('/api/stripe/webhook', { method: 'POST', headers: { 'Stripe-Signature': `t=${t},v1=${await firmar(secreto, `${t}.${cuerpo}`)}` }, body: cuerpo });
}

const disponible = async (hora: string, personas = 1) => {
  const r = await (await api(`/api/reservations/availability?date=${FECHA}&guests=${personas}`)).json();
  return r.horarios.find((h: { hora: string }) => h.hora === hora)?.disponible as boolean;
};

before(async () => {
  // Si algo ya escucha en el puerto, las pruebas hablarían con otro servidor: mejor detenerse.
  const ocupado = await api('/api/reservations/config').then(() => true, () => false);
  if (ocupado) throw new Error(`El puerto ${PUERTO} ya está en uso: cierre el otro "wrangler dev" y repita.`);
  await stripe.iniciar();
  execFileSync('npx', ['-y', 'wrangler@4', 'd1', 'migrations', 'apply', 'rodeo-prueba', '--local', '-c', config, '--persist-to', estado], { env: entorno, stdio: 'pipe' });
  // La migración (arriba) ya dejó wrangler en la caché de npx: aquí arranca sin red.
  wrangler = spawn(
    'npx',
    [
      '-y', '--prefer-offline', 'wrangler@4', 'dev', '-c', config, '--port', String(PUERTO), '--ip', '127.0.0.1', '--persist-to', estado,
      '--var', 'STRIPE_SECRET_KEY:sk_test_simulado',
      '--var', `STRIPE_WEBHOOK_SECRET:${SECRETO}`,
      '--var', `ADMIN_TOKEN:${ADMIN}`,
      '--var', `STRIPE_API_BASE:http://127.0.0.1:${PUERTO_STRIPE}`,
    ],
    // Grupo de procesos propio: al terminar se cierran juntos npx, wrangler y workerd.
    { env: sinProxy, stdio: 'pipe', detached: true },
  );
  let salida = '';
  wrangler.stdout?.on('data', (d) => (salida += d));
  wrangler.stderr?.on('data', (d) => (salida += d));
  for (let i = 0; i < 120; i++) {
    try {
      if ((await api('/api/reservations/config')).ok) return;
    } catch {
      /* aún arrancando */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`wrangler dev no arrancó:\n${salida}`);
});

after(async () => {
  if (wrangler?.pid) process.kill(-wrangler.pid, 'SIGTERM');
  await stripe.cerrar();
  rmSync(estado, { recursive: true, force: true });
});

test('config: disponible, con el depósito del 50 %', async () => {
  const c = await (await api('/api/reservations/config')).json();
  assert.equal(c.disponible, true);
  assert.equal(c.depositoPorcentaje, 50);
});

test('el sitio estático sigue sirviéndose', async () => {
  const r = await api('/menu/');
  assert.equal(r.status, 200);
  assert.match(await r.text(), /Appetizers/);
});

test('disponibilidad: precios del depósito y horarios', async () => {
  const r = await (await api(`/api/reservations/availability?date=${FECHA}&guests=4`)).json();
  assert.deepEqual(r.precios, { total: 4000, deposito: 2000, resto: 2000 });
  assert.equal(r.horarios[0].hora, '11:00');
  assert.ok(r.horarios.every((h: { disponible: boolean }) => h.disponible));
  assert.equal((await api(`/api/reservations/availability?date=2001-01-01&guests=2`)).status, 200);
  const pasada = await (await api(`/api/reservations/availability?date=2001-01-01&guests=2`)).json();
  assert.deepEqual(pasada.horarios, [], 'una fecha pasada no ofrece horarios');
});

test('datos inválidos: 422 con el error de cada campo', async () => {
  const r = await crear({ nombre: 'A', email: 'x', telefono: '12', personas: 30 });
  assert.equal(r.status, 422);
  const c = await r.json();
  assert.deepEqual(Object.keys(c.errores).sort(), ['email', 'nombre', 'personas', 'telefono']);
});

test('otro origen no puede crear reservas', async () => {
  assert.equal((await crear({}, { Origin: 'https://evil.example' })).status, 403);
});

test('flujo completo: apartar → pagar en Stripe → webhook firmado → confirmada', async () => {
  const r = await crear({ personas: 4, hora: '11:00', peticiones: 'Birthday — high chair, please' });
  assert.equal(r.status, 201);
  const { id, url, codigo } = await r.json();
  assert.match(codigo, /^RDO-[A-Z2-9]{6}$/);
  assert.match(url, /^https:\/\/checkout\.stripe\.test\//);
  const sesion = [...stripe.sesiones.values()].find((s) => s.metadata.reservacion === id)!;
  assert.equal(sesion.amount_total, 2000, 'Stripe cobra exactamente el 50 %');
  assert.equal(sesion.currency, 'usd');

  let estadoR = await (await api(`/api/reservations/${id}`)).json();
  assert.equal(estadoR.estado, 'pendiente_pago', 'sin pago no hay confirmación');

  // Un webhook sin firma válida no confirma nada.
  stripe.pagar(sesion.id);
  assert.equal((await avisar('checkout.session.completed', sesion, 'whsec_falso')).status, 400);

  const w = await avisar('checkout.session.completed', sesion);
  assert.equal(w.status, 200);
  estadoR = await (await api(`/api/reservations/${id}`)).json();
  assert.equal(estadoR.estado, 'confirmada');
  assert.equal(estadoR.estadoPago, 'pagado');
  assert.equal(estadoR.deposito, 2000);
  assert.equal(estadoR.resto, 2000);
  assert.equal(estadoR.telefono, undefined, 'la consulta pública no muestra el teléfono');

  // El mismo aviso repetido no cambia nada.
  assert.equal((await avisar('checkout.session.completed', sesion)).status, 200);
  assert.equal((await (await api(`/api/reservations/${id}`)).json()).estado, 'confirmada');
});

test('si el webhook no llega, la consulta pregunta a Stripe y confirma', async () => {
  const { id } = await (await crear({ hora: '11:30' })).json();
  const sesion = [...stripe.sesiones.values()].find((s) => s.metadata.reservacion === id)!;
  stripe.pagar(sesion.id);
  assert.equal((await (await api(`/api/reservations/${id}`)).json()).estado, 'confirmada');
});

test('cupo: no se pasa de 10 personas que se traslapan, y cancelar libera el lugar', async () => {
  const a = await crear({ hora: '17:00', personas: 6 });
  assert.equal(a.status, 201);
  const b = await crear({ hora: '17:30', personas: 4 });
  assert.equal(b.status, 201);
  // 17:00 + 90 min se cruza con 18:00: ya hay 10.
  assert.equal(await disponible('18:00'), false);
  const lleno = await crear({ hora: '18:00', personas: 1 });
  assert.equal(lleno.status, 409);
  assert.equal((await lleno.json()).error, 'sin_cupo');
  // 18:30 ya no se cruza con 17:00 (termina 18:30), pero sí con 17:30 (4 personas).
  assert.equal(await disponible('18:30', 6), true);
  assert.equal(await disponible('18:30', 7), false);

  // La persona vuelve de Stripe sin pagar: se vence la sesión y se libera el lugar.
  const { id } = await a.json();
  const c = await (await api(`/api/reservations/${id}/cancel`, { method: 'POST', headers: { Origin: BASE } })).json();
  assert.equal(c.estado, 'cancelada');
  const sesion = [...stripe.sesiones.values()].find((s) => s.metadata.reservacion === id)!;
  assert.equal(sesion.status, 'expired', 'la sesión de pago ya no se puede usar');
  assert.equal(await disponible('18:00', 6), true);
});

test('reservas simultáneas: el servidor no deja pasar del cupo', async () => {
  const respuestas = await Promise.all(Array.from({ length: 6 }, (_, i) => crear({ hora: '20:30', personas: 4, email: `grupo${i}@example.com` })));
  const creadas = respuestas.filter((r) => r.status === 201).length;
  const rechazadas = respuestas.filter((r) => r.status === 409).length;
  assert.equal(creadas, 2, '2 × 4 = 8 caben; una tercera (12) no');
  assert.equal(rechazadas, 4);
});

test('sesión vencida: el lugar se libera', async () => {
  const r = await crear({ hora: '14:00', personas: 10 });
  const { id } = await r.json();
  assert.equal(await disponible('14:00'), false);
  const sesion = [...stripe.sesiones.values()].find((s) => s.metadata.reservacion === id)!;
  sesion.status = 'expired';
  await avisar('checkout.session.expired', sesion);
  assert.equal((await (await api(`/api/reservations/${id}`)).json()).estado, 'vencida');
  assert.equal(await disponible('14:00'), true);
});

test('pago diferido: procesando y luego fallido (se libera)', async () => {
  const { id } = await (await crear({ hora: '15:00', personas: 10 })).json();
  const sesion = [...stripe.sesiones.values()].find((s) => s.metadata.reservacion === id)!;
  sesion.status = 'complete'; // enviado, sin acreditar
  await avisar('checkout.session.completed', sesion);
  assert.equal((await (await api(`/api/reservations/${id}`)).json()).estado, 'procesando_pago');
  assert.equal(await disponible('15:00'), false, 'mientras se procesa, el lugar sigue apartado');
  await avisar('checkout.session.async_payment_failed', sesion);
  const f = await (await api(`/api/reservations/${id}`)).json();
  assert.equal(f.estado, 'pago_fallido');
  assert.equal(await disponible('15:00'), true);
});

test('si Stripe falla, no queda nada apartado ni cobrado', async () => {
  stripe.fallarPara.add('caida@example.com');
  const r = await crear({ hora: '16:00', personas: 10, email: 'caida@example.com' });
  assert.equal(r.status, 502);
  assert.equal(await disponible('16:00'), true);
});

test('campo trampa: los robots no reservan', async () => {
  assert.equal((await crear({ sitio_web: 'http://spam.example' })).status, 400);
});

test('panel del personal: clave obligatoria, lista y cambios de estado', async () => {
  assert.equal((await api('/api/admin/reservations')).status, 401);
  assert.equal((await api('/api/admin/reservations', { headers: { Authorization: 'Bearer equivocada-equivocada' } })).status, 401);
  const auth = { Authorization: `Bearer ${ADMIN}` };
  const lista = await (await api(`/api/admin/reservations?from=${FECHA}&to=${FECHA}&status=confirmada`, { headers: auth })).json();
  assert.ok(lista.reservaciones.length >= 2);
  const r = lista.reservaciones[0];
  assert.equal(r.telefono, '(210) 555-0134');
  const ok = await api(`/api/admin/reservations/${r.id}`, { method: 'PATCH', headers: { ...auth, 'Content-Type': 'application/json', Origin: BASE }, body: JSON.stringify({ estado: 'sentada' }) });
  assert.equal((await ok.json()).estado, 'sentada');
  const mal = await api(`/api/admin/reservations/${r.id}`, { method: 'PATCH', headers: { ...auth, 'Content-Type': 'application/json', Origin: BASE }, body: JSON.stringify({ estado: 'pendiente_pago' }) });
  assert.equal(mal.status, 409);
});
