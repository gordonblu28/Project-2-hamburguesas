// @ts-check
import { defineConfig } from 'astro/config';

// Dominio pendiente de confirmar con el cliente. Mientras tanto se usa la dirección que
// Cloudflare Pages asigna al proyecto "rodeo-bar-and-grill". Al tener el dominio definitivo:
//   cambiar el valor de abajo, o compilar con  SITE_URL=https://dominio npm run build
const site = process.env.SITE_URL?.replace(/\/+$/, '') || 'https://rodeo-bar-and-grill.pages.dev';

export default defineConfig({
  site,
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },
  // Solo los enlaces marcados con data-astro-prefetch (navegación principal) se descargan por
  // adelantado al aparecer en pantalla; Astro no lo hace con ahorro de datos activado.
  prefetch: { prefetchAll: false, defaultStrategy: 'viewport' },
  devToolbar: { enabled: false },
});
