# The Rodeo Bar And Grill — sitio web

Sitio (Astro 7 + GSAP) para The Rodeo Bar And Grill, restaurante mexicano en Leon Valley, TX. Dos identidades visuales de la misma marca: la principal, de **cantina mexicana** (logo oficial a color, verde, blanco y rojo de la bandera, papel picado, grecas y talavera sobre beige) y la de Halloween (morado, naranja quemado y carbón). Menú completo e interactivo con **tarjetas de platillos**, cuenta regresiva real, **confeti tricolor de bienvenida**, **botones flotantes** (Llamar, Reservar, Menú) y **reservaciones en línea con depósito del 50 %** (Cloudflare Worker + base de datos D1 + Stripe Checkout). Sin pedidos de comida en línea. Hecho por Tempozz Studio.

| Ruta | Contenido |
| --- | --- |
| `/` | Inicio: papel picado, titular "RODEO" con la placa roja del logo, el jinete del logo (a color) lanza un lazo que atrapa la tarjeta de un plato destacado contra un sol de arena; cinta verde con las categorías; "Our most loved dishes" en tarjetas; franja "Save your table" hacia reservaciones; acceso discreto a Halloween |
| `/menu/` | Menú completo: 18 categorías (cocina y bar), buscador, ficha ampliada. Enlaces directos: `/menu/?c=steaks`, `/menu/?c=tacos&item=quesabirrias`. El enlace antiguo `/menu/?c=seasonal` lleva a `/halloween/` |
| `/favorites/` | Platos marcados ★ Favorite / New! en el menú y platos de la casa con foto. Enlace directo: `/favorites/?d=rafas-plate` |
| `/visit/` | Dirección, Google Maps / Apple Maps, teléfono, Instagram y horario (pendiente) |
| `/reservations/` | **Reservaciones**: personas, fecha, horarios con disponibilidad real del servidor, datos de contacto, peticiones, resumen con total, depósito del 50 % y resto a pagar en el local; pago en Stripe. Si las reservas en línea no están configuradas, lo dice y pide llamar |
| `/reservations/confirmation/` | Vuelta de Stripe: muestra el estado **verificado por el servidor** (confirmada, procesando, no confirmada) y, si se confirmó, el código, los datos y "Add to calendar" (no se indexa) |
| `/reservations/admin/` | Panel del personal (clave `ADMIN_TOKEN`): reservas por fecha y estado, contacto, depósito, peticiones; marcar sentada / completada / no llegó / cancelada (no se indexa) |
| `/halloween/` | **Halloween Special**: portada nocturna (luna, el jinete sobre una meseta, brasas y bruma) con la cuenta regresiva integrada; Halloween Specials, Featured Drinks (aparece al cargar bebidas con foto), The Halloween Experience, Visit The Rodeo y cierre |

Todas las páginas comparten cabecera (con el logo oficial a color y franja tricolor), barra inferior en el teléfono, botones flotantes de acceso rápido y un pie de página verde (el del logo) con dirección, teléfono, horario, Instagram, navegación y logo; en Halloween toman la paleta nocturna.

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
npm test               # pruebas de las reglas de reservación (precios, horarios, cupo, validación)
npm run test:integracion  # prueba de punta a punta: el Worker real (wrangler dev + D1 local) contra un Stripe simulado
npm run dev:worker     # el sitio + la API de reservaciones en http://localhost:8787 (requiere .dev.vars)
```

## Publicar en Cloudflare

> **Las reservaciones necesitan la Opción B (Workers).** La Opción A publica solo archivos estáticos: el sitio funciona igual, pero `/reservations/` mostrará "Online reservations are not available right now" y pedirá llamar (nunca simula reservas ni pagos).

**Opción A — Cloudflare Pages (sitio sin reservaciones).**
1. Panel de Cloudflare → *Workers & Pages* → *Create* → *Pages* → *Upload assets*.
2. Nombre del proyecto: `rodeo-bar-and-grill` (así la dirección provisional coincide con la configurada: `https://rodeo-bar-and-grill.pages.dev`).
3. Suba `entrega/rodeo-bar-and-grill-cloudflare.zip` (o la carpeta `dist/`). El `index.html` está en la raíz del ZIP.
4. Con el dominio definitivo: *Custom domains* → conectarlo, cambiar `site` en `astro.config.mjs` (o compilar con `SITE_URL`) y volver a publicar, para que los enlaces canónicos, el sitemap y la imagen para redes usen ese dominio.

