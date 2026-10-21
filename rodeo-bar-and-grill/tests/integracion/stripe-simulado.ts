// Stripe simulado para las pruebas: imita las rutas de Checkout que usa worker/stripe.ts.
// Nunca toca la API real ni tarjetas: las sesiones viven en memoria.
import { createServer, type Server } from 'node:http';

export interface SesionSimulada {
  id: string;
  url: string;
  status: 'open' | 'complete' | 'expired';
  payment_status: 'paid' | 'unpaid';
  amount_total: number;
  currency: string;
  payment_intent: string | null;
  metadata: Record<string, string>;
  customer_email: string;
  expires_at: number;
}

export function stripeSimulado(puerto: number) {
  const sesiones = new Map<string, SesionSimulada>();
  const fallarPara = new Set<string>();
  let n = 0;
  const servidor: Server = createServer((req, res) => {
    let cuerpo = '';
    req.on('data', (c) => (cuerpo += c));
    req.on('end', () => {
      const responder = (estado: number, datos: unknown) => {
        res.writeHead(estado, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(datos));
      };
      // Atajo de las pruebas con navegador: "paga" una sesión como lo haría la persona en Stripe.
      const atajo = (req.url ?? '').match(/^\/__pagar\/([^/]+)$/);
      if (req.method === 'POST' && atajo && sesiones.has(atajo[1])) return responder(200, pagar(atajo[1]));
      if (req.headers.authorization !== 'Bearer sk_test_simulado') return responder(401, { error: { message: 'bad key' } });
      const f = new URLSearchParams(cuerpo);
      const ruta = req.url ?? '';
      if (req.method === 'POST' && ruta === '/v1/checkout/sessions') {
        if (fallarPara.has(f.get('customer_email') ?? '')) return responder(500, { error: { message: 'simulated outage' } });
        const id = `cs_test_${++n}`;
        const s: SesionSimulada = {
          id,
          url: `https://checkout.stripe.test/${id}`,
          status: 'open',
          payment_status: 'unpaid',
          amount_total: Number(f.get('line_items[0][price_data][unit_amount]')),
          currency: f.get('line_items[0][price_data][currency]') ?? '',
          payment_intent: null,
          metadata: { reservacion: f.get('metadata[reservacion]') ?? '', codigo: f.get('metadata[codigo]') ?? '' },
          customer_email: f.get('customer_email') ?? '',
          expires_at: Number(f.get('expires_at')),
        };
        sesiones.set(id, s);
        return responder(200, s);
      }
      const ver = ruta.match(/^\/v1\/checkout\/sessions\/([^/]+)$/);
      if (req.method === 'GET' && ver) {
        const s = sesiones.get(ver[1]);
        return s ? responder(200, s) : responder(404, { error: { code: 'resource_missing' } });
      }
      const vencer = ruta.match(/^\/v1\/checkout\/sessions\/([^/]+)\/expire$/);
      if (req.method === 'POST' && vencer) {
        const s = sesiones.get(vencer[1]);
        if (!s) return responder(404, { error: { code: 'resource_missing' } });
        if (s.status !== 'open') return responder(400, { error: { code: 'checkout_session_not_open', message: 'not open' } });
        s.status = 'expired';
        return responder(200, s);
      }
      responder(404, { error: { message: `no route ${req.method} ${ruta}` } });
    });
  });
  function pagar(id: string) {
    const s = sesiones.get(id)!;
    s.status = 'complete';
    s.payment_status = 'paid';
    s.payment_intent = `pi_test_${id}`;
    return s;
  }
  return {
    sesiones,
    fallarPara,
    pagar,
    iniciar: () =>
      new Promise<void>((ok, falla) => {
        servidor.once('error', falla);
        servidor.listen(puerto, '127.0.0.1', () => ok());
      }),
    cerrar: () => new Promise<void>((ok) => servidor.close(() => ok())),
  };
}
