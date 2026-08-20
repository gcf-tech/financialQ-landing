# TICKETS — backlog vivo

> Convención por ticket: `## T-NNN · título` + estado (`abierto` /
> `en curso` / `cerrado AAAA-MM-DD`) + descripción corta + archivos
> implicados. Añadir nuevos al final. No borrar cerrados: marcar fecha.

## T-002 · Configurar GHL en Dokploy antes del primer post
- **Estado:** abierto (bloquea el aviso del newsletter en producción)
- **Detectado:** 2026-07-08 · **Actualizado:** 2026-07-09
- El plan de GHL no incluye Inbound Webhook (de pago): el backend ahora hace
  el fan-out directo (custom values + tag disparador `notify-post-es/en`;
  ver `ghl-newsletter.service.ts`). Verificado en vivo contra GHL el
  2026-07-08 sin enviar correos.
- Pendiente (usuaria): en Environment de Dokploy poner `GHL_API_URL` (v2
  leadconnectorhq), `GHL_API_KEY` (PIT raw, sin "Bearer "), `GHL_LOCATION_ID`
  y `SITE_URL`; y en GHL confirmar los 2 workflows (trigger Contact Tag
  Added `notify-post-es`/`notify-post-en` → Send Email con custom values →
  Remove Tag, publicados y con re-entrada). Los custom values `post_*` ya
  existen (los creó la verificación). Detalle: MANUAL-DESPLIEGUE.md §7.

## T-001 · Lint: `react-hooks/set-state-in-effect` en Header.jsx
- **Estado:** abierto
- **Detectado:** 2026-07-08 (preexistente al cambio del login en header;
  confirmado contra HEAD con `git show | eslint --stdin`)
- `npx eslint src/widgets/header/Header.jsx` reporta 2 errores por
  `setState` síncrono dentro de effects (cierre de menú al cambiar de ruta
  y reset del dropdown al cerrar el burger). No hay CI, así que no bloquea,
  pero es la razón por la que el lint del archivo sale en rojo.
- Archivos: `src/widgets/header/Header.jsx:31`, `:50`

## T-003 · Desplegar auto-gestión de contraseña del /admin
- **Estado:** abierto (el frontend ya está; falta backend + subida)
- **Detectado:** 2026-07-09
- El frontend de primer-cambio + "olvidé mi contraseña" + `/reset-password`
  ya está y verificado headless. Para que funcione en producción falta:
  1. **Backend** (`financial-backend`, Dokploy): correr `npm run migrate` en
     el contenedor (aplica la migración 005: FK a `users`, `must_change_password`,
     alta de los 6 usuarios, tabla `password_reset_tokens`).
  2. **SMTP** en Environment de Dokploy: `SMTP_USER` y `SMTP_PASS` del buzón
     `@gcf.group` de Hostinger (host/puerto ya traen default). Sin esto,
     `/auth/forgot-password` responde OK pero no envía correo.
  3. **Landing:** `npm run build` + subir `dist/` a Hostinger.
- Contraseña temporal inicial de cada usuario = su username (deben cambiarla
  al primer ingreso).
- Archivos: `shared/api/auth.js`, `pages/admin/AdminLoginPage.jsx`,
  `pages/admin/ResetPasswordPage.jsx`, `pages/admin/PostEditorPage.jsx`,
  `App.jsx`, locales `en/es`.

## T-004 · Subir el build con SEO y dar de alta el sitemap
- **Estado:** abierto (bloquea que cualquier cosa del SEO sirva en producción)
- **Detectado:** 2026-08-04
- Todo lo del 2026-08-04 está en el código y verificado en local, pero el
  despliegue es manual. Pendiente (usuaria):
  1. `npm run build` + subir `dist/` completo a Hostinger. **Ojo: ahora el
     build genera subcarpetas** (`dist/sobre/index.html`, `dist/approach/risk/…`)
     y `dist/fonts/`. Una subida parcial de solo `assets/` deja el sitio a
     medias.
  2. Comprobar en vivo: `https://financialqgroup.com/robots.txt`,
     `/sitemap.xml`, `/llms.txt` y `/og-image.jpg` deben responder 200.
  3. Verificar que `https://financialqgroup.com/sobre` **no** redirija a
     `/sobre/` con 301 (si lo hace, la regla 1a-bis del `.htaccess` no se
     aplicó — revisar que LiteSpeed tenga `AllowOverride` habilitado).
  4. Google Search Console: dar de alta la propiedad y enviar el sitemap.
