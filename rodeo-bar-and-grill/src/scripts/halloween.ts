// Portada de Halloween: la atmósfera (luz, brasas, bruma, luna) es CSS; aquí solo se pausa
// cuando la portada sale de la pantalla y, con mouse, se da profundidad a las capas de la noche.
import { gsap } from 'gsap';
import { movimientoActivo, alCambiarMovimiento } from './movimiento';

export function iniciarHalloween() {
  const noche = document.querySelector<HTMLElement>('[data-noche]');
  if (!noche) return;

  new IntersectionObserver(([e]) => noche.classList.toggle('noche--quieta', !e.isIntersecting)).observe(noche);

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  // Cada capa se mueve a su ritmo: la luna lejos y despacio, la colina con el jinete más cerca.
  const capas = [
    { el: noche.querySelector<HTMLElement>('[data-capa="luna"]'), f: -12 },
    { el: noche.querySelector<HTMLElement>('[data-capa="lejos"]'), f: -6 },
    { el: noche.querySelector<HTMLElement>('[data-capa="cerca"]'), f: 9 },
    { el: noche.querySelector<HTMLElement>('[data-capa="resplandor"]'), f: 22 },
  ].filter((c): c is { el: HTMLElement; f: number } => !!c.el);
  const mover = capas.map((c) => ({
    x: gsap.quickTo(c.el, 'x', { duration: 1.4, ease: 'power3.out' }),
    y: gsap.quickTo(c.el, 'y', { duration: 1.4, ease: 'power3.out' }),
    f: c.f,
  }));
  const volver = () => mover.forEach((m) => (m.x(0), m.y(0)));

  noche.addEventListener('pointermove', (e) => {
    if (!movimientoActivo()) return;
    const r = noche.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    mover.forEach((m) => {
      m.x(nx * m.f);
      m.y(ny * m.f * 0.6);
    });
  });
  noche.addEventListener('pointerleave', volver);
  alCambiarMovimiento((activo) => !activo && volver());
}
