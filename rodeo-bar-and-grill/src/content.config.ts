// Esquemas del menú. Si src/data/categorias.yaml o productos.yaml tienen un error (un precio
// con texto, una categoría que no existe, una etiqueta mal escrita…), `npm run build` se
// detiene y explica qué corregir.
import { defineCollection, reference } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const precio = z.number().positive();
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use un color hexadecimal como "#FFD400".');

const categorias = defineCollection({
  loader: file('src/data/categorias.yaml'),
  schema: z.object({
    id: z.string().optional(),
    nombre: z.string(),
    corto: z.string(),
    seccion: z.enum(['kitchen', 'bar']),
    foto: z.string().optional(),
    foto_alt: z.string().optional(),
    icono: z.enum(['margarita', 'coctel', 'cerveza', 'botella', 'refresco']).optional(),
    nota: z.string().optional(),
    // Ya no se usa: la identidad beige, blanco y negro no colorea las categorías. Se acepta
    // para no romper archivos antiguos.
    color: color.optional(),
    orden: z.number(),
  }).strict(),
});

const productos = defineCollection({
  loader: file('src/data/productos.yaml'),
  schema: z
    .object({
      id: z.string().optional(),
      categoria: reference('categorias'),
      numero: z.string().optional(),
      nombre: z.string(),
      descripcion: z.string().optional(),
      precio: precio.optional(),
      // .strict(): un nombre con coma sin comillas en YAML se parte en dos claves y falla aquí.
      opciones: z.array(z.object({ nombre: z.string(), precio: precio.optional() }).strict()).min(1).optional(),
      carnes: z.array(z.string()).optional(),
      lista: z.array(z.string()).optional(),
      etiquetas: z.array(z.enum(['favorite', 'new', 'angus', 'weekend'])).default([]),
      foto: z.string().optional(),
      revisar: z.string().optional(),
    })
    // Un campo mal escrito (por ejemplo "descripción" con tilde) detiene la compilación.
    .strict()
    .superRefine((p, ctx) => {
      if (p.precio !== undefined && p.opciones) {
        ctx.addIssue({
          code: 'custom',
          path: ['precio'],
          message: `"${p.nombre}" tiene "precio" y "opciones": deje solo uno de los dos.`,
        });
      }
    }),
});

export const collections = { categorias, productos };
