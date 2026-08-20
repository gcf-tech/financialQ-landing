# STATE — snapshot del sitio

> Convención: ver sección 7 de `.claude/CLAUDE.md`. Información temporal:
> actualizar cuando cambie, no historizar. Fechas absolutas.

## Último cambio relevante
- **2026-08-16** — **Una sola representación del post: el panel admin usa la
  misma tarjeta y la misma parrilla que el listado público.** Antes con sesión
  se veían filas de tabla y sin sesión tarjetas; eran dos vistas del mismo
  recurso porque el endpoint admin solo devolvía metadatos. Ahora que devuelve
  también portada, blurb, fecha, tiempo de lectura y etiquetas:
  1. La tarjeta se extrajo del `.map()` inline de `PerspectivesPage.jsx` a
     `pages/perspectives/ui/PostCard.jsx`. **No se duplicó**: la usan las dos
     ramas. Con sesión recibe `badges`, `adminActions` y `emptyCover`; sin
     ellas emite exactamente el mismo árbol que antes.
  2. Acciones en la tarjeta: Editar, **Publicar/Despublicar** (nuevo en el
     listado; antes solo en el editor) y Eliminar. Los tres son `<button>`
     reales, con `aria-label` que incluye el título. Publicar y Eliminar
     mantienen su `window.confirm`, y el de publicar reutiliza el texto del
     editor (`t.admin.editor.publishConfirm`) para no decir dos cosas
     distintas sobre el correo del newsletter.
  3. Badges sobre la portada: Borrador/Publicado, **"Solo ES" / "Solo EN"**
     cuando falta un título (sustituye a los dos badges ES+EN tachados), y la
     fecha de actualización. Fallbacks solo de presentación: título del idioma
     de la interfaz y si no el del otro; sin portada, el hueco `--ivory-pale`
     con borde punteado — un borrador incompleto se ve incompleto, no roto.
  4. `Button` acepta `as="button"` → `<button type="button">` (T-009 parcial).
     El default sigue siendo `<div>`: el componente entra en el prerender de
     todo el sitio y en un sitio va anidado dentro de un `<a>`.
  Verificado headless: **capturas del listado público sin sesión antes/después
  byte a byte idénticas** (PNG y HTML de la parrilla, es y en) con el backend
  interceptado, y 15 comprobaciones sobre la rama admin. Lint sin errores
  nuevos. **Pendiente: subir el build a Hostinger.**
- **2026-08-16** — **/admin ya ve, edita y publica borradores.** Hasta ahora el
  editor cargaba por el endpoint público (que filtra `is_published = 1`), así
  que un borrador daba "no encontrado" y era ineditable; y guardar decidía el
  estado de publicación por omisión. Ahora:
  1. `shared/api/posts.js` añade `listAdminPosts({status, page, limit})` y
     `getAdminPost(idOrSlug)` contra `GET /landings/posts/admin[/:idOrSlug]`.
  2. **Con sesión admin**, Perspectives sustituye la parrilla pública por un
     panel propio con filtro por estado y **borradores por defecto**. Sin
     sesión la página es exactamente la de antes, y el prerender también (en
     Node no hay sesión). *(La presentación de ese panel —filas de tabla con
     badges ES/EN tachados— quedó sustituida el mismo día por la tarjeta
     compartida; ver la entrada de arriba. El filtro y su default siguen
     igual.)*
  3. El editor carga por `getAdminPost` y **manda `isPublished` siempre
     explícito**: al guardar, el estado actual —guardar nunca publica—; al
     crear, `false`.
  4. **Publicar es un botón aparte**, con confirmación que avisa de que el
     correo del newsletter no se puede recuperar. Despublicar disponible para
     un post publicado. Etiqueta del botón de guardar cambiada de "Publicar
     post" a "Guardar borrador" (ya no publicaba).
  Verificado headless (Edge + playwright-core, receta de `.claude/skills/verify`
  con intercepción de red): 24 comprobaciones, incluidas que sin sesión no se
  llama al endpoint admin, que el filtro por defecto pide `status=draft`, que
  guardar manda `isPublished: false` y que publicar manda solo `{isPublished:
  true}` tras confirmar. Lint limpio en los 3 archivos y build+prerender OK (21
  rutas). **Pendiente: subir el build a Hostinger** (sigue siendo manual) y que
  el backend tenga desplegados los endpoints admin.
