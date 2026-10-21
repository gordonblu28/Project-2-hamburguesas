// Inicio: el jinete entra corcoveando, lanza el lazo y atrapa el plato destacado.
// Después, cada pocos segundos da un "jalón" y el lazo cambia de plato (pausable).
import { gsap } from 'gsap';
import { movimientoActivo, alCambiarMovimiento } from './movimiento';

const CUERDA_SUELTA = 'M286 130 C300 64 222 40 176 94';
const CUERDA_TENSA = 'M286 130 C274 106 216 86 176 94';
const INTERVALO = 5;

export function iniciarInicio() {
  const escena = document.querySelector<HTMLElement>('[data-escena]');
  if (!escena) return;

  const jinete = escena.querySelector<HTMLElement>('[data-jinete]')!;
  const medallon = escena.querySelector<HTMLElement>('.medallon')!;
  const plato = medallon.querySelector<HTMLElement>('.medallon__plato')!;
  const fotos = Array.from(plato.querySelectorAll<HTMLImageElement>('img'));
  const pies = Array.from(escena.querySelectorAll<HTMLElement>('[data-pie]'));
  const cuerdas = Array.from(escena.querySelectorAll<SVGPathElement>('[data-cuerda]'));
  const boton = escena.querySelector<HTMLButtonElement>('[data-siguiente]');

  let actual = 0;
  let ocupado = false;
  let pendiente = false;
  let ciclo: gsap.core.Tween | null = null;
  let respiracion: gsap.core.Tween | null = null;
  let visible = true;
  let encima = false;

  fotos.forEach((f, i) => (f.style.visibility = i === 0 ? 'visible' : 'hidden'));

  // ── Entrada ── (en CSS, ver index.astro: el jinete entra corcoveando, lanza el lazo y atrapa
  // el plato). Al terminar arrancan el balanceo y el ciclo de platos.
  if (movimientoActivo()) {
    const retraso = document.documentElement.classList.contains('con-puerta') ? 0.55 : 0;
    gsap.delayedCall(retraso + 2.1, () => {
      arrancarCiclo();
      respirar();
    });
  }

  // ── Jalón: cambia de plato ──
  function mostrar(siguiente: number, anunciar: boolean) {
    if (fotos.length < 2) return;
    // Un toque durante el cambio no se pierde: se hace al terminar.
    if (ocupado) {
      if (anunciar) pendiente = true;
      return;
    }
    const sale = fotos[actual];
    const entraFoto = fotos[siguiente];
    const pieSale = pies[actual];
    const pieEntra = pies[siguiente];
    actual = siguiente;
    escena!.querySelector('.hero__pies')?.setAttribute('aria-live', anunciar ? 'polite' : 'off');

    if (!movimientoActivo()) {
      sale.style.visibility = 'hidden';
      entraFoto.style.visibility = 'visible';
      if (pieSale) pieSale.hidden = true;
      if (pieEntra) pieEntra.hidden = false;
      return;
    }

    ocupado = true;
    gsap
      .timeline({
        onComplete: () => {
          ocupado = false;
          if (pendiente) {
            pendiente = false;
            avanzar(true);
          }
        },
      })
      .to(jinete, { rotate: -8, x: -8, duration: 0.16, ease: 'power2.out' })
      .to(cuerdas, { attr: { d: CUERDA_TENSA }, duration: 0.16, ease: 'power2.out' }, '<')
      .to(medallon, { scale: 0.92, duration: 0.16, ease: 'power2.out' }, '<')
      .set(entraFoto, { visibility: 'visible', zIndex: 2, clipPath: 'circle(0% at 50% 50%)', rotate: -55, scale: 1.18 })
      .to(sale, { rotate: 45, scale: 0.82, duration: 0.42, ease: 'power3.in' }, '<0.05')
      .to(entraFoto, { clipPath: 'circle(75% at 50% 50%)', rotate: 0, scale: 1, duration: 0.65, ease: 'expo.out' }, '-=0.22')
      .to(jinete, { rotate: 0, x: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' }, '<')
      .to(cuerdas, { attr: { d: CUERDA_SUELTA }, duration: 0.7, ease: 'elastic.out(1, 0.32)' }, '<')
      .to(medallon, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.4)' }, '<')
      .set(sale, { visibility: 'hidden', clearProps: 'transform,zIndex,clipPath' })
      .set(entraFoto, { clearProps: 'zIndex,clipPath' });

    if (pieSale && pieEntra) {
      gsap
        .timeline()
        .to(pieSale, { clipPath: 'inset(0 0 0 100%)', duration: 0.25, ease: 'power2.in' })
        .add(() => {
          pieSale.hidden = true;
          pieEntra.hidden = false;
        })
        .fromTo(
          pieEntra,
          { clipPath: 'inset(0 100% 0 0)' },
          { clipPath: 'inset(0 0% 0 0)', duration: 0.45, ease: 'power3.out', clearProps: 'clipPath' },
        )
        .set(pieSale, { clearProps: 'clipPath' });
    }
  }

  const avanzar = (anunciar: boolean) => mostrar((actual + 1) % fotos.length, anunciar);

  function puedeCorrer() {
    return movimientoActivo() && visible && !encima && !document.hidden;
  }

  function arrancarCiclo() {
    ciclo?.kill();
    if (fotos.length < 2) return;
    ciclo = gsap.delayedCall(INTERVALO, function repetir() {
      if (puedeCorrer()) avanzar(false);
      ciclo = gsap.delayedCall(INTERVALO, repetir);
    });
  }

  // Leve balanceo del jinete mientras espera.
  function respirar() {
    respiracion?.kill();
    if (!movimientoActivo()) return;
    respiracion = gsap.to(jinete.querySelector('.silueta'), {
      rotate: 2.2,
      y: -3,
      duration: 1.3,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      transformOrigin: '62% 96%',
    });
  }

  boton?.addEventListener('click', () => {
    avanzar(true);
    arrancarCiclo();
  });

  // Pausa al pasar el cursor o el foco, fuera de pantalla y con la pestaña oculta.
  escena.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && (encima = true));
  escena.addEventListener('pointerleave', () => (encima = false));
  escena.addEventListener('focusin', () => (encima = true));
  escena.addEventListener('focusout', () => (encima = false));
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(escena);

  alCambiarMovimiento((activo) => {
    if (activo) {
      arrancarCiclo();
      respirar();
    } else {
      ciclo?.kill();
      respiracion?.kill();
      gsap.set(jinete.querySelector('.silueta'), { clearProps: 'transform' });
    }
  });

  // Profundidad con el cursor (solo con mouse): capas que se mueven a distinto ritmo.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const capas = [
      { el: medallon, f: 14 },
      { el: jinete, f: -9 },
      { el: escena.querySelector<HTMLElement>('[data-sol]'), f: -4 },
      { el: document.querySelector<HTMLElement>('.hero__titulo'), f: 5 },
    ].filter((c): c is { el: HTMLElement; f: number } => !!c.el);
    const mover = capas.map((c) => ({
      x: gsap.quickTo(c.el, 'x', { duration: 0.8, ease: 'power3.out' }),
      y: gsap.quickTo(c.el, 'y', { duration: 0.8, ease: 'power3.out' }),
      f: c.f,
    }));
    const hero = document.querySelector<HTMLElement>('.hero');
    hero?.addEventListener('pointermove', (e) => {
      if (!movimientoActivo() || ocupado) return;
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      mover.forEach((m) => {
        m.x(nx * m.f);
        m.y(ny * m.f);
      });
    });
    hero?.addEventListener('pointerleave', () => mover.forEach((m) => (m.x(0), m.y(0))));
  }
}
