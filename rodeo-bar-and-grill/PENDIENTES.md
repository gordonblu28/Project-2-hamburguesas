# Pendientes y discrepancias — The Rodeo Bar And Grill

Revisión del 2026-10-20. Fuentes: brief del cliente (TXT del 2026-10-19), 10 imágenes de Google Drive (`PROYECTOS/RODEO`: 6 fotos del menú impreso, 2 de la carta de bar y 2 versiones del logo) y la bio pública de Instagram. **El TXT no trae productos ni precios**: el menú se transcribió de las fotos del menú impreso.

## 1. Datos que debe aportar el cliente

- [ ] **Horario de atención.** En Instagram hay una publicación "Business Hours", pero verla exige iniciar sesión; no se publicó nada. Mientras tanto la página Visit pide llamar.
- [ ] **Bebidas y especiales de Halloween**: nombre, descripción, precio y foto real de cada uno. La página `/halloween/` está lista: "Halloween Specials" muestra un aviso neutro mientras tanto y "Featured Drinks" aparece sola cuando haya bebidas con foto. Se probó con datos de ejemplo (retirados) en escritorio y teléfono.
- [ ] **Fin de la promoción**: configurado de forma provisional al final del 31 de octubre = 1 de noviembre de 2026, 00:00 hora de Texas ("Saturday, October 31 at midnight · Central Time"). ¿Termina a esa hora o al cierre del local? ¿Al terminar se deja el mensaje final en la página (actual) o también se quitan los accesos de la navegación (`al_terminar: ocultar`)?
- [ ] **¿Hay fotos reales para Halloween?** (bebidas, el local decorado, si lo está). La portada de Halloween es gráfica a propósito: los recortes del menú impreso no tienen resolución para verse grandes.
- [ ] **Precios de la carta de bar** (margaritas, cócteles, micheladas, cubetazos, mimosas, cervezas, licores): no aparecen en las fotos. Hoy se muestra "Ask your server for prices".
- [ ] **Lista completa de licores**: la foto se corta en Vodka (Tito's, Grey Goose, Ketel One…). "Patroncita" se ve solo en parte.
- [ ] **Desayunos**: Instagram tiene un destacado "BREAKFAST" y otro "DINNER"; en Drive no hay menú de desayunos.
- [ ] **Logo en vector** (AI, SVG o PDF). Solo hay JPG (1750×899 y la versión circular de Instagram). El jinete animado se recortó del JPG; sus patas se mezclan con la franja "MEXICAN" del logo, por eso en el sitio queda detrás de una baranda.
- [ ] **Fotos reales de los platos** (recomendado: sesión de fotos, servicio aparte). Las actuales son recortes de 50–230 px del menú impreso; no se puede confirmar si son fotos del restaurante o de archivo de la imprenta (el menú lleva el sello de "Menus Don Carlitos – Restaurant Supply").
- [ ] **Dominio** definitivo y **cuenta de Cloudflare** (¿de quién?). Provisional: `rodeo-bar-and-grill.pages.dev`.
- [ ] ¿Los precios incluyen impuestos? Hoy solo dice "Prices in US dollars; menu items and prices may change".
- [ ] ¿Se publica el **mariachi en vivo**? (destacado "LIVE MARIACHI" en Instagram; no se pudo confirmar el día).
- [ ] ¿Se acepta el crédito "Website by Tempozz Studio"? Desde el rediseño está en el pie de todas las páginas.
- [ ] ¿Aprueba el cliente el uso del jinete del logo como **silueta negra** (marca de la cabecera, del inicio y de Halloween)? Es un recorte del mismo dibujo, sin rediseñarlo; el logo oficial a color sigue en el pie y en la imagen para redes.

## 2. Platos con datos ilegibles en la foto (se publicaron sin inventar)

| Plato | Qué falta | En el sitio |
| --- | --- | --- |
| #4 Chalupa Plate | descripción y precio | nombre + "Ask for price" |
| #25 Puffy Tacos Plate | descripción y precios | nombre + "Ask for price" |
| #16 Carne al Pastor Plate | precio y parte de la descripción (reflejo) | descripción parcial + "Ask for price" |
| Taco Norteño | precio y parte de la descripción (reflejo) | "Chicken fajita with cheese and avocado." + "Ask for price" |
| #8 Tampiqueña Plate | descripción | solo nombre y precio |

## 3. Lecturas por confirmar (texto muy pequeño o tapado)

- #8 Tampiqueña Plate **$16.99** · #18 Pollo Feliz $16.99 · #24 Pancho Villa's Chicken $17.99 · #27 Pechuga a la Crema $16.99 (descripción incompleta) · #3 Mexican Plate $10.99 · #22 Bryan's Plate $15.99 · #5 Enchilada Plate $10.99 / $11.99 · #26 Crispy Taco Plate $10.99 (descripción incompleta).
- Jalisco Burrito (shredded chicken or ground beef) **$9.99**: se lee con dificultad.
- #30 Jalisco Burrito Plate **$11.99**: está impreso encima de otro texto.
- Mini Tacos: hay un número entre paréntesis (¿cuántos tacos?) que no se lee.
- #46 Carnitas Plate: una palabra tapada ("perfectly c… pork confit"); se omitió.
- Cubetazos: se lee "5 Beers, Domestic or …".

## 4. Discrepancias del menú impreso

- Hay una foto rotulada **"RODEO PLATE"** pero ningún plato con ese nombre en el texto del menú. No se publicó. ¿Existe? ¿Precio y descripción?
- Faltan los números **7, 20, 32, 34, 35, 36 y 39** en la numeración de platos (¿platos retirados o de otra página del menú?).
- **Chalupas**: la lista "Choice of $4.29" empieza con "Asada Meat", pero "Asada or Fajita" cuesta $5.99. Se omitió "Asada Meat" de la lista de $4.29.
- **Regular Burrito**: ¿los $8.99 aplican a todas las carnes de la lista "Choice of"?
- **Fountain Drinks**: "Starr" y "Bry Red" se copiaron tal como están impresos (¿Starry y Big Red?).
- **Cervezas "Domestic"**: el impreso incluye Heineken, Corona Extra y Modelo Especial en la columna nacional. Se dejó igual.
- Fotos sin rótulo del menú impreso (junto a Burrito Suizo, a Tacos Costra, junto a Tampiqueña): no se usaron para no atribuirlas al plato equivocado. La foto del Alambre Plate se descartó por ilegible (64 px).

## 5. Textos redactados por Tempozz Studio (para aprobación)

No son datos del negocio; son textos de interfaz:
- Inicio: "Bar & Grill · Mexican Restaurant", y el lema resumido de la bio de Instagram: "Mexican food made with the best ingredients."
- Menú: "Ask your server for prices.", "Ask for price", "Prices in US dollars; menu items and prices may change — please confirm with your server."
- Favorites: "Plates our menu marks as favorites or new, and house plates pictured on it."
- Visit: "Admit all", "Please call (210) 969-6002 for today's hours." · 404: "Off the trail".
- Inicio (rediseño): "From the kitchen", "House plates", "A few plates from The Rodeo’s menu, from the grill to the sea. Photos come from the printed menu."
- Halloween (rediseño, todo en `temporada.yaml` salvo lo marcado ✱):
  - Portada: "Halloween Special", "Seasonal drinks and specials at The Rodeo, for a limited time.", ✱"Halloween ends in", ✱"Back to The Rodeo".
  - Sin productos: ✱"The lineup is on its way." + "Our Halloween drinks and specials will be posted here soon. In the meantime, ask your server about this season’s specials — or give us a call."
  - ✱Experience: "A little mystery, a lot of flavor." y "This season’s specials share the table with the full Rodeo menu — sizzling parrilladas, seafood, soups and plates from the grill, with margaritas and cocktails from the bar." (supone que el menú completo sigue disponible durante Halloween: confirmar).
  - ✱Cierre: "See you at The Rodeo".
  - Al terminar: "That’s a wrap on Halloween" + "Thank you for celebrating the season with us. The full Rodeo menu is ready whenever you are."

## 6. Alcance que se cotiza aparte

Pedidos en línea, carrito o pagos · reservas con sistema · versión en español · sesión de fotos · panel para editar el menú · integración con POS o plataformas de delivery.

## 7. Rediseño del 2026-10-20 (v2): decisiones tomadas

- Identidad principal beige, blanco y negro; Halloween con identidad propia en `/halloween/`. El panel "Seasonal" del menú se quitó: `/menu/?c=seasonal` lleva a la página nueva.
- Los colores por categoría del menú (amarillo, rojo, verde…) se retiraron: no caben en la paleta. `categorias.yaml` ya no los lleva.
- La portada de Halloween no lleva foto: la más grande disponible mide 230 px de origen y se vería borrosa a ese tamaño. Las fotos reales aparecen en "The Halloween Experience", con viñeta nocturna que no altera el color de los platos.
- Las fotos de los arcos ocultan la franja inferior de cada recorte, donde el menú impreso trae el rótulo del plato.

## 8. No verificado todavía

- Teléfonos físicos (Android de gama media e iPhone/Safari) y Firefox: las pruebas se hicieron con Chrome (Playwright) emulando móviles, CPU 4× más lenta y 4G lenta. La silueta usa `mask-image` (Safari 15.4+, Firefox 53+).
- Publicación real en Cloudflare (el ZIP tiene `index.html` en la raíz, formato que acepta *Upload assets*).
