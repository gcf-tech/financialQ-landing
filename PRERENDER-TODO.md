# Prerender — qué cubre y qué no

El sitio es una SPA: sin prerender, todo crawler que no ejecute JS recibe un
`<div id="root"></div>` vacío. Desde 2026-08-04 el build genera un HTML
estático por ruta con el contenido ya pintado.

**Está aplicado y funcionando.** Este documento existe para dejar por escrito
los límites conocidos, no porque haya un bloqueo.

## Cómo funciona

```
npm run build
  ├── vite build                                   → dist/ (bundle de cliente)
  ├── vite build --ssr src/entry-server.jsx        → dist-ssr/ (intermedio, no se sube)
  └── node scripts/prerender.mjs                   → dist/<ruta>/index.html × 21
```

- `src/entry-server.jsx` renderiza la app con `StaticRouter` a string.
- `scripts/prerender.mjs` lo inyecta en la plantilla y reescribe el `<head>`
  (título, description, canonical, hreflang, Open Graph) con los datos de
  `src/shared/config/seo.js`.
- `public/.htaccess` (regla **1a-bis**) sirve esos archivos sin redirección.

Se descartó `vite-prerender-plugin`, `react-snap` y `vite-react-ssg`: el
primero y el segundo no tienen soporte declarado para Vite 8 + React 19, y el
tercero exige migrar el routing a un array de rutas — refactor que el encargo
excluía explícitamente. El script propio son ~110 líneas sin dependencias
nuevas.

## Verificar

```bash
npm run build && node scripts/check-seo.mjs
```

Comprueba las 21 rutas: `<head>` correcto, `#root` con contenido real,
un `<h1>`, enlaces internos rastreables, y que sitemap.xml no se desincronice
de `seo.js`.

## Límites conocidos

### 1. Artículos de Perspectives sin prerender

`/perspectivas/:id` y `/perspectives/:id` **no** se pre-renderizan, y
`/perspectivas` se pre-renderiza como cascarón sin la lista.

Motivo: los posts llegan de `GET /landings/posts` (backend `financial-backend`)
en un `useEffect`, que no corre durante el render en Node.

Consecuencia real: un artículo compartido en LinkedIn o X no muestra su propio
título ni portada en la tarjeta — muestra los de la home. Para una firma que
publica en LinkedIn, esto pesa.

Para resolverlo haría falta que `scripts/prerender.mjs` haga `fetch` al backend
en build y genere una ruta por post. Es viable (el endpoint es público), pero
ata el build a que el backend esté arriba y obliga a rebuild+subida en cada
post nuevo. Decisión pendiente de la usuaria.

### 2. Sin hidratación

`src/main.jsx` sigue usando `createRoot`, no `hydrateRoot`: el navegador
descarta el HTML estático y renderiza de cero. El contenido es idéntico, así
que el cambio es invisible, pero se deja sobre la mesa la mejora de tiempo de
render.

Se eligió así a propósito. `hydrateRoot` obliga a que el primer render del
cliente coincida byte a byte con el HTML de Node, y hay un caso donde no
coincide: `useAdminSession` lee `localStorage` de forma síncrona, así que un
admin con sesión activa ve un header distinto del pre-renderizado. Eso genera
un error de hidratación. Como el repo no tiene tests, se prefirió el camino sin
riesgo: el objetivo del bloque era que los crawlers vieran contenido, y eso ya
se cumple.

Para activarlo habría que diferir la UI de admin a un flag de "montado".

### 3. Añadir una ruta nueva

`scripts/prerender.mjs` recorre `allRoutes()` de `src/shared/config/seo.js`.
Una ruta nueva en `App.jsx` que no tenga entrada en `PAGES` **no se
pre-renderiza y no entra al sitemap**. `check-seo.mjs` no lo detecta: solo
verifica lo que sí está declarado.

Al añadir una página, tocar los cuatro sitios: `App.jsx`, `routes.js`,
`seo.js` y `public/sitemap.xml`.

### 4. Revertir

Si alguna vez estorba, basta con dejar `"build": "vite build"` en
`package.json`. El resto del SEO técnico (robots, sitemap, llms.txt, JSON-LD,
meta por ruta en runtime, fuentes, imágenes) es independiente y sigue
funcionando. La regla 1a-bis del `.htaccess` queda inerte sin esos archivos.
