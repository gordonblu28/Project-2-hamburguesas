import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  // El panel del personal y las confirmaciones no se indexan (además llevan noindex).
  const lineas = ['User-agent: *', 'Allow: /', 'Disallow: /reservations/admin/', 'Disallow: /reservations/confirmation/', 'Disallow: /api/'];
  if (site) lineas.push('', `Sitemap: ${new URL('/sitemap.xml', site).href}`);
  return new Response(lineas.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
