# The Rodeo Bar And Grill — sitio web

Sitio estático (Astro 7 + GSAP) para The Rodeo Bar And Grill, restaurante mexicano en Leon Valley, TX. Cinco páginas con dos identidades visuales de la misma marca: la principal (beige, blanco y negro) y la de Halloween (morado, naranja quemado y carbón). Menú completo e interactivo y cuenta regresiva real. Sin backend, sin base de datos, sin pedidos ni pagos. Hecho por Tempozz Studio.

| Ruta | Contenido |
| --- | --- |
| `/` | Inicio: titular "RODEO", el jinete (silueta del logo) lanza un lazo que atrapa un plato destacado contra un sol de arena; cinta con las categorías; galería "House plates" en arcos; acceso discreto a Halloween |
| `/menu/` | Menú completo: 18 categorías (cocina y bar), buscador, ficha ampliada. Enlaces directos: `/menu/?c=steaks`, `/menu/?c=tacos&item=quesabirrias`. El enlace antiguo `/menu/?c=seasonal` lleva a `/halloween/` |
| `/favorites/` | Platos marcados ★ Favorite / New! en el menú y platos de la casa con foto. Enlace directo: `/favorites/?d=rafas-plate` |
| `/visit/` | Dirección, Google Maps / Apple Maps, teléfono, Instagram y horario (pendiente) |
| `/halloween/` | **Halloween Special**: portada nocturna (luna, el jinete sobre una meseta, brasas y bruma) con la cuenta regresiva integrada; Halloween Specials, Featured Drinks (aparece al cargar bebidas con foto), The Halloween Experience, Visit The Rodeo y cierre |

Todas las páginas comparten cabecera, barra inferior en el teléfono y un pie de página real (dirección, teléfono, horario, Instagram, navegación y logo oficial); en Halloween toman la paleta nocturna.

## Comandos

Requiere Node.js 22.12 o superior.

```bash
npm install            # una vez
npm run dev            # vista de desarrollo en http://localhost:4321
npm run build          # compila en dist/ y crea entrega/rodeo-bar-and-grill-cloudflare.zip
npm run verificar      # comprueba que cada producto y precio de productos.yaml está en el menú publicado
npm run preview        # sirve dist/ para revisarlo
npm run imagenes       # rehace recortes de platos, jinete, favicons e imagen social desde materiales/originales/
npm run zip:codigo     # crea entrega/rodeo-bar-and-grill-codigo.zip (proyecto sin dependencias)
```

## Publicar en Cloudflare

**Opción A — Cloudflare Pages (recomendada).**
1. Panel de Cloudflare → *Workers & Pages* → *Create* → *Pages* → *Upload assets*.
2. Nombre del proyecto: `rodeo-bar-and-grill` (así la dirección provisional coincide con la configurada: `https://rodeo-bar-and-grill.pages.dev`).
3. Suba `entrega/rodeo-bar-and-grill-cloudflare.zip` (o la carpeta `dist/`). El `index.html` está en la raíz del ZIP.
4. Con el dominio definitivo: *Custom domains* → conectarlo, cambiar `site` en `astro.config.mjs` (o compilar con `SITE_URL`) y volver a publicar, para que los enlaces canónicos, el sitemap y la imagen para redes usen ese dominio.

Desde la terminal: `npm run deploy:pages` (pide iniciar sesión en Cloudflare la primera vez). Si se conecta un repositorio: comando `npm run build`, carpeta de salida `dist`.

**Opción B — Workers con archivos estáticos.** `npm run build && npm run deploy:workers` (usa `wrangler.jsonc`). Al conectar un dominio a un Worker, elegir el tipo **Production**.

En ambos casos `/menu` redirige a `/menu/` y las rutas inexistentes muestran `404.html` con estado 404. `public/_headers` aplica cabeceras de seguridad y caché larga solo a `/_astro/` (archivos con huella); el HTML no se guarda en caché, así un cambio de precios se ve de inmediato.