- Archivos: `public/.htaccess`, `public/robots.txt`, `public/sitemap.xml`

## T-005 · Prerender de los artículos de Perspectives
- **Estado:** abierto (decisión pendiente, no es un bug)
- **Detectado:** 2026-08-04
- `/perspectivas/:id` no se pre-renderiza y `/perspectivas` sale como cascarón:
  los posts llegan de `GET /landings/posts` en un `useEffect`, que no corre en
  el render de Node. Consecuencia: un artículo compartido en LinkedIn muestra
  el título y la portada de la home, no los suyos.
- Solución posible: que `scripts/prerender.mjs` haga `fetch` al backend en
  build y emita una ruta por post. Contrapartida: ata el build a que el backend
  esté arriba y obliga a rebuild + subida manual en cada post nuevo.
- Detalle y alternativas: `PRERENDER-TODO.md` §1
- Archivos: `scripts/prerender.mjs`, `shared/api/posts.js`

## T-006 · Datos que faltan para completar el JSON-LD y el llms.txt
- **Estado:** abierto (esperando dato de la firma, no hay nada que programar)
- **Detectado:** 2026-08-04
- Se dejaron como TODO comentado en `index.html` en vez de inventarlos:
  - `sameAs`: página de LinkedIn **de empresa**. La que hay enlazada en
    `SocialLinks.jsx:20` es el perfil personal de David Enciso.
  - `twitter:site`: no hay cuenta de X referenciada en el código.
  - `areaServed`: el sitio habla de "cross-border mandates" e "international
    investors" pero no lista países; hoy declara solo Estados Unidos.
  - `founder`/`employee`: `/sobre/equipo` existe pero no está enlazada desde
    el nav, así que no hay página de equipo pública que referenciar.
- Archivos: `index.html`, `public/llms.txt`

## T-007 · Imagen social (og-image) sin marca
- **Estado:** abierto (menor)
- **Detectado:** 2026-08-04
- `public/og-image.jpg` es un recorte 1200×630 del skyline del hero, generado
  por `scripts/gen-images.mjs`. Cumple, pero es una foto sin logo ni claim: es
  la miniatura que se ve al compartir el sitio en LinkedIn.
- Al sustituirla, mantener el nombre y el tamaño (`index.html` y `seo.js`
  apuntan a esa URL con `og:image:width/height` declarados).
- Nota aparte: `src/assets/images/hero/Miami_Skyline.png` (686 kB) no lo
  referencia nadie desde que el hero usa New-york. Vite no lo empaqueta, pero
  sigue ocupando espacio en el repo.
- Archivos: `public/og-image.jpg`, `scripts/gen-images.mjs`

## T-008 · Aviso de cookies / privacidad por la instalación de Clarity
- **Estado:** abierto (decisión de negocio, no hay nada que programar aún)
- **Detectado:** 2026-08-05
- Microsoft Clarity quedó instalado el 2026-08-05 (`shared/lib/clarity.js`).
  Pone cookies propias `_clck` y `_clsk` y graba la sesión del visitante.
- El sitio **no tiene banner de consentimiento** (grep de `cookie|consent` en
  `src/`: 0 hits fuera del enlace al PDF). El único documento es
  `public/docs/2026_Privacy_Notice-FinancialQGroup.pdf`, que no se ha revisado
  para saber si ya cubre analítica de terceros.
