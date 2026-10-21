// Favoritos: un plato a la vez. Al cambiar, el lazo "lanza" el plato saliente girando y atrapa
// el siguiente; el nombre gigante del fondo se desliza. Con el cursor, el plato gana profundidad
// (inclinación 3D y brillo); en el teléfono se arrastra con el dedo.
import { gsap } from 'gsap';
import { movimientoActivo } from './movimiento';
import { cuandoAbra } from './puerta';

export async function iniciarFavoritos() {
  const raiz = document.querySelector<HTMLElement>('[data-favoritos]');
  if (!raiz) return;
  const lista = raiz.querySelector<HTMLElement>('[data-lista]')!;
  const diapos = Array.from(raiz.querySelectorAll<HTMLElement>('[data-favorito]'));
  const puntos = Array.from(raiz.querySelectorAll<HTMLButtonElement>('[data-punto]'));
  const controles = raiz.querySelector<HTMLElement>('[data-controles]')!;
  const anuncio = raiz.querySelector<HTMLElement>('[data-anuncio]')!;
  if (diapos.length < 2) return;

  raiz.classList.add('favoritos--carrusel');
  controles.hidden = false;
  let actual = 0;
  let ocupado = false;

  // Diapositiva inicial desde ?d=id (enlace compartible).
  const pedida = new URLSearchParams(location.search).get('d');
  const i0 = diapos.findIndex((d) => d.dataset.favorito === pedida);
  if (i0 > 0) actual = i0;
  diapos[actual].setAttribute('data-activo', '');
  marcar(actual);

  const piezas = (d: HTMLElement) => ({
    plato: d.querySelector<HTMLElement>('[data-plato]')!,
    fondo: d.querySelector<HTMLElement>('.favorito__fondo')!,
    lazo: d.querySelector<SVGElement>('.lazo-trazo'),
    info: Array.from(d.querySelectorAll<HTMLElement>('[data-info] > *')),
    precios: Array.from(d.querySelectorAll<HTMLElement>('.favorito__precio, .favorito__precios strong')),
  });

  function marcar(i: number) {
    puntos.forEach((p, j) => {
      p.setAttribute('aria-selected', String(i === j));
      p.tabIndex = i === j ? 0 : -1;
    });
    const url = new URL(location.href);
    url.searchParams.set('d', diapos[i].dataset.favorito!);
    history.replaceState(history.state, '', url);
  }

  function entrada(d: HTMLElement, dir: number, primera = false) {
    const { plato, fondo, lazo, info, precios } = piezas(d);
    const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
    tl.fromTo(fondo, { xPercent: 22 * dir, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out' }, 0)
      .fromTo(
        plato,
        { x: () => (primera ? 0 : window.innerWidth * 0.55 * dir), rotate: primera ? -90 : 160 * dir, scale: 0.55, opacity: 0 },
        { x: 0, rotate: 0, scale: 1, opacity: 1, duration: 0.95, ease: 'elastic.out(1, 0.6)' },
        0.04,
      )
      .fromTo(lazo, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.55, ease: 'power2.out' }, 0.18)
      .fromTo(
        info,
        { opacity: 0, clipPath: dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)', x: 24 * dir },
        { opacity: 1, clipPath: 'inset(0 0% 0 0%)', x: 0, duration: 0.55, ease: 'power3.out', stagger: 0.06, clearProps: 'clipPath,x' },
        0.12,
      )
      // Precio: cae como sello de hierro y su sombra de tinta se seca.
      .fromTo(
        precios,
        { scale: 1.7, rotate: -10, textShadow: '0 0 16px rgba(20, 18, 15, 0.55)' },
        { scale: 1, rotate: 0, textShadow: '0 0 0px rgba(20, 18, 15, 0)', duration: 0.55, ease: 'back.out(3)', stagger: 0.06, clearProps: 'all' },
        0.35,
      );
    return tl;
  }

  async function ir(i: number, dir: number) {
    const n = diapos.length;
    const siguiente = (i + n) % n;
    if (ocupado || siguiente === actual) return;
    const sale = diapos[actual];
    const entra = diapos[siguiente];
    actual = siguiente;
    marcar(siguiente);
    anuncio.textContent = entra.getAttribute('aria-label') ?? '';

    if (!movimientoActivo()) {
      sale.removeAttribute('data-activo');
      entra.setAttribute('data-activo', '');
      return;
    }
    ocupado = true;
    const s = piezas(sale);
    await gsap
      .timeline()
      .to(s.plato, { x: -window.innerWidth * 0.5 * dir, rotate: -150 * dir, scale: 0.6, opacity: 0, duration: 0.42, ease: 'power3.in' })
      .to(s.fondo, { xPercent: -25 * dir, opacity: 0, duration: 0.35, ease: 'power2.in' }, 0)
      .to(s.info, { opacity: 0, x: -20 * dir, duration: 0.22, ease: 'power2.in', stagger: 0.02 }, 0)
      .then();
    gsap.set([s.plato, s.fondo, ...s.info], { clearProps: 'all' });
    sale.removeAttribute('data-activo');
    entra.setAttribute('data-activo', '');
    entrada(entra, dir).eventCallback('onComplete', () => void (ocupado = false));
    // No bloquear demasiado: se puede volver a cambiar antes de que termine el rebote.
    gsap.delayedCall(0.45, () => void (ocupado = false));
  }

  raiz.querySelectorAll<HTMLButtonElement>('[data-paso]').forEach((b) =>
    b.addEventListener('click', () => {
      const paso = Number(b.dataset.paso);
      ir(actual + paso, paso);
    }),
  );
  puntos.forEach((p, i) => p.addEventListener('click', () => ir(i, i > actual ? 1 : -1)));
  raiz.querySelector('.favoritos__puntos')?.addEventListener('keydown', (e) => {
    const k = (e as KeyboardEvent).key;
    if (k !== 'ArrowRight' && k !== 'ArrowLeft') return;
    e.preventDefault();
    const paso = k === 'ArrowRight' ? 1 : -1;
    ir(actual + paso, paso);
    puntos[actual]?.focus();
  });
  document.addEventListener('keydown', (e) => {
    if ((e.target as Element).closest('input, textarea, [role="tablist"]')) return;
    if (e.key === 'ArrowRight') ir(actual + 1, 1);
    if (e.key === 'ArrowLeft') ir(actual - 1, -1);
  });

  // ── Arrastre con el dedo (o el mouse) sobre el plato ──
  let arrastre: { x: number; y: number; id: number; horizontal: boolean | null; t: number } | null = null;
  lista.addEventListener('pointerdown', (e) => {
    if ((e.target as Element).closest('a, button')) return;
    arrastre = { x: e.clientX, y: e.clientY, id: e.pointerId, horizontal: null, t: performance.now() };
  });
  lista.addEventListener('pointermove', (e) => {
    if (!arrastre || e.pointerId !== arrastre.id) return;
    const dx = e.clientX - arrastre.x;
    const dy = e.clientY - arrastre.y;
    if (arrastre.horizontal === null && Math.hypot(dx, dy) > 8) {
      arrastre.horizontal = Math.abs(dx) > Math.abs(dy);
      if (arrastre.horizontal) lista.setPointerCapture(e.pointerId);
    }
    if (!arrastre.horizontal || !movimientoActivo()) return;
    const { plato, fondo } = piezas(diapos[actual]);
    gsap.set(plato, { x: dx * 0.7, rotate: dx * 0.08, rotateY: dx * 0.04 });
    gsap.set(fondo, { x: dx * -0.25 });
  });
  const soltar = (e: PointerEvent) => {
    if (!arrastre || e.pointerId !== arrastre.id) return;
    const dx = e.clientX - arrastre.x;
    const rapido = performance.now() - arrastre.t < 400;
    const horizontal = arrastre.horizontal;
    arrastre = null;
    const { plato, fondo } = piezas(diapos[actual]);
    if (horizontal && (Math.abs(dx) > 70 || (rapido && Math.abs(dx) > 35))) {
      const dir = dx < 0 ? 1 : -1;
      gsap.set(fondo, { clearProps: 'x' });
      ir(actual + dir, dir);
    } else if (horizontal) {
      gsap.to(plato, { x: 0, rotate: 0, rotateY: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
      gsap.to(fondo, { x: 0, duration: 0.4, ease: 'power3.out' });
    }
  };
  lista.addEventListener('pointerup', soltar);
  lista.addEventListener('pointercancel', soltar);

  // ── Profundidad con el cursor: el plato se inclina en 3D, el fondo va al revés ──
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    lista.addEventListener('pointermove', (e) => {
      if (arrastre || ocupado || !movimientoActivo()) return;
      const d = diapos[actual];
      const escena = d.querySelector<HTMLElement>('[data-escena]')!;
      const r = escena.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      const { plato, fondo } = piezas(d);
      gsap.to(plato, { rotateY: nx * 16, rotateX: -ny * 14, x: nx * 18, y: ny * 12, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
      gsap.to(fondo, { x: -nx * 40, duration: 0.8, ease: 'power3.out', overwrite: 'auto' });
      plato.style.setProperty('--bx', `${(nx + 0.5) * 100}%`);
      plato.style.setProperty('--by', `${(ny + 0.5) * 100}%`);
    });
    lista.addEventListener('pointerleave', () => {
      const { plato, fondo } = piezas(diapos[actual]);
      gsap.to(plato, { rotateY: 0, rotateX: 0, x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.6)' });
      gsap.to(fondo, { x: 0, duration: 0.8, ease: 'power3.out' });
    });
  }

  if (movimientoActivo()) {
    await cuandoAbra();
    entrada(diapos[actual], 1, true);
  }
}