- **2026-08-14** — El LLM pasó de OpenAI a **Gemini (API nativa)**, tanto en el
  backend (`financial-backend`, `POST /landings/posts/translate`) como en el
  adapter de los scripts (`scripts/lib/llmClient.mjs`). Antes de esto el cambio
  estaba a medias: solo se habían renombrado las variables de entorno, pero el
  request seguía yendo a `api.openai.com` con `Authorization: Bearer` y una key
  de Google — y el código leía `GEMINI_MODE` mientras el `.env` definía
  `GEMINI_MODEL`, así que la traducción devolvía 503 siempre. Ahora:
  `generateContent` + header `x-goog-api-key`, salida forzada a JSON
  (`responseMimeType`), timeout por petición (`LLM_TIMEOUT_MS`, default 180 s) y
  fallback opcional a otro proveedor (`LLM_FALLBACK_PROVIDER`, vacío = apagado)
  que solo se dispara por indisponibilidad, no por JSON inválido. OpenAI queda
  como implementación alterna seleccionable con `LLM_PROVIDER`.
  Env del backend: `GEMINI_API_KEY`, `GEMINI_MODEL` (hoy `gemini-3.5-flash-lite`).
  Verificado en runtime: traducción real EN→ES OK, fallback OK (primario caído →
  reintento exitoso), 503 por config incompleta, y typo en `LLM_PROVIDER` cae al
  default con warning. **Pendiente: dar de alta `GEMINI_API_KEY`/`GEMINI_MODEL`
  en el panel de Dokploy y redesplegar el backend** — si allí solo están las
  `OPENAI_*`, el editor responde 503.
- **2026-08-05** — Microsoft Clarity (proyecto `xxra4aytiu`), primera analítica
  del sitio. No se pegó el snippet en el `<head>` de `index.html`: se carga
  diferido desde `shared/lib/clarity.js`, enganchado al evento `load` y llamado
  una vez desde `main.jsx`, para no competir con el render inicial (LCP/TBT).
  **No se graban las rutas admin** — `initClarity()` no inyecta nada si el
  pathname empieza por `/admin` o `/reset-password` (esta última lleva el token
  del correo en el query string). Límite conocido: la API cliente de Clarity no
  tiene comando `stop` (solo consent/identify/set/event/upgrade), así que si un
  visitante entra por una página pública y navega a `/admin` en la misma sesión
  SPA el tag ya está corriendo; por eso los `<section className="s-admin">` de
  las tres páginas admin llevan `data-clarity-mask="true"`, que impide subir su
  contenido. Verificado headless en Edge (14 checks: inyección posterior al
  `load` medida dentro de la página, ausencia del tag en las 3 rutas excluidas,
  máscara presente, y el tag propio descargando el payload real de Clarity).
  Pendiente: build + subida manual a Hostinger, y la decisión de aviso de
  cookies (ver T-008).
- **2026-08-04** — SEO técnico + rendimiento + prerender. Tres frentes:
  1. **Rastreabilidad.** El sitio era CSR puro: los crawlers recibían un
     `<div id="root">` vacío y la navegación eran `<div onClick>`, así que no
     había ni contenido ni enlaces que seguir. Ahora `npm run build` encadena
     un build SSR y `scripts/prerender.mjs`, que genera 21 HTML estáticos (uno
     por ruta pública ES/EN) con el contenido pintado; y el header y el footer
     usan `<a href>` reales (con `onClick`+`preventDefault`, misma navegación
     SPA, y ctrl/cmd+click abre pestaña nueva). Nuevos `public/robots.txt`,
     `sitemap.xml` (con hreflang recíproco) y `llms.txt`; JSON-LD
     Organization+FinancialService en `index.html`; meta por ruta desde
     `shared/config/seo.js` (única fuente: la lee el prerender y el hook
     `useDocumentMeta` en navegación SPA).
  2. **Idioma por URL.** `i18nContext` deriva el idioma del pathname
     (`/sobre`→es, `/about`→en) en vez de leer solo `localStorage`. Sin esto
     `/sobre` servía contenido en inglés con URL en español. La preferencia
     guardada sigue mandando donde la URL no dice idioma (la home).
  3. **Core Web Vitals.** Fuentes auto-hospedadas en `public/fonts/` (3 woff2
     variables; se eliminó el `@import` remoto de `tokens.css`, que encadenaba
     dos round-trips bloqueantes). Hero `New-york.png` 2.1 MB → `.webp` 84 kB.
     Logos 3176×684 → variantes 209×45 / 158×34 con `srcset` y `width`/`height`.
     `manualChunks` ya no mete todo `node_modules` en el vendor eager:
     react-markdown y su cadena salen a chunk async junto con las rutas admin
     y el detalle de post (`React.lazy`). JS inicial 169 kB → 129 kB gzip.
  - Verificado: `node scripts/check-seo.mjs` (21 rutas) + 22 checks headless
    en Edge, 0 errores de consola. Lint sin regresión (los mismos 4 errores
    preexistentes). **Pendiente: build + subida manual de `dist/` a Hostinger**,
    y dar de alta el sitemap en Search Console (ver T-004…T-007).
  - Límites del prerender documentados en `PRERENDER-TODO.md`.
