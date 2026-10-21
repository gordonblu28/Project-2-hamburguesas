// Transiciones entre páginas (ver components/Puerta.astro).
// · Puerta de corral dentro del sitio principal. Salida: las hojas se cierran y se navega.
//   Llegada: la página nueva aparece con la puerta cerrada (clase puesta en <head> antes de
//   pintar) y se abre girando hacia afuera.
// · Velo al cruzar entre el sitio principal y Halloween: un círculo del color de la otra
//   identidad se abre desde donde se tocó; en la página nueva el velo se disuelve.
import { gsap } from 'gsap';
import { movimientoActivo } from './movimiento';

const html = document.documentElement;
const MARCA = 'rodeo-puerta';
let abierta: Promise<void> = Promise.resolve();

const partes = () => {
  const puerta = document.querySelector<HTMLElement>('.puerta');
  return {
    izq: puerta?.querySelector<HTMLElement>('.puerta__hoja--izq'),
    der: puerta?.querySelector<HTMLElement>('.puerta__hoja--der'),
    cerrojo: puerta?.querySelector<HTMLElement>('.puerta__cerrojo'),
    velo: document.querySelector<HTMLElement>('.velo'),
  };
};

function limpiar() {
  const { izq, der, cerrojo, velo } = partes();
  html.classList.remove('puerta-activa', 'puerta-cerrada', 'velo-activo', 'velo-cerrado');
  gsap.set([izq, der, cerrojo, velo].filter(Boolean), { clearProps: 'all' });
  velo?.removeAttribute('data-hacia');
}

/** Promesa que se cumple cuando la puerta (o el velo) terminó de abrirse, o de inmediato si no hay. */
export const cuandoAbra = () => abierta;

function abrir() {
  const { izq, der, cerrojo, velo } = partes();
  if (html.classList.contains('velo-cerrado') && velo) {
    abierta = new Promise((listo) => {
      gsap.to(velo, { opacity: 0, duration: 0.75, ease: 'power2.out', delay: 0.05, onComplete: () => (limpiar(), listo()) });
      setTimeout(listo, 260);
    });
    return;
  }
  if (!html.classList.contains('puerta-cerrada') || !izq || !der || !cerrojo) return;
  abierta = new Promise((listo) => {
    gsap
      .timeline({ onComplete: () => (limpiar(), listo()), defaults: { overwrite: true } })
      // El bronco patea la puerta antes de que se abra.
      .to([izq, der], { x: (i) => (i ? 7 : -7), duration: 0.06, repeat: 3, yoyo: true, ease: 'power1.inOut' })
      .to(cerrojo, { scale: 0, rotate: 120, duration: 0.22, ease: 'back.in(2)' }, '<0.1')
      .to(izq, { rotateY: -112, x: '-6%', duration: 0.8, ease: 'expo.out' }, '>-0.05')
      .to(der, { rotateY: 112, x: '6%', duration: 0.8, ease: 'expo.out' }, '<')
      .to([izq, der], { autoAlpha: 0, duration: 0.25, ease: 'none' }, '-=0.35');
    // Las primeras animaciones de la página pueden empezar con la puerta a medio abrir.
    setTimeout(listo, 380);
  });
}

function marcar(paso: 'puerta' | 'velo') {
  try {
    sessionStorage.setItem(MARCA, paso);
  } catch {
    /* sin sessionStorage la página nueva simplemente no muestra la apertura */
  }
}

function cerrarYNavegar(destino: string) {
  const { izq, der, cerrojo } = partes();
  if (!izq || !der || !cerrojo) return location.assign(destino);
  marcar('puerta');
  html.classList.add('puerta-activa');
  gsap
    .timeline({ onComplete: () => location.assign(destino) })
    .fromTo(izq, { x: '-102%', rotateY: 0, autoAlpha: 1 }, { x: '0%', duration: 0.36, ease: 'power3.in' })
    .fromTo(der, { x: '102%', rotateY: 0, autoAlpha: 1 }, { x: '0%', duration: 0.36, ease: 'power3.in' }, '<')
    .fromTo(cerrojo, { scale: 0, rotate: -90 }, { scale: 1, rotate: 0, duration: 0.2, ease: 'back.out(3)' }, '-=0.04');
}

function cubrirYNavegar(destino: string, hacia: 'noche' | 'dia', x: number, y: number) {
  const { velo } = partes();
  if (!velo) return location.assign(destino);
  marcar('velo');
  velo.dataset.hacia = hacia;
  html.classList.add('velo-activo');
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 8;
  gsap.fromTo(
    velo,
    { clipPath: `circle(0px at ${x}px ${y}px)`, opacity: 1 },
    { clipPath: `circle(${r}px at ${x}px ${y}px)`, duration: 0.62, ease: 'power2.inOut', onComplete: () => location.assign(destino) },
  );
}

const normal = (ruta: string) => (ruta.endsWith('/') ? ruta : `${ruta}/`);

function identidad(ruta: string): 'noche' | 'dia' {
  const temporada = html.dataset.rutaTemporada;
  return temporada && normal(ruta).startsWith(temporada) ? 'noche' : 'dia';
}

function esNavegacionInterna(e: MouseEvent, a: HTMLAnchorElement): URL | null {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  if (a.target && a.target !== '_self') return null;
  if (a.hasAttribute('download') || a.dataset.sinPuerta !== undefined) return null;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return null;
  // Mismo documento (anclas o cambios de ?c= en el menú): no es un cambio de página.
  if (url.pathname === location.pathname) return null;
  return url;
}

export function iniciarPuerta() {
  abrir();
  // Red de seguridad: si algo falla, la puerta o el velo nunca quedan tapando la página.
  setTimeout(() => (html.classList.contains('puerta-cerrada') || html.classList.contains('velo-cerrado')) && limpiar(), 2500);

  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest?.('a');
    if (!a || !(a instanceof HTMLAnchorElement)) return;
    const url = esNavegacionInterna(e, a);
    if (!url || !movimientoActivo()) return;
    e.preventDefault();
    const hacia = identidad(url.pathname);
    if (hacia !== identidad(location.pathname)) {
      // Con teclado no hay coordenadas: el círculo nace del centro del enlace.
      const r = a.getBoundingClientRect();
      const x = e.clientX || r.left + r.width / 2;
      const y = e.clientY || r.top + r.height / 2;
      cubrirYNavegar(url.href, hacia, x, y);
    } else {
      cerrarYNavegar(url.href);
    }
  });

  // Volver con el botón atrás puede restaurar la página tapada: se reinicia.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) limpiar();
  });
}
