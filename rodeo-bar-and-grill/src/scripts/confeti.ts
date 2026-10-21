// Confeti de bienvenida en verde, blanco y rojo: dos ráfagas desde las esquinas de abajo, como
// cañones de fiesta, que caen meciéndose y se desvanecen en unos 4 segundos.
// · Una sola vez por visita (sessionStorage): no se repite al cambiar de página ni al volver.
// · No toca nada: lienzo fijo con pointer-events: none, por debajo de la cabecera, la barra
//   inferior y los botones flotantes (z-index 40), así nunca tapa el logo ni la navegación.
// · Respeta el movimiento reducido (del sistema o el botón de pausa) y se detiene si cambia.
// · Sin librerías: un <canvas> que se elimina al terminar.
import { movimientoActivo, alCambiarMovimiento } from './movimiento';

const CLAVE = 'rodeo-confeti';
const COLORES = ['#006847', '#ffffff', '#c8102e'];
const DURACION = 4200;
const GRAVEDAD = 0.32;

interface Pieza {
  x: number;
  y: number;
  vx: number;
  vy: number;
  giro: number;
  vGiro: number;
  vaiven: number;
  fase: number;
  ancho: number;
  alto: number;
  color: string;
  forma: 0 | 1;
}

export function iniciarConfeti() {
  if (!movimientoActivo()) return;
  try {
    if (sessionStorage.getItem(CLAVE)) return;
    sessionStorage.setItem(CLAVE, '1');
  } catch {
    // Sin almacenamiento no se sabe si ya se vio: mejor no repetirlo en cada página.
    return;
  }
  // Tras el primer pintado: el confeti no compite con la carga de la página.
  const arrancar = () => window.setTimeout(lanzar, 350);
  if (document.readyState === 'complete') arrancar();
  else window.addEventListener('load', arrancar, { once: true });
}

function lanzar() {
  if (!movimientoActivo() || document.hidden) return;
  const lienzo = document.createElement('canvas');
  lienzo.className = 'confeti';
  lienzo.setAttribute('aria-hidden', 'true');
  const ctx = lienzo.getContext('2d');
  if (!ctx) return;
  document.body.append(lienzo);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  const medir = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    lienzo.width = Math.round(w * dpr);
    lienzo.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  medir();
  window.addEventListener('resize', medir);

  // Menos piezas en el teléfono: igual de festivo, menos trabajo para el procesador.
  const total = w < 700 ? 90 : 170;
  const piezas: Pieza[] = Array.from({ length: total }, (_, i) => {
    const izquierda = i % 2 === 0;
    // Ángulo hacia arriba y hacia el centro, con dispersión.
    const angulo = ((izquierda ? -62 : -118) + (Math.random() - 0.5) * 34) * (Math.PI / 180);
    const fuerza = (h < 700 ? 15 : 19) * (0.6 + Math.random() * 0.55);
    return {
      x: izquierda ? -10 : w + 10,
      y: h * 0.92,
      vx: Math.cos(angulo) * fuerza,
      vy: Math.sin(angulo) * fuerza,
      giro: Math.random() * Math.PI,
      vGiro: (Math.random() - 0.5) * 0.3,
      vaiven: 0.6 + Math.random() * 1.2,
      fase: Math.random() * Math.PI * 2,
      ancho: 7 + Math.random() * 6,
      alto: 4 + Math.random() * 4,
      color: COLORES[i % 3],
      forma: Math.random() < 0.8 ? 0 : 1,
    };
  });

  let inicio = 0;
  let cuadro = 0;
  let terminado = false;
  const terminar = () => {
    if (terminado) return;
    terminado = true;
    cancelAnimationFrame(cuadro);
    window.removeEventListener('resize', medir);
    quitarOyente();
    lienzo.remove();
  };
  const quitarOyente = alCambiarMovimiento((activo) => !activo && terminar());

  function paso(t: number) {
    if (!inicio) inicio = t;
    const pasado = t - inicio;
    if (pasado > DURACION || document.hidden) return terminar();
    // Se desvanece en el último segundo.
    const opacidad = Math.min(1, (DURACION - pasado) / 1000);
    ctx!.clearRect(0, 0, w, h);
    ctx!.globalAlpha = opacidad;
    for (const p of piezas) {
      p.vy += GRAVEDAD;
      // Resistencia del aire: frena la subida y deja caer despacio, meciéndose.
      p.vx *= 0.975;
      p.vy = Math.min(p.vy * 0.975, 4.2);
      p.fase += 0.08;
      p.x += p.vx + Math.sin(p.fase) * p.vaiven;
      p.y += p.vy;
      p.giro += p.vGiro;
      if (p.y > h + 20) continue;
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.giro);
      // El volteo (coseno) hace que cada papelito "parpadee" al girar, como el de verdad.
      ctx!.scale(1, Math.cos(p.fase * 1.3));
      ctx!.fillStyle = p.color;
      if (p.forma === 0) {
        ctx!.fillRect(-p.ancho / 2, -p.alto / 2, p.ancho, p.alto);
        // El blanco lleva un filo apenas visible para leerse sobre el fondo claro.
        if (p.color === '#ffffff') {
          ctx!.strokeStyle = 'rgba(20, 18, 15, 0.18)';
          ctx!.lineWidth = 0.8;
          ctx!.strokeRect(-p.ancho / 2, -p.alto / 2, p.ancho, p.alto);
        }
      } else {
        ctx!.beginPath();
        ctx!.arc(0, 0, p.alto * 0.7, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.restore();
    }
    cuadro = requestAnimationFrame(paso);
  }
  cuadro = requestAnimationFrame(paso);
}
