// Prepara las imágenes del sitio a partir de materiales/originales/ (archivos del cliente).
//   npm run imagenes
// - Recorta cada platillo de las fotos del menú impreso (src/assets/platos/<id>.jpg).
// - Separa al jinete del logo con fondo transparente y a todo color (src/assets/marca/jinete.png).
// - Copia el logo (src/assets/marca/logo.jpg), crea su versión horizontal sin margen
//   (logo-horizontal.jpg) y los favicons e imagen para redes (public/).
// - Deja una hoja de revisión con todos los recortes en materiales/revision/.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const orig = (f) => path.join(raiz, 'materiales', 'originales', f);
const dirPlatos = path.join(raiz, 'src', 'assets', 'platos');
const dirMarca = path.join(raiz, 'src', 'assets', 'marca');
const dirPublic = path.join(raiz, 'public');
const dirRevision = path.join(raiz, 'materiales', 'revision');
await Promise.all([dirPlatos, dirMarca, dirPublic, dirRevision].map((d) => mkdir(d, { recursive: true })));

// Verde del fondo del logo (#013121): sirve para separar al jinete del logo.
const VERDE = { r: 1, g: 49, b: 33 };
// Identidad del sitio: negro profundo y beige cálido (ver src/styles/global.css).
const NEGRO = { r: 20, g: 18, b: 15 };
const BEIGE = { r: 231, g: 220, b: 200 };

// Recortes cuadrados alrededor de cada platillo, en píxeles de la foto original (576×1024).
// cx, cy = centro del recorte; lado = tamaño del cuadrado. Solo fotos rotuladas en el menú
// impreso (o que encabezan su propia sección), para no atribuir una foto al plato equivocado.
const M1 = 'menu-01-burritos-tacos.jpg';
const M2 = 'menu-02-chicken-texmex-enchiladas.jpg';
const M3 = 'menu-03-seafood-soups-salads.jpg';
const M4 = 'menu-04-plates-steaks.jpg';
const M5 = 'menu-05-appetizers-kids.jpg';
const M6 = 'menu-06-parrilladas-molcajetes-drinks.jpg';

export const RECORTES = [
  { id: 'hamburger', archivo: M1, cx: 389, cy: 149, lado: 64 },
  { id: 'mini-tacos', archivo: M1, cx: 391, cy: 235, lado: 62 },
  { id: 'chicken-sandwich', archivo: M1, cx: 388, cy: 341, lado: 70 },
  { id: 'jalisco-burrito', archivo: M1, cx: 388, cy: 433, lado: 58 },
  { id: 'quesabirrias', archivo: M1, cx: 135, cy: 760, lado: 100 },
  { id: 'enchiladas-a-la-crema', archivo: M2, cx: 105, cy: 362, lado: 50 },
  { id: 'tampiquena-plate', archivo: M2, cx: 256, cy: 341, lado: 74 },
  { id: 'enchiladas-verdes', archivo: M2, cx: 92, cy: 606, lado: 130 },
  { id: 'pollo-feliz', archivo: M2, cx: 340, cy: 808, lado: 186 },
  { id: 'shrimp-cocktail', archivo: M3, cx: 418, cy: 160, lado: 150 },
  { id: 'bryans-salad', archivo: M3, cx: 412, cy: 288, lado: 100 },
  { id: 'fiesta-cancun', archivo: M3, cx: 408, cy: 414, lado: 130 },
  { id: 'menudo', archivo: M3, cx: 392, cy: 622, lado: 156 },
  { id: 'caldo-de-pollo', archivo: M3, cx: 395, cy: 786, lado: 190 },
  { id: 'tapatio-plate', archivo: M4, cx: 120, cy: 446, lado: 150 },
  { id: 'tacos-zacatecanos', archivo: M4, cx: 382, cy: 452, lado: 146 },
  { id: 'steak-and-shrimp', archivo: M4, cx: 100, cy: 816, lado: 150 },
  { id: 'rafas-plate', archivo: M4, cx: 336, cy: 855, lado: 122 },
  { id: 'rodeo-botana', archivo: M5, cx: 354, cy: 190, lado: 90 },
  { id: 'chicken-wings', archivo: M5, cx: 392, cy: 300, lado: 150 },
  { id: 'papas-locas', archivo: M5, cx: 382, cy: 467, lado: 126 },
  { id: 'baby-back-ribs', archivo: M5, cx: 260, cy: 567, lado: 106 },
  { id: 'child-plate', archivo: M5, cx: 352, cy: 796, lado: 230 },
  { id: 'el-alamo-steak-plate', archivo: M6, cx: 122, cy: 330, lado: 112 },
  { id: 'pound-of-barbacoa', archivo: M6, cx: 388, cy: 357, lado: 126 },
  { id: 'parrillada-platter', archivo: M6, cx: 132, cy: 788, lado: 226 },
];

