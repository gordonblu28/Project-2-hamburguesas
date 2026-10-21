import type { APIRoute } from 'astro';

// Las direcciones de un sitemap son absolutas: usan el dominio de astro.config.mjs (o SITE_URL).
export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://example.invalid');
  const rutas = ['/', '/menu/', '/favorites/', '/visit/', '/reservations/'];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rutas.map((r) => `  <url><loc>${new URL(r, base).href}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
