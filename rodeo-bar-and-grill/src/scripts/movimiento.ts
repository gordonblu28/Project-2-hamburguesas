// Preferencia de movimiento: la del sistema (prefers-reduced-motion) o la elegida con el botón
// de pausa de la cabecera (se recuerda en este navegador). Todas las animaciones la consultan.
const CLAVE = 'rodeo-movimiento';
const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
const oyentes = new Set<(activo: boolean) => void>();
let elegida: 'on' | 'off' | null = null;

function guardada(): 'on' | 'off' | null {
  if (elegida) return elegida;
  try {
    const v = localStorage.getItem(CLAVE);
    return v === 'on' || v === 'off' ? v : null;
  } catch {
    return null;
  }
}

export function movimientoActivo(): boolean {
  const v = guardada();
  if (v) return v === 'on';
  return !consulta.matches;
}

export function alCambiarMovimiento(fn: (activo: boolean) => void): () => void {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

function aplicar() {
  const activo = movimientoActivo();
  document.documentElement.dataset.motion = activo ? 'on' : 'off';
  document.querySelectorAll<HTMLButtonElement>('[data-interruptor-movimiento]').forEach((b) => {
    b.hidden = false;
    b.setAttribute('aria-pressed', String(!activo));
    const etiqueta = b.querySelector('[data-etiqueta]');
    if (etiqueta) etiqueta.textContent = activo ? 'Pause animations' : 'Play animations';
    b.title = activo ? 'Pause animations' : 'Play animations';
  });
  oyentes.forEach((fn) => fn(activo));
}

export function iniciarMovimiento() {
  aplicar();
  consulta.addEventListener('change', aplicar);
  document.querySelectorAll<HTMLButtonElement>('[data-interruptor-movimiento]').forEach((b) =>
    b.addEventListener('click', () => {
      elegida = movimientoActivo() ? 'off' : 'on';
      try {
        localStorage.setItem(CLAVE, elegida);
      } catch {
        /* sin almacenamiento: el cambio dura solo esta página */
      }
      aplicar();
    }),
  );
}