```bash
# Compilar para otro dominio (PowerShell)
$env:SITE_URL = "https://dominio-del-cliente.com"; npm run build
```

## Cómo actualizar el contenido

Todo está en `src/data/` y no hace falta tocar el diseño. Si un dato tiene un formato incorrecto, `npm run build` se detiene y dice qué corregir.

- **`productos.yaml`** — productos, precios (`precio: 14.99`) u opciones con precio, carnes a elegir, listas (cervezas, sabores), etiquetas (`favorite`, `new`, `angus`, `weekend`) y foto. El orden del archivo es el orden del menú. El campo `revisar` es una nota interna: **no se publica**. Si el nombre de una opción lleva coma, va entre comillas.
- **`categorias.yaml`** — nombre, texto corto de la pestaña, sección (cocina/bar), foto o ícono, nota y color.
- **`negocio.yaml`** — dirección, teléfono, Instagram y **horario** (vacío por ahora: el sitio pide llamar para confirmarlo).
- **`destacados.yaml`** — qué platos salen en `/favorites/` y en el lazo del inicio (estos últimos solo si tienen foto con resolución suficiente).
- **`portada.yaml`** — platos de la galería "House plates" del inicio (conviene elegir los recortes más nítidos).
- **`temporada.yaml`** — página de Halloween (ver abajo).

Después de editar: `npm run build`, `npm run verificar` y volver a publicar.

### Página de temporada (Halloween)

En `src/data/temporada.yaml`:
- `termina: "2026-11-01T00:00"` en **hora local del negocio** (`America/Chicago`). Todos los visitantes ven el mismo vencimiento, estén donde estén y en cualquier dispositivo; el horario de verano se calcula solo. La página lo muestra como "Saturday, October 31 at midnight · Central Time".
- El contador se actualiza cada segundo con el reloj del dispositivo, se recalcula al volver a la pestaña y se detiene en cero: nunca muestra negativos ni se reinicia. Sin JavaScript solo se ve la fecha de fin.
- `al_terminar: mensaje` cambia la portada por `mensaje_final` y `mensaje_final_detalle` y oculta los especiales; `ocultar` además quita los accesos a Halloween de la navegación, del menú y del inicio.
- `productos:` — bebidas, platillos o promociones (`tipo: bebida | platillo | promocion`) con nombre, descripción, precio y foto real (fotos en `src/assets/temporada/`). Mientras la lista esté vacía, "Halloween Specials" muestra un aviso neutro (`sin_productos`), nunca productos de ejemplo. Las bebidas con foto forman además la sección "Featured Drinks".
- Textos de la portada: `titulo_portada` ("Halloween"), `titulo_portada_cursiva` ("Special"), `bajada`; `nombre_corto` es el texto del acceso en la navegación.
- Para otra temporada: cambie textos, fecha y productos; `tema: ninguno` usa la paleta principal. `activa: false` apaga los accesos.
- Si se compila después del vencimiento, la página ya sale con el mensaje final.

### Fotos

Los platos son **recortes de las fotos del menú impreso** (`materiales/originales/`), de 50 a 230 px de origen. Se usan en medallones redondos y en arcos, nunca más grandes de lo que su resolución permite (los arcos se encogen solos si la foto no alcanza y ocultan el rótulo impreso que traen abajo); cada vista lo indica ("Photo from the printed menu"). Por eso la portada de Halloween es gráfica (luna y silueta) y las fotos aparecen en las secciones siguientes, a su tamaño. Para usar una foto real:
1. Guárdela en `materiales/originales/` y agregue su recorte a `RECORTES` en `scripts/preparar-imagenes.mjs` (o colóquela directamente como `src/assets/platos/<id>.jpg`, cuadrada).
2. En `productos.yaml`, ponga `foto: <id>` en el producto.
3. `npm run imagenes` (si usó el recorte) y `npm run build`.

## Estructura