async function recortar({ id, archivo, cx, cy, lado }) {
  const meta = await sharp(orig(archivo)).metadata();
  const left = Math.max(0, Math.min(meta.width - lado, Math.round(cx - lado / 2)));
  const top = Math.max(0, Math.min(meta.height - lado, Math.round(cy - lado / 2)));
  const salida = path.join(dirPlatos, `${id}.jpg`);
  // Solo luz, color y nitidez: no se altera el producto.
  await sharp(orig(archivo))
    .extract({ left, top, width: lado, height: lado })
    .resize({ width: lado * 2, height: lado * 2, kernel: 'lanczos3' })
    .modulate({ brightness: 1.04, saturation: 1.08 })
    .sharpen({ sigma: 0.9 })
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(salida);
  return salida;
}

// Separa el jinete izquierdo del logo con fondo transparente (fondo verde, marco y letras fuera).
async function recortarJinete() {
  const caja = { left: 18, top: 182, width: 486, height: 496 };
  const { data, info } = await sharp(orig('logo-fondo-verde.jpg'))
    .extract(caja)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const n = w * h;
  const vecinos = (p) => {
    const x = p % w;
    const y = (p - x) / w;
    const v = [];
    if (x > 0) v.push(p - 1);
    if (x < w - 1) v.push(p + 1);
    if (y > 0) v.push(p - w);
    if (y < h - 1) v.push(p + w);
    return v;
  };
  const dist = (i, c) => Math.hypot(data[i] - c.r, data[i + 1] - c.g, data[i + 2] - c.b);
  // Fondo: verde del logo o línea amarilla pálida del marco (el dibujo no usa esos colores).
  const esFondo = (p) => {
    const i = p * 4;
    const marco = data[i] > 215 && data[i + 1] > 205 && data[i + 2] > 95 && data[i + 2] < 175;
    // El negro del contorno está cerca del verde oscuro: se exige que el verde domine.
    const verde = dist(i, VERDE) < 55 && data[i + 1] > data[i] + 22 && data[i + 1] > data[i + 2] + 4;
    // Bordes del marco mezclados con el verde (tono oliva).
    const oliva = data[i + 1] > data[i] && data[i + 1] > data[i + 2] + 30 && data[i] > 30;
    return verde || marco || oliva;
  };
  // Exterior: relleno desde los bordes solo por píxeles de fondo. El dibujo (contorno negro
  // o blanco) detiene el relleno, así la cola y los huecos internos se conservan.
  const fuera = new Uint8Array(n);
  const pila = [];
  for (let x = 0; x < w; x++) pila.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) pila.push(y * w, y * w + w - 1);
  while (pila.length) {
    const p = pila.pop();
    if (fuera[p] || !esFondo(p)) continue;
    fuera[p] = 1;
    for (const v of vecinos(p)) if (!fuera[v]) pila.push(v);
  }
  // Letras del logotipo que entran en el recorte (la "T" de THE arriba a la derecha y la
  // franja de MEXICAN abajo): se borran por zonas, medidas sobre este recorte.
  const borrar = [
    { x0: 372, y0: 0, x1: w, y1: 160 }, // "T"
    { x0: 411, y0: 160, x1: w, y1: 250 }, // pie de la "T", junto a la mano del jinete
  ];
  // Franja de MEXICAN: las patas delanteras se mezclan con ella, así que el dibujo se corta en
  // y = 416 (borde superior de la franja). En el sitio, una baranda de corral tapa ese corte.
  borrar.push({ x0: 0, y0: 416, x1: w, y1: h });
  for (const z of borrar)
    for (let y = z.y0; y < Math.min(h, z.y1); y++) for (let x = z.x0; x < Math.min(w, z.x1); x++) fuera[y * w + x] = 1;
  // Restos sueltos (bordes de letras, línea del marco): se conserva solo la pieza más grande.
  const pieza = new Int32Array(n);
  let mayor = 0;
  let tamMayor = 0;
  let actual = 0;
  for (let p = 0; p < n; p++) {
    if (fuera[p] || pieza[p]) continue;
    actual++;
    let tam = 0;
    const cola = [p];
    pieza[p] = actual;
    while (cola.length) {
      const q = cola.pop();
      tam++;
      for (const v of vecinos(q)) {
        if (!fuera[v] && !pieza[v]) {
          pieza[v] = actual;
          cola.push(v);
        }
      }
    }
    if (tam > tamMayor) {
      tamMayor = tam;
      mayor = actual;
    }
  }
  for (let p = 0; p < n; p++) if (pieza[p] !== mayor) fuera[p] = 1;

  for (let p = 0; p < n; p++) {
    const i = p * 4;
    if (fuera[p]) data[i + 3] = 0;
    // Borde suave de un píxel en el límite exterior.
    else if (vecinos(p).some((v) => fuera[v])) data[i + 3] = 140;
  }
  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 1 })
    .png({ compressionLevel: 9 })
    .toFile(path.join(dirMarca, 'jinete.png'));
}