- **2026-07-09** — Auto-gestión de contraseña del /admin (frontend): en el
  primer ingreso obliga a cambiar la contraseña temporal
  (`must_change_password` que ahora devuelve `/auth/login`); enlace "¿olvidaste
  tu contraseña?" que dispara el correo de reset; y nueva página
  `/reset-password?token=...` (ruta única). Nuevos métodos en
  `shared/api/auth.js` (`changePassword`/`forgotPassword`/`resetPassword`),
  `useAdminSession` expone `mustChangePassword`, y el editor redirige a `/admin`
  hasta que se cambie. Backend: repo `financial-backend` (migración 005 + SMTP
  Hostinger). Verificado headless (8 checks: login/forgot/reset/cambio forzado/
  sesión normal). **Pendiente: correr la 005 en el contenedor, poner
  `SMTP_USER`/`SMTP_PASS` en Dokploy, y build + subida manual a Hostinger
  (ver T-003).**
- **2026-07-09** — Toolbar de formato en el editor de posts (`/admin/post`):
  botones B/I/H2/H3/listas/cita/enlace + atajos Ctrl+B/I que insertan la
  sintaxis markdown sobre la selección, con toggle y undo nativo. Además,
  pegar contenido con formato (Word, Google Docs, web) lo convierte a
  markdown (`pages/admin/ui/htmlToMarkdown.js`); Ctrl+Shift+V pega plano.
  Sin librerías nuevas (`pages/admin/ui/MarkdownEditor.jsx`); el contenido
  sigue guardándose como markdown, así que traducción IA, detalle del post y
  backend no cambian. Verificado headless (26 checks de toolbar + 12 de
  pegado, ambas pestañas). Pendiente de build + subida manual a Hostinger.
- **2026-07-09** — El aviso de "nuevo post" ya no usa Inbound Webhook (de
  pago): `financial-backend` hace el fan-out directo vía API v2 de GHL —
  escribe custom values `post_*` y añade `notify-post-es/en` a los contactos
  del tag del newsletter; workflows gratuitos de GHL (Contact Tag Added)
  envían el correo. Verificado en vivo sin enviar correos. Pendiente:
  variables en Dokploy y workflows publicados en GHL (ver T-002).
- **2026-07-08** — Auditoría del aviso de "nuevo post" al newsletter (GHL):
  la lógica ya está en financial-backend (`notifySubscribers` al publicar,
  reintento vía `notified_at`), mismo contrato que marca-blanca-back-v2 y que
  `scripts/notify-subscribers.mjs`. Credenciales GHL verificadas contra la
  API real: exigen `GHL_API_URL` v2 (leadconnectorhq) y token PIT **sin**
  prefijo "Bearer". Falta en Dokploy: `GHL_NEWSLETTER_WEBHOOK_URL` (copiar
  del panel de GHL). Checklist completo en
  `financial-backend/docs/MANUAL-DESPLIEGUE.md` §7.
- **2026-07-08** — Traducción bidireccional en el editor de posts: el
  endpoint `POST /landings/posts/translate` (financial-backend) ahora acepta
  `{titleEn, contentEn}` (→ español, shape original intacto) o
  `{titleEs, contentEs}` (→ inglés), y el editor tiene botón "Traducir con
  IA" en ambas pestañas. Verificado E2E con backend local + OpenAI real.
  **Orden de despliegue: backend (Dokploy) primero, luego la landing**, y
  confirmar que las variables del LLM estén en el panel de Dokploy (hoy:
  `GEMINI_API_KEY`/`GEMINI_MODEL`, ver entrada del 2026-08-14).
- **2026-07-08** — Acceso admin en el header: ícono de usuario discreto a la
  derecha (desktop: junto al CTA; móvil: junto al burger) que navega a
  `/admin`. Con sesión admin activa muestra nombre + dropdown con
  "Cerrar sesión" (reactivo vía `useAdminSession`). Verificado headless en
  desktop y móvil, ambos idiomas. Pendiente de build + subida manual a
  Hostinger.

## Integraciones activas
- `shared/api/contact.js` → `POST /landings/contacts/create`
- `shared/api/auth.js` → `/auth/login`, `/auth/otp/verify`, `/auth/refresh`,
  `/auth/logout`, `/auth/change-password`, `/auth/forgot-password`,
  `/auth/reset-password` (backend: repo `financial-backend`, ya clonado en
  `C:\Marcela\GCF\financial\financial-backend` — la nota del CLAUDE.md de
  que "no está clonado en esta máquina" quedó desactualizada)
- `shared/api/posts.js` / `newsletter.js` → posts y newsletter del mismo backend
- Microsoft Clarity (`shared/lib/clarity.js`, proyecto `xxra4aytiu`) — analítica
  de terceros, carga diferida, sin rutas admin

## Flujo admin (Perspectives)
- Login en `/admin` (email + password, con paso OTP opcional según backend)
- Primer ingreso: si `must_change_password`, `/admin` obliga a fijar una nueva
  contraseña antes de entrar; el editor (`/admin/post`) redirige a `/admin`
  hasta que se cambie.
- "¿Olvidaste tu contraseña?" en `/admin` → correo con enlace a
  `/reset-password?token=...`.
- Con sesión admin: `PerspectivesPage` muestra agregar/editar/eliminar posts;
  editor en `/admin/post/:slug?`

## No verificado desde aquí
- Qué versión está desplegada en Hostinger (despliegue manual de la usuaria)
