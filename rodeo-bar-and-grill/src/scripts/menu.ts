// Menú interactivo: una categoría a la vez (escenario), con transición de marca al cambiar,
// gestos táctiles, buscador y ficha ampliada. Sin JavaScript, el menú se lee completo como lista.
import { gsap } from 'gsap';
import { movimientoActivo } from './movimiento';

const normalizar = (t: string) =>
  t
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

export function iniciarMenu() {
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  if (!menu) return;

  const paneles = new Map(Array.from(menu.querySelectorAll<HTMLElement>('[data-panel]')).map((p) => [p.dataset.panel!, p]));
  const pestanas = Array.from(menu.querySelectorAll<HTMLAnchorElement>('[data-cat]'));
  const carril = menu.querySelector<HTMLElement>('[data-pestanas]')!;
  const secciones = Array.from(menu.querySelectorAll<HTMLAnchorElement>('[data-seccion][data-destino]'));
  const cuerpo = menu.querySelector<HTMLElement>('.menu__cuerpo')!;
  const orden = pestanas.map((p) => p.dataset.cat!);
  let actual = '';
  let transicion: gsap.core.Timeline | null = null;

  menu.classList.add('menu--escenario');
  pestanas.forEach((p) => p.setAttribute('aria-selected', 'false'));

  // Alto real de la barra fija (cambia con el buscador o si las pestañas ocupan dos filas).
  const barra = menu.querySelector<HTMLElement>('.menu__barra');
  if (barra) {
    new ResizeObserver(() => document.documentElement.style.setProperty('--alto-barra-menu', `${barra.offsetHeight}px`)).observe(barra);
  }

  // ── Activar categoría ──
  const filasVisibles = (panel: HTMLElement, max: number) => {
    const limite = window.innerHeight * 1.2;
    return Array.from(panel.querySelectorAll<HTMLElement>('.panel__lista > li')).filter((li, i) => i < max && li.getBoundingClientRect().top < limite);
  };

  function subirAlMenu() {
    const tope = menu!.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h'));
    if (window.scrollY > tope + 4) window.scrollTo({ top: Math.max(0, tope), behavior: 'instant' as ScrollBehavior });
  }

  function marcar(id: string) {
    pestanas.forEach((p) => {
      const si = p.dataset.cat === id;
      p.setAttribute('aria-selected', String(si));
      p.tabIndex = si ? 0 : -1;
    });
    const seccion = paneles.get(id)?.dataset.seccion ?? '';
    secciones.forEach((s) => s.setAttribute('aria-current', String(s.dataset.seccion === seccion)));
    const tab = pestanas.find((p) => p.dataset.cat === id);
    if (tab) {
      const izquierda = tab.offsetLeft - (carril.clientWidth - tab.offsetWidth) / 2;
      carril.scrollTo({ left: izquierda, behavior: movimientoActivo() ? 'smooth' : 'auto' });
    }
  }

  function actualizarUrl(id: string) {
    const url = new URL(location.href);
    url.searchParams.set('c', id);
    url.searchParams.delete('item');
    url.hash = '';
    history.replaceState(history.state, '', url);
  }

  function activar(id: string, opciones: { animar?: boolean; dir?: number; enfocar?: boolean } = {}) {
    const entra = paneles.get(id);
    if (!entra || id === actual) return;
    const { animar = true, enfocar = false } = opciones;
    const dir = opciones.dir ?? (orden.indexOf(id) >= orden.indexOf(actual) ? 1 : -1);
    const sale = paneles.get(actual);
    actual = id;
    marcar(id);
    actualizarUrl(id);
    salirBusqueda(false);

    const mostrar = () => {
      sale?.removeAttribute('data-activo');
      entra.setAttribute('data-activo', '');
      subirAlMenu();
      if (enfocar) entra.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    };

    transicion?.progress(1).kill();
    if (!animar || !sale || !movimientoActivo()) {
      mostrar();
      return;
    }

    const filasSale = filasVisibles(sale, 8);
    const letrasSale = sale.querySelectorAll('.panel__titulo .letra');
    const medSale = sale.querySelector('.panel__medallon .medallon');

    transicion = gsap
      .timeline({ defaults: { overwrite: 'auto' } })
      // Salida rápida: las filas se van hacia el lado contrario y el plato gira fuera del lazo.
      .to(filasSale, { x: -36 * dir, opacity: 0, duration: 0.2, ease: 'power2.in', stagger: 0.018 })
      .to(letrasSale, { yPercent: 70, rotate: (i) => (i % 2 ? 14 : -14), opacity: 0, duration: 0.2, ease: 'power2.in', stagger: 0.008 }, 0)
      .to(medSale, { rotate: 80 * dir, scale: 0.7, opacity: 0, duration: 0.24, ease: 'power3.in' }, 0)
      .add(() => {
        // Solo lo animado: el medallón guarda su tamaño en una variable CSS en línea (--lado).
        gsap.set([...filasSale, ...Array.from(letrasSale), medSale].filter(Boolean), {
          clearProps: 'transform,opacity',
        });
        mostrar();
        entrada(entra, dir);
      });
  }

  // Entrada: letras que corcovean, lazo que se dibuja, filas que se tiran con la cuerda y
  // precios que caen como sello de hierro (dejan una sombra de tinta que se seca).
  function entrada(panel: HTMLElement, dir: number) {
    const letras = panel.querySelectorAll('.panel__titulo .letra');
    const med = panel.querySelector('.panel__medallon .medallon');
    const lazo = panel.querySelector('.panel__medallon .lazo-trazo');
    const filas = filasVisibles(panel, 10);
    const precios = filas.map((f) => f.querySelector('.fila__precio')).filter(Boolean);
    const tl = gsap.timeline();
    tl.fromTo(
      letras,
      { yPercent: -120, rotate: (i) => (i % 2 ? -16 : 16), opacity: 0 },
      { yPercent: 0, rotate: 0, opacity: 1, duration: 0.62, ease: 'back.out(2.3)', stagger: 0.028, clearProps: 'all' },
    );
    if (med)
      tl.fromTo(
        med,
        { rotate: -100 * dir, scale: 0.55, opacity: 0 },
        { rotate: 0, scale: 1, opacity: 1, duration: 0.8, ease: 'elastic.out(1, 0.55)', clearProps: 'transform,opacity' },
        0,
      );
    if (lazo) tl.fromTo(lazo, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out', clearProps: 'all' }, 0.08);
    tl.fromTo(
      filas,
      { x: 44 * dir, opacity: 0, clipPath: dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' },
      { x: 0, opacity: 1, clipPath: 'inset(0 0% 0 0%)', duration: 0.5, ease: 'power3.out', stagger: 0.045, clearProps: 'all' },
      0.06,
    )
      .fromTo(
        precios,
        { scale: 1.6, rotate: -9, textShadow: '0 0 14px rgba(20, 18, 15, 0.55)' },
        { scale: 1, rotate: 0, textShadow: '0 0 0px rgba(20, 18, 15, 0)', duration: 0.5, ease: 'back.out(3)', stagger: 0.045, clearProps: 'all' },
        0.22,
      );
    transicion = tl;
  }

  const vecino = (paso: number) => {
    const i = orden.indexOf(actual) + paso;
    return i >= 0 && i < orden.length ? orden[i] : null;
  };

  // ── Clics: pestañas, secciones y "siguiente/anterior" ──
  menu.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('[data-cat], [data-destino], [data-ir]');
    if (!a) return;
    const id = a.dataset.cat ?? a.dataset.destino ?? a.dataset.ir;
    if (!id || !paneles.has(id)) return;
    e.preventDefault();
    activar(id, { enfocar: a.hasAttribute('data-ir') });
  });

  // Teclado en las pestañas: flechas, Inicio y Fin.
  carril.addEventListener('keydown', (e) => {
    const teclas: Record<string, number | 'inicio' | 'fin'> = { ArrowRight: 1, ArrowLeft: -1, Home: 'inicio', End: 'fin' };
    const t = teclas[e.key];
    if (t === undefined) return;
    e.preventDefault();
    const id = t === 'inicio' ? orden[0] : t === 'fin' ? orden[orden.length - 1] : vecino(t);
    if (!id) return;
    activar(id);
    pestanas.find((p) => p.dataset.cat === id)?.focus();
  });

  // ── Deslizar con el dedo entre categorías ──
  let gesto: { x: number; y: number; t: number; id: number; horizontal: boolean | null } | null = null;
  cuerpo.style.touchAction = 'pan-y';
  cuerpo.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || (e.target as Element).closest('input')) return;
    gesto = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, horizontal: null };
  });
  cuerpo.addEventListener('pointermove', (e) => {
    if (!gesto || e.pointerId !== gesto.id) return;
    const dx = e.clientX - gesto.x;
    const dy = e.clientY - gesto.y;
    if (gesto.horizontal === null && Math.hypot(dx, dy) > 10) gesto.horizontal = Math.abs(dx) > Math.abs(dy) * 1.4;
    if (gesto.horizontal && movimientoActivo()) {
      const resistencia = vecino(dx < 0 ? 1 : -1) ? 0.35 : 0.12;
      gsap.set(paneles.get(actual)!, { x: dx * resistencia });
    }
  });
  const soltar = (e: PointerEvent) => {
    if (!gesto || e.pointerId !== gesto.id) return;
    const dx = e.clientX - gesto.x;
    const rapido = performance.now() - gesto.t < 450;
    const panel = paneles.get(actual)!;
    const destino = gesto.horizontal && (Math.abs(dx) > 80 || (rapido && Math.abs(dx) > 40)) ? vecino(dx < 0 ? 1 : -1) : null;
    gesto = null;
    if (destino) {
      gsap.set(panel, { clearProps: 'transform' });
      activar(destino, { dir: dx < 0 ? 1 : -1 });
    } else if (gsap.getProperty(panel, 'x')) {
      gsap.to(panel, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)', clearProps: 'transform' });
    }
  };
  cuerpo.addEventListener('pointerup', soltar);
  cuerpo.addEventListener('pointercancel', soltar);

  // ── Buscador ──
  const botonLupa = menu.querySelector<HTMLButtonElement>('[data-abrir-buscador]')!;
  const buscador = menu.querySelector<HTMLFormElement>('[data-buscador]')!;
  const entrada_ = menu.querySelector<HTMLInputElement>('[data-busqueda-entrada]')!;
  const resultados = menu.querySelector<HTMLElement>('[data-resultados]')!;
  const listaResultados = menu.querySelector<HTMLElement>('[data-resultados-lista]')!;
  const tituloResultados = menu.querySelector<HTMLElement>('[data-resultados-titulo]')!;
  const vacio = menu.querySelector<HTMLElement>('[data-resultados-vacio]')!;
  const filas = Array.from(menu.querySelectorAll<HTMLElement>('.panel .fila'));
  botonLupa.hidden = false;

  function abrirBuscador() {
    buscador.hidden = false;
    botonLupa.setAttribute('aria-expanded', 'true');
    entrada_.focus();
    if (movimientoActivo()) gsap.fromTo(buscador, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.4, ease: 'power3.out', clearProps: 'all' });
  }

  function salirBusqueda(cerrar: boolean) {
    if (!menu!.classList.contains('menu--buscando') && !cerrar) return;
    menu!.classList.remove('menu--buscando');
    resultados.hidden = true;
    listaResultados.replaceChildren();
    if (cerrar) {
      entrada_.value = '';
      buscador.hidden = true;
      botonLupa.setAttribute('aria-expanded', 'false');
      botonLupa.focus();
    }
  }

  function buscar() {
    const q = normalizar(entrada_.value);
    if (!q) return salirBusqueda(false);
    const terminos = q.split(/\s+/);
    const halladas = filas.filter((f) => terminos.every((t) => (f.dataset.busqueda ?? '').includes(t)));
    menu!.classList.add('menu--buscando');
    resultados.hidden = false;
    listaResultados.replaceChildren(
      ...halladas.map((f) => {
        const li = document.createElement('li');
        li.append(f.cloneNode(true));
        return li;
      }),
    );
    tituloResultados.textContent = `${halladas.length} ${halladas.length === 1 ? 'result' : 'results'} for “${entrada_.value.trim()}”`;
    vacio.hidden = halladas.length > 0;
    if (movimientoActivo()) {
      gsap.fromTo(
        listaResultados.children,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.3, ease: 'power3.out', stagger: 0.025, clearProps: 'all' },
      );
    }
  }

  botonLupa.addEventListener('click', () => (buscador.hidden ? abrirBuscador() : salirBusqueda(true)));
  menu.querySelector('[data-cerrar-buscador]')?.addEventListener('click', () => salirBusqueda(true));
  buscador.addEventListener('submit', (e) => {
    e.preventDefault();
    entrada_.blur();
  });
  entrada_.addEventListener('input', buscar);
  entrada_.addEventListener('keydown', (e) => e.key === 'Escape' && (e.preventDefault(), salirBusqueda(true)));

  // ── Ficha ampliada ──
  const dialogo = menu.querySelector<HTMLDialogElement>('[data-ficha]')!;
  const hoja = dialogo.querySelector<HTMLElement>('[data-ficha-hoja]')!;
  const fichaMedallon = dialogo.querySelector<HTMLElement>('[data-ficha-medallon]')!;
  const fichaInfo = dialogo.querySelector<HTMLElement>('[data-ficha-info]')!;
  const pasos = Array.from(dialogo.querySelectorAll<HTMLButtonElement>('[data-ficha-paso]'));
  let filaAbierta: HTMLElement | null = null;
  let origen: HTMLElement | null = null;
  let porHistorial = false;
  const esMovil = () => window.matchMedia('(max-width: 759px)').matches;

  const listaDe = (fila: HTMLElement) => Array.from((fila.closest('.panel__lista') ?? cuerpo).querySelectorAll<HTMLElement>('.fila'));

  function llenarFicha(fila: HTMLElement) {
    filaAbierta = fila;
    fichaMedallon.replaceChildren();
    const plantilla = fila.querySelector<HTMLTemplateElement>('template[data-foto]');
    if (plantilla) {
      fichaMedallon.append(plantilla.content.cloneNode(true));
    } else {
      const emblema = menu!.querySelector<HTMLTemplateElement>(`template[data-emblema="${emblemaDe(fila)}"]`);
      if (emblema) fichaMedallon.append(emblema.content.cloneNode(true));
      const numero = fila.querySelector('.fila__numero')?.textContent?.trim();
      const caja = fichaMedallon.querySelector('.medallon__emblema');
      if (caja && numero) {
        const s = document.createElement('span');
        s.textContent = `No. ${numero}`;
        caja.append(s);
      }
    }
    const info = fila.querySelector('.fila__info')!.cloneNode(true) as HTMLElement;
    const h3 = info.querySelector('.fila__nombre');
    if (h3) {
      h3.querySelectorAll('.visually-hidden').forEach((s) => s.remove());
      const h2 = document.createElement('h2');
      h2.className = h3.className;
      h2.id = 'ficha-titulo';
      h2.textContent = h3.textContent?.trim() ?? '';
      h3.replaceWith(h2);
      const numero = fila.querySelector('.fila__numero')?.textContent?.trim();
      if (numero) {
        const p = document.createElement('p');
        p.className = 'ficha__numero';
        p.textContent = `No. ${numero}`;
        info.prepend(p);
      }
    }
    fichaInfo.replaceChildren(info);
    const lista = listaDe(fila);
    const i = lista.indexOf(fila);
    pasos[0].disabled = i <= 0;
    pasos[1].disabled = i >= lista.length - 1;
  }

  // Ícono del emblema (productos sin foto): el de su categoría en el bar; estrella en la cocina.
  function emblemaDe(fila: HTMLElement): string {
    return paneles.get(fila.dataset.categoria ?? '')?.dataset.icono ?? 'estrella';
  }

  function animarEntradaFicha() {
    if (!movimientoActivo()) return;
    const med = fichaMedallon.querySelector('.medallon');
    const lazo = fichaMedallon.querySelector('.lazo-trazo');
    const piezas = fichaInfo.querySelectorAll('.fila__info > *');
    gsap
      .timeline()
      .fromTo(hoja, esMovil() ? { yPercent: 100 } : { scale: 0.92, opacity: 0, rotate: -1.5 }, { yPercent: 0, scale: 1, opacity: 1, rotate: 0, duration: 0.5, ease: 'expo.out', clearProps: 'all' })
      .fromTo(med, { rotate: -120, scale: 0.6 }, { rotate: 0, scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.55)', clearProps: 'transform' }, 0.08)
      .fromTo(lazo, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out', clearProps: 'all' }, 0.15)
      .fromTo(piezas, { opacity: 0, clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.45, ease: 'power3.out', stagger: 0.05, clearProps: 'all' }, 0.12);
  }

  function urlFicha(id: string | null) {
    const url = new URL(location.href);
    if (id) url.searchParams.set('item', id);
    else url.searchParams.delete('item');
    url.hash = '';
    return url;
  }

  function abrirFicha(fila: HTMLElement, { historial = true } = {}) {
    if (!dialogo.open) origen = (document.activeElement as HTMLElement) ?? null;
    llenarFicha(fila);
    const id = fila.dataset.producto!;
    if (historial) {
      if (history.state?.ficha) history.replaceState({ ficha: id }, '', urlFicha(id));
      else history.pushState({ ficha: id }, '', urlFicha(id));
    }
    if (!dialogo.open) {
      dialogo.showModal();
      animarEntradaFicha();
    } else if (movimientoActivo()) {
      gsap.fromTo(fichaMedallon, { opacity: 0, rotate: -30 }, { opacity: 1, rotate: 0, duration: 0.45, ease: 'back.out(2)', clearProps: 'all' });
      gsap.fromTo(fichaInfo, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.35, ease: 'power3.out', clearProps: 'all' });
    }
    hoja.scrollTop = 0;
  }

  function cerrarFicha() {
    if (!dialogo.open) return;
    const terminar = () => {
      dialogo.close();
      gsap.set(hoja, { clearProps: 'all' });
    };
    if (!movimientoActivo()) return terminar();
    gsap.to(hoja, esMovil() ? { yPercent: 100, duration: 0.3, ease: 'power3.in', onComplete: terminar } : { scale: 0.94, opacity: 0, duration: 0.2, ease: 'power2.in', onComplete: terminar });
  }

  dialogo.addEventListener('close', () => {
    if (!porHistorial && history.state?.ficha) history.back();
    porHistorial = false;
    filaAbierta = null;
    origen?.focus({ preventScroll: true });
  });
  dialogo.addEventListener('cancel', (e) => {
    e.preventDefault();
    cerrarFicha();
  });
  dialogo.addEventListener('click', (e) => {
    if (e.target === dialogo) cerrarFicha();
  });
  dialogo.querySelector('[data-cerrar-ficha]')?.addEventListener('click', cerrarFicha);
  pasos.forEach((b) =>
    b.addEventListener('click', () => {
      if (!filaAbierta) return;
      const lista = listaDe(filaAbierta);
      const siguiente = lista[lista.indexOf(filaAbierta) + Number(b.dataset.fichaPaso)];
      if (siguiente) abrirFicha(siguiente);
    }),
  );

  // Deslizar la hoja hacia abajo para cerrarla (teléfono).
  const asa = dialogo.querySelector<HTMLElement>('[data-ficha-asa]')!;
  let arrastre: { y: number; id: number } | null = null;
  asa.addEventListener('pointerdown', (e) => {
    arrastre = { y: e.clientY, id: e.pointerId };
    asa.setPointerCapture(e.pointerId);
  });
  asa.addEventListener('pointermove', (e) => {
    if (!arrastre || e.pointerId !== arrastre.id) return;
    gsap.set(hoja, { y: Math.max(0, e.clientY - arrastre.y) });
  });
  const soltarAsa = (e: PointerEvent) => {
    if (!arrastre || e.pointerId !== arrastre.id) return;
    const dy = e.clientY - arrastre.y;
    arrastre = null;
    if (dy > 90) cerrarFicha();
    else gsap.to(hoja, { y: 0, duration: 0.4, ease: 'elastic.out(1, 0.6)', clearProps: 'transform' });
  };
  asa.addEventListener('pointerup', soltarAsa);
  asa.addEventListener('pointercancel', soltarAsa);

  menu.addEventListener('click', (e) => {
    const boton = (e.target as Element).closest('[data-abrir]');
    const fila = boton?.closest<HTMLElement>('.fila');
    if (fila && !dialogo.contains(fila)) abrirFicha(fila);
  });

  window.addEventListener('popstate', (e) => {
    const id = (e.state as { ficha?: string } | null)?.ficha;
    if (id) {
      const fila = filas.find((f) => f.dataset.producto === id);
      if (fila) abrirFicha(fila, { historial: false });
    } else if (dialogo.open) {
      porHistorial = true;
      cerrarFicha();
    }
  });

  // ── Estado inicial desde la dirección: ?c=categoria&item=producto (o #categoria) ──
  const params = new URLSearchParams(location.search);
  const pedida = params.get('c') ?? location.hash.slice(1);
  // La temporada vivía antes dentro del menú (?c=seasonal): ese enlace ahora lleva a su página.
  const rutaTemporada = menu.dataset.rutaTemporada;
  if (pedida === 'seasonal' && rutaTemporada) {
    location.replace(rutaTemporada);
    return;
  }
  const inicial = pedida && paneles.has(pedida) ? pedida : orden[0];
  activar(inicial, { animar: false });
  const item = params.get('item');
  const filaItem = item ? filas.find((f) => f.dataset.producto === item) : null;
  if (filaItem) {
    // Entrada propia en el historial: al cerrar la ficha se vuelve al menú, no a la página anterior.
    history.replaceState(null, '', urlFicha(null));
    abrirFicha(filaItem);
  }
}