Desde la terminal: `npm run deploy:pages` (pide iniciar sesión en Cloudflare la primera vez). Si se conecta un repositorio: comando `npm run build`, carpeta de salida `dist`.

**Opción B — Workers con archivos estáticos (necesaria para reservaciones).** `npm run build && npm run deploy:workers` (usa `wrangler.jsonc`: el Worker `worker/index.ts` atiende solo `/api/*`; todo lo demás se sirve directo desde `dist/`). Antes, la configuración de una sola vez de la sección **Reservaciones**. Al conectar un dominio a un Worker, elegir el tipo **Production**.

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
- **`reservaciones.yaml`** — precio de la reserva, % de depósito, horarios por día, cupo, tamaño de grupo, anticipación y fechas cerradas (ver **Reservaciones**).

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

Los platos son **recortes de las fotos del menú impreso** (`materiales/originales/`), de 50 a 230 px de origen. Se muestran en rectángulos redondeados (`Foto.astro`) con encuadre apaisado, que deja fuera el rótulo impreso que traen abajo. En las tarjetas del menú ocupan el ancho de la tarjeta (~230–300 px), así que **las fotos de menos de ~150 px de origen se ven suaves**: es el límite de los originales, no del diseño. Las fotos grandes y solitarias (categoría, Favorites, Halloween) se limitan a lo que permite su resolución (`limitar`). Con fotos reales de buena resolución, todo se ve nítido sin tocar el diseño. Para usar una foto real:
1. Guárdela en `materiales/originales/` y agregue su recorte a `RECORTES` en `scripts/preparar-imagenes.mjs` (o colóquela directamente como `src/assets/platos/<id>.jpg`, cuadrada).
2. En `productos.yaml`, ponga `foto: <id>` en el producto.
3. `npm run imagenes` (si usó el recorte) y `npm run build`.

## Reservaciones en línea (depósito del 50 %)

**Cómo funciona.**
1. La persona elige número de personas y fecha. El navegador pide los horarios al servidor (`GET /api/reservations/availability`), que calcula cuáles caben según el horario, la anticipación mínima y las reservas ya hechas en la base de datos. **Nunca se muestra un horario como disponible sin que el servidor lo haya comprobado.**
2. Deja nombre, teléfono, correo y peticiones. El resumen muestra el **total de la reserva**, el **depósito (50 %)** que se paga ahora y el **resto** que se paga en el restaurante.
3. Al pagar, el servidor valida todo otra vez, **aparta el lugar** (en una sola sentencia SQL que comprueba el cupo: dos personas que reservan a la vez no pueden pasarse) y crea una sesión de **Stripe Checkout** por el monto del depósito, que el servidor calcula (el navegador no puede cambiarlo). La tarjeta se escribe en la página de Stripe: el sitio nunca ve ni guarda datos de tarjeta.
4. La reserva queda **confirmada solo cuando Stripe confirma el pago**: por el webhook firmado (`checkout.session.completed`, `async_payment_succeeded`) o, si el aviso tarda, porque la página de confirmación hace que el servidor pregunte a Stripe. Se comprueba además que el monto y la moneda cobrados coincidan.
5. Si la persona cancela en Stripe, vuelve a `/reservations/?cancelled=…`: el servidor vence la sesión de pago, libera el lugar y el formulario conserva sus datos. Si no paga en `minutos_para_pagar`, el apartado vence solo. Pagos diferidos: "procesando" (el lugar sigue apartado) → confirmada o fallida (se libera).

**Precio ("total de la reserva").** No es la cuenta de la comida: es una tarifa de reserva que fija el restaurante en `reservaciones.yaml` → `tarifa` (`por_persona` o `por_reserva`, y `monto`). Depósito = `deposito_porcentaje` (50) % del total, redondeado al centavo; resto = total − depósito. **Hoy `tarifa.monto` está vacío y el `horario` sin turnos: las reservas en línea están apagadas hasta que el dueño los fije.**