- Para una firma registrada en SEC con visitantes de la UE esto lo decide David
  con quien lleve el tema legal. Tres salidas posibles, en orden de esfuerzo:
  1. Nada, si el Privacy Notice ya lo cubre y se acepta el riesgo.
  2. Añadir el párrafo al Privacy Notice (documento, no código).
  3. Banner de consentimiento. Si se elige esta, el enganche ya está listo:
     `initClarity()` pasa a llamarse desde la aceptación del banner en vez de
     desde `main.jsx`, más `window.clarity('consent')`.
- Archivos: `src/shared/lib/clarity.js`, `src/main.jsx`,
  `public/docs/2026_Privacy_Notice-FinancialQGroup.pdf`

## T-009 · `Button` no es un `<button>`: acciones críticas sin teclado
- **Estado:** abierto (parte crítica resuelta el 2026-08-16; queda el default)
- **Detectado:** 2026-08-16 (al verificar el botón "Publicar" del editor)
- **[2026-08-16] Resuelto para las acciones que motivaron el ticket.**
  `Button` acepta `as="button"` y renderiza `<button type="button">` con los
  atributos sueltos que reciba (`aria-label`, `disabled`). Se usa en
  Publicar/Despublicar del editor (`PostEditorPage.jsx`) y en las tres
  acciones de la tarjeta del panel (`PerspectivesPage.jsx`), todas enfocables
  con Tab y accionables con Enter — verificado headless. `Button.css` neutraliza
  los estilos de UA en un selector `button.btn-*`, que no alcanza al `<div>`.
- **Lo que queda:** cambiar el **default** a `<button>`. Sigue abierto porque
  el componente se usa en ~25 sitios que entran en el prerender
  (`npm run build` genera HTML estático de 21 rutas), así que exige una
  verificación visual de todo el sitio, no solo de Perspectives. Y hay un
  anidamiento que habría que deshacer antes: `PerspectivesPage.jsx` mete un
  `<Button>` dentro del `<a href="/docs/…" download>` del outlook destacado, y
  un `<button>` dentro de un `<a>` es HTML inválido.
- `shared/ui/button/Button.jsx` renderiza un `<div onClick>`, no un elemento
  interactivo real: no es enfocable con Tab, no responde a Enter/Espacio y no
  expone `role="button"` a lectores de pantalla. Se detectó porque el test
  headless no encontraba el botón por rol.
- Ahora pesa más que antes: **Publicar / Despublicar** son acciones destructivas
  o irreversibles (la primera publicación dispara el correo del newsletter) y
  hoy solo se pueden accionar con ratón. Los botones de editar/eliminar de las
  filas del panel sí son `<button>` nativos.
- Arreglo: cambiar el `<div>` por `<button type="button">` en el componente.
  **Ojo al alcance:** se usa en toda la web, así que hay que revisar el CSS de
  `Button.css` (reset de `appearance`, `font`, `border`) y los sitios donde se
  anida dentro de `<a>` o de otro control, que serían HTML inválido.
- Archivos: `src/shared/ui/button/Button.jsx`, `src/shared/ui/button/Button.css`

## T-010 · El editor no sabe si el newsletter ya salió
- **Estado:** abierto (menor; afecta a la precisión del aviso, no al flujo)
- **Detectado:** 2026-08-16
- El diálogo de confirmación de "Publicar" avisa de que el correo **puede**
  salir ("si es la primera vez que se publica"), porque el frontend no puede
  saberlo: `GET /landings/posts/admin/:idOrSlug` devuelve la forma pública
  (`toApiShape`) y **no incluye `notified_at`**. El listado admin sí lo expone
  como `notifiedAt`, pero el editor carga por el detalle.
- Opciones: (a) exponer `notifiedAt` también en el detalle admin del backend
  (una línea en `posts.service.ts`, sin migración), o (b) que el editor lea el
  dato del listado al navegar. (a) es más limpia.
- Con (a) el diálogo podría decir con certeza "se enviará el correo" o "el
  correo ya salió el <fecha>, no se reenviará".
- Archivos: `src/pages/admin/PostEditorPage.jsx` (consumidor);
  backend `financial-backend/src/landings/posts/posts.service.ts`

