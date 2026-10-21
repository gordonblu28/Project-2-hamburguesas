import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import productosYaml from '../data/productos.yaml?raw';

export type Categoria = CollectionEntry<'categorias'>;
export type Producto = CollectionEntry<'productos'>;
export type Etiqueta = Producto['data']['etiquetas'][number];

const fotos = import.meta.glob<{ default: ImageMetadata }>('../assets/platos/*.jpg', { eager: true });

/** Foto de src/assets/platos/<nombre>.jpg (recorte del menú impreso). */
export function foto(nombre?: string): ImageMetadata | undefined {
  if (!nombre) return undefined;
  const img = fotos[`../assets/platos/${nombre}.jpg`]?.default;
  if (!img) throw new Error(`No existe la foto "src/assets/platos/${nombre}.jpg".`);
  return img;
}

/** Tamaño máximo (px CSS) al que conviene mostrar una foto: los recortes salen de fotos de baja
 *  resolución y se guardaron al doble; más allá de ~1.6× el original se ven borrosos. */
export function ladoMaximo(img: ImageMetadata): number {
  return Math.round((img.width / 2) * 1.6);
}

export const PIE_FOTO = 'Photo from The Rodeo’s printed menu.';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const precio = (n: number) => usd.format(n);

/** Precio corto para la lista: único, rango de opciones o null si no hay precio publicado. */
export function precioResumen(p: Producto): string | null {
  const d = p.data;
  if (d.precio !== undefined) return precio(d.precio);
  const valores = (d.opciones ?? []).map((o) => o.precio).filter((v): v is number => v !== undefined);
  if (!valores.length) return null;
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  return min === max ? precio(min) : `${precio(min)}+`;
}

export const ETIQUETAS: Record<Etiqueta, string> = {
  favorite: 'Favorite',
  new: 'New!',
  angus: 'Certified Angus',
  weekend: 'Weekend only',
};

export async function categorias(): Promise<Categoria[]> {
  return (await getCollection('categorias')).sort((a, b) => a.data.orden - b.data.orden);
}

// El orden del menú es el orden en que aparecen los productos en productos.yaml.
const ordenArchivo = [...productosYaml.matchAll(/^- id:\s*([\w-]+)/gm)].map((m) => m[1]);

export async function productos(): Promise<Producto[]> {
  return (await getCollection('productos')).sort((a, b) => ordenArchivo.indexOf(a.id) - ordenArchivo.indexOf(b.id));
}

/** Productos agrupados por categoría, en orden. */
export async function menuCompleto() {
  const [cats, prods] = await Promise.all([categorias(), productos()]);
  return cats.map((categoria) => ({
    categoria,
    productos: prods.filter((p) => p.data.categoria.id === categoria.id),
  }));
}

export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

/** Texto en el que busca el buscador del menú. */
export function textoBusqueda(p: Producto, cat?: Categoria): string {
  const d = p.data;
  return normalizar(
    [
      d.nombre,
      d.numero && `#${d.numero}`,
      d.descripcion,
      cat?.data.nombre,
      ...(d.opciones ?? []).map((o) => o.nombre),
      ...(d.carnes ?? []),
      ...(d.lista ?? []),
      ...d.etiquetas.map((e) => ETIQUETAS[e]),
    ]
      .filter(Boolean)
      .join(' '),
  );
}

export const rutaProducto = (p: Producto) => `/menu/?c=${p.data.categoria.id}&item=${p.id}`;
