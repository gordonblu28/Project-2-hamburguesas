// Stripe sin SDK: la API REST con fetch y la verificación de firmas de webhooks con Web Crypto
// (lo que hay en un Worker de Cloudflare). La clave secreta solo vive en el servidor
// (wrangler secret put STRIPE_SECRET_KEY): nunca llega al navegador ni a este repositorio.

export interface SesionStripe {
  id: string;
  url: string | null;
  status: 'open' | 'complete' | 'expired';
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  amount_total: number | null;
  currency: string | null;
  payment_intent: string | null;
  metadata: Record<string, string> | null;
}

export class ErrorStripe extends Error {
  estado: number;
  codigo: string | undefined;
  constructor(estado: number, codigo: string | undefined, mensaje: string) {
    super(mensaje);
    this.estado = estado;
    this.codigo = codigo;
  }
}

type Valor = string | number | boolean | undefined | Valor[] | { [k: string]: Valor };

/** { a: { b: 1 }, c: [ { d: 2 } ] } → a[b]=1&c[0][d]=2 (el formato que pide la API de Stripe). */
export function formulario(datos: Record<string, Valor>): string {
  const pares: string[] = [];
  const agregar = (clave: string, v: Valor) => {
    if (v === undefined) return;
    if (Array.isArray(v)) v.forEach((x, i) => agregar(`${clave}[${i}]`, x));
    else if (typeof v === 'object') for (const [k, x] of Object.entries(v)) agregar(`${clave}[${k}]`, x);
    else pares.push(`${encodeURIComponent(clave)}=${encodeURIComponent(String(v))}`);
  };
  for (const [k, v] of Object.entries(datos)) agregar(k, v);
  return pares.join('&');
}

export class Stripe {
  private clave: string;
  private base: string;
  // `base` solo lo cambian las pruebas (un Stripe simulado en tests/); en producción, la API real.
  constructor(clave: string, base = 'https://api.stripe.com') {
    this.clave = clave;
    this.base = base;
  }

  private async pedir<T>(metodo: 'GET' | 'POST', ruta: string, datos?: Record<string, Valor>, idempotencia?: string): Promise<T> {
    const cabeceras: Record<string, string> = {
      Authorization: `Bearer ${this.clave}`,
      'Stripe-Version': '2024-06-20',
    };
    if (datos) cabeceras['Content-Type'] = 'application/x-www-form-urlencoded';
    if (idempotencia) cabeceras['Idempotency-Key'] = idempotencia;
    const r = await fetch(`${this.base}${ruta}`, { method: metodo, headers: cabeceras, body: datos ? formulario(datos) : undefined });
    const cuerpo = (await r.json().catch(() => ({}))) as { error?: { code?: string; message?: string } };
    if (!r.ok) throw new ErrorStripe(r.status, cuerpo.error?.code, cuerpo.error?.message ?? `Stripe respondió ${r.status}`);
    return cuerpo as T;
  }

  crearSesion(datos: Record<string, Valor>, idempotencia: string) {
    return this.pedir<SesionStripe>('POST', '/v1/checkout/sessions', datos, idempotencia);
  }

  verSesion(id: string) {
    return this.pedir<SesionStripe>('GET', `/v1/checkout/sessions/${encodeURIComponent(id)}`);
  }

  vencerSesion(id: string) {
    return this.pedir<SesionStripe>('POST', `/v1/checkout/sessions/${encodeURIComponent(id)}/expire`, {});
  }
}

const codificar = new TextEncoder();

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');

/** Compara sin filtrar por el tiempo cuántos caracteres coinciden. */
export function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

export async function firmar(secreto: string, texto: string): Promise<string> {
  const llave = await crypto.subtle.importKey('raw', codificar.encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', llave, codificar.encode(texto)));
}

/** Verifica la cabecera Stripe-Signature (t=…,v1=…) sobre el cuerpo tal cual llegó. */
export async function verificarFirma(cuerpo: string, cabecera: string | null, secreto: string, ahoraSeg: number, tolerancia = 300): Promise<boolean> {
  if (!cabecera) return false;
  let t = '';
  const firmas: string[] = [];
  for (const parte of cabecera.split(',')) {
    const [k, v] = parte.split('=', 2).map((s) => s.trim());
    if (k === 't') t = v;
    else if (k === 'v1' && v) firmas.push(v);
  }
  // Un aviso viejo (o reenviado por un tercero) no se acepta.
  if (!/^\d+$/.test(t) || Math.abs(ahoraSeg - Number(t)) > tolerancia || !firmas.length) return false;
  const esperada = await firmar(secreto, `${t}.${cuerpo}`);
  return firmas.some((f) => iguales(f, esperada));
}
