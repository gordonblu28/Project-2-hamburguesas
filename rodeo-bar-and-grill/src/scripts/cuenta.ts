// Cuenta regresiva de la temporada. El final viene calculado desde la hora local del negocio
// (data-temporada-fin en <html>, en UTC), así que todos los visitantes ven el mismo vencimiento,
// en el teléfono o en el escritorio y en cualquier zona horaria.
// · [data-cuenta]: marcador grande; cada cifra es un <span class="cifra"> que se anima al cambiar.
// · [data-cuenta-corta]: texto breve ("Ends in 11d 04h 32m") en los accesos del sitio.
// · Al llegar a cero se detiene: [data-solo-vigente] se oculta, [data-solo-terminada] aparece y,
//   con al_terminar: ocultar, también los accesos [data-temporada-aviso]. Nunca muestra negativos.
import { movimientoActivo } from './movimiento';

const MS = { d: 86_400_000, h: 3_600_000, m: 60_000, s: 1000 };
const dos = (n: number) => String(n).padStart(2, '0');
const plural = (n: number, palabra: string) => `${n} ${palabra}${n === 1 ? '' : 's'}`;

export function iniciarCuentas() {
  const html = document.documentElement;
  const fin = Date.parse(html.dataset.temporadaFin ?? '');
  if (Number.isNaN(fin)) return;
  const alTerminar = html.dataset.temporadaAlTerminar === 'ocultar' ? 'ocultar' : 'mensaje';
  const mensaje = html.dataset.temporadaMensaje || 'This seasonal special has ended';
  const marcadores = Array.from(document.querySelectorAll<HTMLElement>('[data-cuenta]'));
  const cortas = Array.from(document.querySelectorAll<HTMLElement>('[data-cuenta-corta]'));
  let reloj: number | undefined;
  let primera = true;
  let ultimaLectura = '';

  function terminar() {
    window.clearTimeout(reloj);
    html.dataset.temporada = 'terminada';
    document.querySelectorAll<HTMLElement>('[data-solo-vigente]').forEach((el) => (el.hidden = true));
    document.querySelectorAll<HTMLElement>('[data-solo-terminada]').forEach((el) => (el.hidden = false));
    cortas.forEach((c) => (c.textContent = mensaje));
    if (alTerminar === 'ocultar') {
      document.querySelectorAll<HTMLElement>('[data-temporada-aviso]').forEach((el) => (el.hidden = true));
    }
  }

  // Escribe un valor cifra por cifra; solo las que cambian se animan.
  function escribir(unidad: HTMLElement, valor: string) {
    let cifras = Array.from(unidad.querySelectorAll<HTMLElement>('.cifra'));
    while (cifras.length < valor.length) {
      const s = document.createElement('span');
      s.className = 'cifra';
      unidad.prepend(s);
      cifras = [s, ...cifras];
    }
    while (cifras.length > valor.length) cifras.shift()!.remove();
    cifras.forEach((c, i) => {
      if (c.textContent === valor[i]) return;
      c.textContent = valor[i];
      if (primera || !movimientoActivo()) return;
      c.classList.remove('cifra--cambia');
      void c.offsetWidth;
      c.classList.add('cifra--cambia');
    });
  }

  function pintar() {
    const resta = fin - Date.now();
    if (!(resta > 0)) return terminar();
    const d = Math.floor(resta / MS.d);
    const h = Math.floor((resta % MS.d) / MS.h);
    const m = Math.floor((resta % MS.h) / MS.m);
    const s = Math.floor((resta % MS.m) / MS.s);
    const valores: Record<string, string> = { d: dos(d), h: dos(h), m: dos(m), s: dos(s) };

    // Para lectores de pantalla, una frase que cambia cada minuto (no cada segundo).
    const lectura = `${plural(d, 'day')}, ${plural(h, 'hour')} and ${plural(m, 'minute')} left`;
    for (const marcador of marcadores) {
      marcador.querySelectorAll<HTMLElement>('[data-unidad]').forEach((u) => {
        const v = valores[u.dataset.unidad ?? ''];
        if (v !== undefined) escribir(u, v);
      });
      const destino = marcador.querySelector<HTMLElement>('[data-cuenta-lectura]');
      if (destino && lectura !== ultimaLectura) destino.textContent = lectura;
    }
    ultimaLectura = lectura;
    const corto = d > 0 ? `Ends in ${d}d ${dos(h)}h ${dos(m)}m` : `Ends in ${dos(h)}h ${dos(m)}m ${dos(s)}s`;
    cortas.forEach((c) => (c.textContent = corto));
    primera = false;
    html.dataset.temporada = 'vigente';
    // Se alinea con el cambio de segundo del reloj del dispositivo.
    reloj = window.setTimeout(pintar, 1000 - (Date.now() % 1000) + 8);
  }

  pintar();
  // Al volver a la pestaña se recalcula de inmediato (los temporizadores se frenan en segundo plano).
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    window.clearTimeout(reloj);
    pintar();
  });
}
