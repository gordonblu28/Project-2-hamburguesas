// Comprueba que el menú publicado (dist/menu/index.html) contiene todos los productos y precios
// de src/data/productos.yaml, categoría por categoría.   uso: npm run verificar  (después de build)
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parse } from 'yaml';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const productos = parse(await readFile(path.join(raiz, 'src/data/productos.yaml'), 'utf8'));
const categorias = parse(await readFile(path.join(raiz, 'src/data/categorias.yaml'), 'utf8'));
const html = await readFile(path.join(raiz, 'dist/menu/index.html'), 'utf8');

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const escapar = (t) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const contiene = (t) => html.includes(t) || html.includes(escapar(t));

// Bloque HTML de cada producto: <article ... data-producto="id" ...> hasta </article>.
function bloque(id) {
  const i = html.indexOf(`data-producto="${id}"`);
  if (i < 0) return null;
  return html.slice(i, html.indexOf('</article>', i));
}

const fallos = [];
const resumen = [];
for (const c of categorias) {
  const deCat = productos.filter((p) => p.categoria === c.id);
  let precios = 0;
  for (const p of deCat) {
    const b = bloque(p.id);
    if (!b) {
      fallos.push(`${c.id}/${p.id}: no aparece en el menú publicado`);
      continue;
    }
    const enBloque = (t) => b.includes(t) || b.includes(escapar(t));
    if (!enBloque(p.nombre)) fallos.push(`${p.id}: falta el nombre "${p.nombre}"`);
    if (!b.includes(`data-categoria="${c.id}"`)) fallos.push(`${p.id}: está fuera de su categoría ${c.id}`);
    const valores = [p.precio, ...(p.opciones ?? []).map((o) => o.precio)].filter((v) => v !== undefined);
    for (const v of valores) {
      precios++;
      if (!enBloque(usd.format(v))) fallos.push(`${p.id}: falta el precio ${usd.format(v)}`);
    }
    for (const o of p.opciones ?? []) if (!enBloque(o.nombre)) fallos.push(`${p.id}: falta la opción "${o.nombre}"`);
    for (const n of p.lista ?? []) if (!enBloque(n)) fallos.push(`${p.id}: falta "${n}" de la lista`);
    if (p.descripcion && !enBloque(p.descripcion)) fallos.push(`${p.id}: la descripción no coincide`);
    if (p.revisar && contiene(p.revisar)) fallos.push(`${p.id}: ¡la nota interna "revisar" se publicó!`);
  }
  if (!html.includes(`id="${c.id}"`)) fallos.push(`categoría ${c.id}: no tiene panel en el menú`);
  resumen.push({ categoria: c.nombre, productos: deCat.length, precios });
}

console.table(resumen);
const total = resumen.reduce((n, r) => n + r.productos, 0);
const totalPrecios = resumen.reduce((n, r) => n + r.precios, 0);
console.log(`Productos: ${total} · precios: ${totalPrecios} · categorías: ${categorias.length}`);
const sinPrecio = productos.filter((p) => p.precio === undefined && !(p.opciones ?? []).some((o) => o.precio !== undefined));
console.log(`Sin precio publicado (${sinPrecio.length}): ${sinPrecio.map((p) => p.id).join(', ')}`);
if (fallos.length) {
  console.error(`\n✗ ${fallos.length} problema(s):\n- ${fallos.join('\n- ')}`);
  process.exit(1);
}
console.log('✓ Todos los productos, opciones y precios de productos.yaml están en el menú publicado.');