**Estados** (`reservaciones.estado`): `pendiente_pago` → `confirmada` (→ `sentada` → `completada`, o `no_llego`); también `procesando_pago`, `vencida`, `cancelada`, `pago_fallido` y `revision` (pago con monto que no coincide: lo revisa el personal).

**Configuración de una sola vez** (cuenta de Cloudflare y de Stripe del restaurante):
1. `npx wrangler@4 login`
2. Base de datos: `npx wrangler@4 d1 create rodeo-reservaciones` → copiar el `database_id` a `wrangler.jsonc` → `npm run db:migrar`.
3. Stripe (Dashboard → Developers): copiar la clave secreta (`sk_live_…`; para probar, `sk_test_…`) → `npx wrangler@4 secret put STRIPE_SECRET_KEY`.
4. Stripe → Webhooks → *Add endpoint*: `https://SU-DOMINIO/api/stripe/webhook`, eventos `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired` → copiar el *signing secret* (`whsec_…`) → `npx wrangler@4 secret put STRIPE_WEBHOOK_SECRET`.
5. Clave del panel del personal (larga y aleatoria, 16+ caracteres): `npx wrangler@4 secret put ADMIN_TOKEN`. Recomendado además proteger `/reservations/admin/` y `/api/admin/` con Cloudflare Access.
6. En `src/data/reservaciones.yaml`: `tarifa.monto`, `horario`, `cupo_personas` (y lo demás si hace falta). Luego `npm run build && npm run deploy:workers`.
7. Recomendado: una regla de *Rate limiting* de Cloudflare para `POST /api/reservations`.

Las claves viven solo como *secrets* del Worker; nunca en el código, en el repositorio ni en el navegador. Para probar en local: copiar `.dev.vars.example` como `.dev.vars` (no se sube) y `npm run dev:worker`.

**Lo que no hace (alcance aparte):** correos de confirmación propios (Stripe envía el recibo del pago al correo de la persona; el restaurante ve las reservas en el panel), recordatorios por SMS, reembolsos automáticos (se hacen en el panel de Stripe; el enlace al pago está en cada reserva del panel) ni asignación de mesas concretas (el cupo se cuenta en personas).

## Estructura

```
src/data/               contenido editable (YAML)
src/content.config.ts   validación del menú
src/lib/                lectura de datos, precios, hora local del negocio
src/pages/              inicio, menu, favorites, visit, halloween, 404, robots.txt, sitemap.xml
src/components/         cabecera, marca (logo a color), jinete a color, papel picado, tarjeta de platillo, foto, barra inferior,
                        botones flotantes, pie, puerta y velo…
src/scripts/            animaciones e interacción (GSAP): puerta y velo, revelado, inicio, menú, favoritos, visita,
                        halloween, cuenta regresiva, confeti, reservaciones, confirmación y panel
src/lib/reservas.ts     reglas de reservación (precios, horarios, cupo, validación): las usan la página y el servidor
src/lib/hora.ts         hora local del negocio (America/Chicago) sin librerías
worker/                 servidor (Cloudflare Worker): API de reservaciones, Stripe y panel del personal
migrations/             esquema de la base de datos D1
tests/                  pruebas (npm test) y prueba de punta a punta con Stripe simulado (tests/integracion/)
src/styles/global.css   identidad principal: tokens, tipografía, botones, revelado y movimiento reducido
src/styles/halloween.css identidad de Halloween: redefine los tokens (solo la carga /halloween/)
scripts/                imágenes, verificación del menú y ZIP de entrega
materiales/originales/  fotos y logo tal como llegaron de Drive
materiales/revision/    hojas de revisión de recortes y del jinete (npm run imagenes; no se publican)
```

## Dirección creativa (resumen)