```
src/data/               contenido editable (YAML)
src/content.config.ts   validación del menú
src/lib/                lectura de datos, precios, hora local del negocio
src/pages/              inicio, menu, favorites, visit, halloween, 404, robots.txt, sitemap.xml
src/components/         cabecera, marca, silueta, barra inferior, pie, puerta y velo, medallón con lazo, arco, fila del menú…
src/scripts/            animaciones e interacción (GSAP): puerta y velo, revelado, inicio, menú, favoritos, visita,
                        halloween, cuenta regresiva
src/styles/global.css   identidad principal: tokens, tipografía, botones, revelado y movimiento reducido
src/styles/halloween.css identidad de Halloween: redefine los tokens (solo la carga /halloween/)
scripts/                imágenes, verificación del menú y ZIP de entrega
materiales/originales/  fotos y logo tal como llegaron de Drive
materiales/revision/    hojas de revisión de recortes y de la silueta (no se publican)
```

## Dirección creativa (resumen)

**Identidad principal — western contemporáneo.** Beige cálido `#E7DCC8` de fondo, blanco cálido `#FAF6EE` para papel y fichas, negro profundo `#14120F` para texto, botones, cinta y pie; arena `#D2C1A0`, arena oscura `#A38C66` y cuero `#5F5242` para profundidad. Único acento: ascua `#8C3B16`, reservado al acceso a Halloween. Textos y botones con contraste ≥ 4.5:1.
- **Tipografía**: Ultra (letra de madera de cartel) para titulares; Instrument Serif en cursiva para el contrapunto editorial; Barlow Condensed para señalización, etiquetas y precios; Barlow para leer. Autoalojadas.
- **Marca**: el jinete del logo convertido en silueta (`npm run imagenes` la genera del JPG), pintada como máscara del color de cada paleta. El logo oficial a color está en el pie y en la imagen para redes.
- **Motivos**: sol de arena con franjas de cartel western, baranda de corral, arcos de misión (San Antonio, El Álamo) con doble filete para las fotos, placas negras de letrero, espuelas como separadores.
- **Lenguaje de movimiento** (se conserva el de la v1, en la nueva paleta): *corcoveo* (letras y jinete que saltan y se asientan), *lazo* (la cuerda se dibuja y atrapa cada plato), *puerta de corral* (transición entre páginas principales), *sello de hierro* (los precios caen con una sombra de tinta que se seca), *tirar de la cuerda* (revelados con máscara lateral), doble filete en botones, arcos que se revelan de abajo arriba, profundidad con el cursor y al desplazarse.

**Identidad de Halloween — noche western.** Carbón `#120A1A`, morados `#2A1340`–`#7A4FA8`, naranja quemado `#D9692A` (5.5:1 sobre el carbón) y beige pálido `#EFE4D0` solo para leer. Portada: luna de cosecha, el jinete sobre una meseta, título "Halloween" en serif con la placa "SPECIAL" en letra de madera y el contador transparente (sin caja: cifras serif con filetes finos). Animación: luz morada que se desplaza, resplandor naranja que aparece detrás del título, brasas discretas (6 en el teléfono, 14 en escritorio), bruma lenta, la luna que sale y las cifras que caen al cambiar; todo se pausa fuera de pantalla.
- **Entre identidades**, la transición es un *velo*: un círculo de noche (o de día) se abre desde donde se tocó y se disuelve en la página nueva.
- Todo respeta `prefers-reduced-motion` y el botón de pausa de la cabecera (se recuerda en el navegador).

## Notas técnicas

- El menú es HTML real: se lee completo sin JavaScript (como lista con anclas). El escenario por categorías, los gestos, el buscador y la ficha son mejoras progresivas.
- La entrada del inicio es CSS (empieza con el primer pintado, buen LCP); GSAP solo maneja el ciclo de platos, el "jalón" de la cuerda, la profundidad con el cursor y las transiciones.
- Sin rastreadores, cookies ni servicios externos. Los mapas son enlaces (no hay mapa incrustado).
- Sitio en inglés (como el menú del local). Una versión en español sería alcance aparte.
