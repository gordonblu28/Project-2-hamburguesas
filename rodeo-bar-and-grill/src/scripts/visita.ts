// Visítenos: el boleto sale de la ranura de la taquilla y el botón copia la dirección.
import { gsap } from 'gsap';
import { movimientoActivo } from './movimiento';
import { cuandoAbra } from './puerta';

export async function iniciarVisita() {
  const boleto = document.querySelector<HTMLElement>('[data-boleto]');
  if (!boleto) return;

  const copiar = boleto.querySelector<HTMLButtonElement>('[data-copiar]');
  if (copiar && navigator.clipboard) {
    copiar.hidden = false;
    const texto = copiar.textContent;
    copiar.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(copiar.dataset.copiar ?? '');
        copiar.textContent = 'Copied!';
        if (movimientoActivo()) gsap.fromTo(copiar, { rotate: -6, scale: 1.12 }, { rotate: 0, scale: 1, duration: 0.5, ease: 'back.out(3)' });
      } catch {
        copiar.textContent = 'Could not copy';
      }
      setTimeout(() => (copiar.textContent = texto), 2200);
    });
  }

  if (!movimientoActivo()) return;
  await cuandoAbra();
  const talon = boleto.querySelector('.boleto__talon');
  const filas = boleto.querySelectorAll('.boleto__cuerpo > *');
  gsap
    .timeline()
    // El boleto se imprime: sale de la ranura de arriba hacia abajo y se asienta con un vaivén.
    .fromTo(boleto, { clipPath: 'inset(0 0 100% 0)', y: -24 }, { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.9, ease: 'power3.out', clearProps: 'clipPath' })
    .fromTo(boleto, { rotate: 0 }, { keyframes: [{ rotate: -1.6, duration: 0.18 }, { rotate: 1, duration: 0.2 }, { rotate: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' }] }, 0.55)
    .fromTo(filas, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out', stagger: 0.06, clearProps: 'all' }, 0.25)
    .fromTo(talon, { rotate: -4 }, { rotate: 0, duration: 0.8, ease: 'elastic.out(1, 0.35)', clearProps: 'transform' }, 0.7);
}