// Insignia: el jinete a color, tal como está en el logo, sobre el verde del logo.
async function insigniaJinete(tam, proporcion, circular) {
  const dentro = Math.round(tam * proporcion);
  const icono = await sharp(path.join(dirMarca, 'jinete.png'))
    .resize({ width: dentro, height: dentro, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const base = circular
    ? Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${tam}" height="${tam}"><circle cx="${tam / 2}" cy="${tam / 2}" r="${tam / 2}" fill="rgb(${VERDE.r},${VERDE.g},${VERDE.b})"/></svg>`,
      )
    : { create: { width: tam, height: tam, channels: 3, background: VERDE } };
  return sharp(base).composite([{ input: icono, gravity: 'center' }]).png({ compressionLevel: 9 });
}

async function favicons() {
  for (const [tam, archivo] of [
    [32, 'favicon-32.png'],
    [192, 'favicon-192.png'],
    [512, 'favicon-512.png'],
  ]) {
    await (await insigniaJinete(tam, 0.8, true)).toFile(path.join(dirPublic, archivo));
  }
  // Apple pide fondo opaco y cuadrado.
  await (await insigniaJinete(180, 0.8, false)).toFile(path.join(dirPublic, 'apple-touch-icon.png'));
}

// Imagen para redes: el logo a color, enmarcado en negro como un letrero sobre fondo beige.
async function imagenSocial() {
  const logo = await sharp(orig('logo-fondo-verde.jpg')).resize({ width: 1040 }).toBuffer();
  const { height: alto } = await sharp(logo).metadata();
  const marco = await sharp({ create: { width: 1040 + 28, height: alto + 28, channels: 3, background: NEGRO } })
    .composite([{ input: logo, left: 14, top: 14 }])
    .png()
    .toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: BEIGE } })
    .composite([{ input: marco, gravity: 'center' }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(path.join(dirPublic, 'og-image.jpg'));
}

async function hojaRevision(archivos) {
  const tam = 220;
  const cols = 6;
  const filas = Math.ceil(archivos.length / cols);
  const piezas = await Promise.all(
    archivos.map(async (f, i) => {
      const etiqueta = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${tam}" height="24"><rect width="100%" height="100%" fill="#000"/><text x="6" y="17" font-family="Arial" font-size="14" fill="#fff">${path.basename(f, '.jpg')}</text></svg>`,
      );
      const img = await sharp(f).resize(tam, tam).composite([{ input: etiqueta, gravity: 'south' }]).toBuffer();
      return { input: img, left: (i % cols) * tam, top: Math.floor(i / cols) * tam };
    }),
  );
  await sharp({ create: { width: cols * tam, height: filas * tam, channels: 3, background: '#222' } })
    .composite(piezas)
    .jpeg({ quality: 80 })
    .toFile(path.join(dirRevision, 'hoja-recortes.jpg'));
}

const hechos = [];
for (const r of RECORTES) hechos.push(await recortar(r));
await sharp(orig('logo-fondo-verde.jpg')).jpeg({ quality: 90, mozjpeg: true }).toFile(path.join(dirMarca, 'logo.jpg'));
// Logo horizontal para cabecera y pie: el mismo logo a color, sin el margen verde de alrededor.
await sharp(orig('logo-fondo-verde.jpg'))
  .extract({ left: 24, top: 96, width: 1702, height: 684 })
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(path.join(dirMarca, 'logo-horizontal.jpg'));
await recortarJinete();
await favicons();
await imagenSocial();
await hojaRevision(hechos);
// Jinete sobre un color llamativo para revisar que el recorte quedó limpio.
await sharp({ create: { width: 520, height: 520, channels: 3, background: '#d02090' } })
  .composite([{ input: path.join(dirMarca, 'jinete.png'), gravity: 'center' }])
  .png()
  .toFile(path.join(dirRevision, 'jinete-sobre-color.png'));
console.log(`✓ ${hechos.length} recortes, jinete, logo, favicons e imagen social`);
