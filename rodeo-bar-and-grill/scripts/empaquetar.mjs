// Crea entrega/rodeo-bar-and-grill-cloudflare.zip con el contenido de dist/
// (index.html en la raíz del ZIP), listo para subir a Cloudflare Pages.
//   node scripts/empaquetar.mjs --codigo  → entrega/rodeo-bar-and-grill-codigo.zip (proyecto editable)
// Escribe el ZIP sin dependencias y con rutas "/" para que funcione en cualquier sistema.
import { readdir, readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { deflateRawSync, crc32 } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const codigo = process.argv.includes('--codigo');
const origen = codigo ? raiz : path.join(raiz, 'dist');
const destino = path.join(raiz, 'entrega', codigo ? 'rodeo-bar-and-grill-codigo.zip' : 'rodeo-bar-and-grill-cloudflare.zip');
const EXCLUIR = new Set(['node_modules', 'dist', 'entrega', '.astro', '.wrangler', '.playwright-mcp', '.claude', 'revision']);

async function listar(dir) {
  const salida = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (codigo && EXCLUIR.has(e.name)) continue;
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) salida.push(...(await listar(ruta)));
    else salida.push(ruta);
  }
  return salida;
}

function fechaDos(d) {
  const hora = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  const fecha = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { hora, fecha };
}

const archivos = (await listar(origen)).sort();
const locales = [];
const central = [];
let desplazamiento = 0;

for (const archivo of archivos) {
  const nombre = Buffer.from(path.relative(origen, archivo).split(path.sep).join('/'), 'utf8');
  const datos = await readFile(archivo);
  const comprimido = deflateRawSync(datos, { level: 9 });
  const usarDeflate = comprimido.length < datos.length;
  const cuerpo = usarDeflate ? comprimido : datos;
  const metodo = usarDeflate ? 8 : 0;
  const crc = crc32(datos) >>> 0;
  const { hora, fecha } = fechaDos((await stat(archivo)).mtime);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6); // nombres en UTF-8
  local.writeUInt16LE(metodo, 8);
  local.writeUInt16LE(hora, 10);
  local.writeUInt16LE(fecha, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(cuerpo.length, 18);
  local.writeUInt32LE(datos.length, 22);
  local.writeUInt16LE(nombre.length, 26);
  local.writeUInt16LE(0, 28);
  locales.push(local, nombre, cuerpo);

  const cab = Buffer.alloc(46);
  cab.writeUInt32LE(0x02014b50, 0);
  cab.writeUInt16LE(20, 4);
  cab.writeUInt16LE(20, 6);
  cab.writeUInt16LE(0x0800, 8);
  cab.writeUInt16LE(metodo, 10);
  cab.writeUInt16LE(hora, 12);
  cab.writeUInt16LE(fecha, 14);
  cab.writeUInt32LE(crc, 16);
  cab.writeUInt32LE(cuerpo.length, 20);
  cab.writeUInt32LE(datos.length, 24);
  cab.writeUInt16LE(nombre.length, 28);
  cab.writeUInt32LE(desplazamiento, 42);
  central.push(cab, nombre);

  desplazamiento += local.length + nombre.length + cuerpo.length;
}

const tamCentral = central.reduce((n, b) => n + b.length, 0);
const fin = Buffer.alloc(22);
fin.writeUInt32LE(0x06054b50, 0);
fin.writeUInt16LE(archivos.length, 8);
fin.writeUInt16LE(archivos.length, 10);
fin.writeUInt32LE(tamCentral, 12);
fin.writeUInt32LE(desplazamiento, 16);

await mkdir(path.dirname(destino), { recursive: true });
await writeFile(destino, Buffer.concat([...locales, ...central, fin]));
console.log(`✓ ${path.relative(raiz, destino)} (${archivos.length} archivos)`);
