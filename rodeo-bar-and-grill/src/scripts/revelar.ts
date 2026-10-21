// Revelado al entrar en pantalla ([data-revela]: "sube", "tira" o "arco") y profundidad suave al
// desplazarse ([data-paralaje]: factor, positivo baja más lento que la página).
// Con movimiento reducido todo aparece en su sitio y sin desplazamientos.
import { movimientoActivo, alCambiarMovimiento } from './movimiento';
import { cuandoAbra } from './puerta';

declare global {
  interface Window {
    __rodeoRevela?: boolean;
  }
}

export function iniciarRevelado() {
  window.__rodeoRevela = true;
  const elementos = Array.from(document.querySelectorAll<HTMLElement>('[data-revela]'));
  const mostrarTodo = () => elementos.forEach((e) => e.classList.add('revelado'));

  if (!movimientoActivo() || !('IntersectionObserver' in window)) {
    mostrarTodo();
  } else {
    const io = new IntersectionObserver(
      (entradas) => {
        for (const en of entradas) {
          if (!en.isIntersecting) continue;
          en.target.classList.add('revelado');
          io.unobserve(en.target);
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.08 },
    );
    cuandoAbra().then(() => elementos.forEach((e) => io.observe(e)));
  }

  // ── Profundidad al desplazarse ──
  const capas = Array.from(document.querySelectorAll<HTMLElement>('[data-paralaje]'));
  let pendiente = false;
  const movil = window.matchMedia('(max-width: 899px)');

  function mover() {
    pendiente = false;
    const activo = movimientoActivo();
    const alto = window.innerHeight;
    const escala = movil.matches ? 0.5 : 1;
    for (const c of capas) {
      if (!activo) {
        c.style.removeProperty('--py');
        continue;
      }
      // Se mide el contenedor (que no se mueve) para no realimentar el cálculo.
      const r = (c.parentElement ?? c).getBoundingClientRect();
      if (r.bottom < -alto * 0.5 || r.top > alto * 1.5) continue;
      const desde = r.top + r.height / 2 - alto / 2;
      const f = Number(c.dataset.paralaje) || 0.08;
      c.style.setProperty('--py', `${(-desde * f * escala).toFixed(1)}px`);
    }
  }

  const pedir = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(mover);
  };

  if (capas.length) {
    mover();
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir, { passive: true });
  }

  alCambiarMovimiento((activo) => {
    if (!activo) mostrarTodo();
    pedir();
  });
}