**v3 (2026-10-21) — cantina mexicana.** Sobre la base western, la identidad se vuelve claramente mexicana sin perder la marca:
- **Logo oficial a color** en la cabecera, el pie, la imagen social y los favicons (antes la cabecera usaba el jinete como silueta negra pintada con `mask-image`). El jinete del logo aparece **a color** en el inicio, la transición entre páginas, Visit, 404 y Halloween (`src/components/Jinete.astro`).
- **Colores**: verde `#006847` y rojo `#C8102E` de la bandera, el verde hondo `#013121` del fondo del logo (pie, cinta, franja de reservar) y su amarillo `#FFE600` solo sobre verde. Botón principal verde; secundario que se llena de rojo; contraste ≥ 4.5:1 (rojo para texto sobre beige: `#B30D27`).
- **Motivos**: papel picado con recortes reales que se mece (`PapelPicado.astro`), franja tricolor bajo la cabecera, greca escalonada como separador, azulejo de talavera para platillos sin foto. Halloween los reinterpreta en su paleta (tokens `--mx-*`).
- **Platillos**: tarjetas como la referencia del cliente (`Platillo.astro` y `Foto.astro`): foto en rectángulo redondeado arriba, nombre y descripción centrados, precio abajo a la izquierda y acción a la derecha; al pasar el cursor la tarjeta se levanta y la foto se acerca. Se quitaron los medallones redondos y los arcos. En el inicio, el jinete atrapa con el lazo una **tarjeta** del plato.
- **Confeti** verde, blanco y rojo una vez por visita (`src/scripts/confeti.ts`, sin librerías; respeta movimiento reducido y nunca bloquea clics).

**Identidad principal — western contemporáneo.** Beige cálido `#E7DCC8` de fondo, blanco cálido `#FAF6EE` para papel y fichas, negro profundo `#14120F` para texto, botones, cinta y pie; arena `#D2C1A0`, arena oscura `#A38C66` y cuero `#5F5242` para profundidad. Único acento: ascua `#8C3B16`, reservado al acceso a Halloween. Textos y botones con contraste ≥ 4.5:1.
- **Tipografía**: Ultra (letra de madera de cartel) para titulares; Instrument Serif en cursiva para el contrapunto editorial; Barlow Condensed para señalización, etiquetas y precios; Barlow para leer. Autoalojadas.
- **Marca** (v2, reemplazada en v3): el jinete como silueta negra. Desde la v3 se usa el logo y el jinete a todo color.
- **Motivos**: sol de arena con franjas de cartel western, baranda de corral, placas de letrero, espuelas como separadores (los arcos de misión de la v2 se reemplazaron por las tarjetas).
- **Lenguaje de movimiento** (se conserva el de la v1, en la nueva paleta): *corcoveo* (letras y jinete que saltan y se asientan), *lazo* (la cuerda se dibuja y atrapa cada plato), *puerta de corral* (transición entre páginas principales), *sello de hierro* (los precios caen con una sombra de tinta que se seca), *tirar de la cuerda* (revelados con máscara lateral), doble filete en botones, arcos que se revelan de abajo arriba, profundidad con el cursor y al desplazarse.

**Identidad de Halloween — noche western.** Carbón `#120A1A`, morados `#2A1340`–`#7A4FA8`, naranja quemado `#D9692A` (5.5:1 sobre el carbón) y beige pálido `#EFE4D0` solo para leer. Portada: luna de cosecha, el jinete sobre una meseta, título "Halloween" en serif con la placa "SPECIAL" en letra de madera y el contador transparente (sin caja: cifras serif con filetes finos). Animación: luz morada que se desplaza, resplandor naranja que aparece detrás del título, brasas discretas (6 en el teléfono, 14 en escritorio), bruma lenta, la luna que sale y las cifras que caen al cambiar; todo se pausa fuera de pantalla.
- **Entre identidades**, la transición es un *velo*: un círculo de noche (o de día) se abre desde donde se tocó y se disuelve en la página nueva.
- Todo respeta `prefers-reduced-motion` y el botón de pausa de la cabecera (se recuerda en el navegador).

## Notas técnicas

- El menú es HTML real: se lee completo sin JavaScript (como lista con anclas). El escenario por categorías, los gestos, el buscador y la ficha son mejoras progresivas.
- La entrada del inicio es CSS (empieza con el primer pintado, buen LCP); GSAP solo maneja el ciclo de platos, el "jalón" de la cuerda, la profundidad con el cursor y las transiciones.
- Sin rastreadores ni cookies. Servicios externos solo en las reservaciones: Stripe (página de pago) y Cloudflare D1. Los mapas son enlaces (no hay mapa incrustado).
- Sitio en inglés (como el menú del local). Una versión en español sería alcance aparte.
