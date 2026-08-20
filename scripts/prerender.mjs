/**
 * Genera un HTML estático por ruta con el contenido ya pintado.
 *
 * Por qué: el sitio es una SPA. Sin esto, todo crawler que no ejecute JS
 * (la mayoría de los de IA, y Googlebot en su primera pasada) recibe un
 * `<div id="root"></div>` vacío: cero texto que indexar.
 *
 * Cómo: se reutiliza el bundle SSR (dist-ssr/entry-server.js) para renderizar
 * cada ruta a string y se inyecta en el index.html que produjo el build de
 * cliente, junto con el <head> que corresponde a esa ruta.
 *
 * Dos clases de ruta:
 *   · Estáticas — salen de allRoutes() (src/shared/config/seo.js).
 *   · Artículos — NO se pueden conocer sin preguntar: se descubren en build
 *     contra GET /landings/posts, y de cada post publicado salen su URL en
 *     español y en inglés. Los datos viajan al render por
 *     `globalThis.__PRERENDER__` (ver src/shared/lib/prerenderData.js), porque
 *     las páginas los piden en un `useEffect` y en Node los efectos no corren.
 *
 * Encadenado en `npm run build`:
 *   vite build && vite build --ssr … && node scripts/prerender.mjs
 *
 * Salida:  dist/index.html, dist/sobre/index.html,
 *          dist/perspectives/<slug>/index.html …
 *          + las URLs de artículo añadidas a dist/sitemap.xml
 *          + dist-ssr/prerender-manifest.json (lo audita check-seo.mjs)
 * Servido: ver la regla "1a-bis" de public/.htaccess
 *
 * El HTML estático es para los crawlers; el navegador lo reemplaza al montar
 * React (main.jsx usa createRoot, no hydrateRoot — ver PRERENDER-TODO.md).
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { allRoutes, resolveSeo, postPath, SITE_URL, OG_IMAGE } from '../src/shared/config/seo.js'
import { BACKEND_URL } from '../src/shared/api/config.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = resolve(ROOT, 'dist')
const SSR_ENTRY = resolve(ROOT, 'dist-ssr/entry-server.js')

/** Timeout por intento del descubrimiento. Dos intentos como mucho. */
const DISCOVERY_TIMEOUT_MS = 15_000

const { render } = await import(pathToFileURL(SSR_ENTRY).href)
const template = readFileSync(resolve(DIST, 'index.html'), 'utf8')

// La plantilla se lee de dist/index.html, que este mismo script sobreescribe
// al generar la home. Relanzarlo sin rehacer `vite build` la tomaría ya
// rellena y todas las rutas saldrían con el contenido de la home — en
// silencio, porque el <head> de cada una seguiría siendo el correcto y
// check-seo.mjs no vería nada raro. Mejor parar aquí.
if (!template.includes('<div id="root"></div>')) {
  throw new Error(
    'dist/index.html ya viene pre-renderizado: su #root no está vacío.\n' +
    '  Este script necesita la plantilla limpia que produce `vite build`.\n' +
    '  Lanza `npm run build`, que encadena los tres pasos en orden.'
  )
}

/** Escapa lo que va dentro de un atributo HTML. */
function attr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Reemplaza el content= de un <meta> ya presente en la plantilla. */
function setMeta(html, selectorAttr, key, content) {
  const re = new RegExp(
    `(<meta\\s+${selectorAttr}="${key}"\\s+content=")[^"]*(")`,
    'i'
  )
  if (!re.test(html)) {
    throw new Error(
      `index.html no tiene <meta ${selectorAttr}="${key}">. ` +
      `El prerender reescribe etiquetas existentes, no las inventa: ` +
      `añádela a index.html o quítala de este script.`
    )
  }
  return html.replace(re, `$1${attr(content)}$2`)
}

/** Quita un <meta> de la plantilla. Solo para los que dejan de ser ciertos. */
function dropMeta(html, selectorAttr, key) {
  return html.replace(
    new RegExp(`\\s*<meta\\s+${selectorAttr}="${key}"\\s+content="[^"]*"\\s*/>`, 'i'),
    ''
  )
}

/**
 * Aplica a la plantilla el <head> de una ruta concreta.
 * Todo sale de src/shared/config/seo.js — misma fuente que el hook de runtime.
 */
function applySeo(html, seo) {
  let out = html

  out = out.replace(/<html lang="[^"]*">/, `<html lang="${attr(seo.lang)}">`)
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${attr(seo.title)}</title>`)

  out = setMeta(out, 'name', 'description', seo.description)
  out = setMeta(out, 'name', 'robots', seo.noindex ? 'noindex, nofollow' : 'index, follow')

  out = setMeta(out, 'property', 'og:type', seo.ogType)
  out = setMeta(out, 'property', 'og:title', seo.title)
  out = setMeta(out, 'property', 'og:description', seo.description)
  out = setMeta(out, 'property', 'og:url', seo.canonical)
  out = setMeta(out, 'property', 'og:locale', seo.lang === 'es' ? 'es_ES' : 'en_US')
  out = setMeta(out, 'property', 'og:image', seo.ogImage)

  out = setMeta(out, 'name', 'twitter:title', seo.title)
  out = setMeta(out, 'name', 'twitter:description', seo.description)
  out = setMeta(out, 'name', 'twitter:image', seo.ogImage)

  // La plantilla declara 1200×630 porque describe /og-image.jpg. Cuando la
  // imagen social es la portada del artículo esas medidas dejan de ser ciertas
  // y se quitan en vez de mentir: sin ellas el scraper mide la imagen él mismo.
  if (seo.ogImage !== OG_IMAGE) {
    out = dropMeta(out, 'property', 'og:image:width')
    out = dropMeta(out, 'property', 'og:image:height')
    out = setMeta(out, 'property', 'og:image:alt', seo.title)
  }

  out = out.replace(
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${attr(seo.canonical)}" />`
  )

  // La plantilla trae un solo <link rel="alternate"> (x-default de la home);
  // aquí se sustituye por el juego completo de la ruta.
  const alternates = seo.alternates
    .map(a => `<link rel="alternate" hreflang="${attr(a.hreflang)}" href="${attr(a.href)}" />`)
    .join('\n    ')
  out = out.replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>/, alternates)

  return out
}

/**
 * Devuelve el contenido de un `<div hidden id="S:n">…</div>` y dónde empieza y
 * acaba, contando `<div>` anidados para encontrar su cierre real.
 */
function takeDeferredSegment(html) {
  const open = html.match(/<div hidden id="(S:\d+)">/)
  if (!open) return null

  const contentStart = open.index + open[0].length
  const divs = /<\/?div\b/g
  divs.lastIndex = contentStart

  let depth = 1
  let tag
  while ((tag = divs.exec(html)) !== null) {
    depth += tag[0][1] === '/' ? -1 : 1
    if (depth === 0) {
      return {
        id: open[1],
        content: html.slice(contentStart, tag.index),
        start: open.index,
        end: tag.index + '</div>'.length,
      }
    }
  }
  throw new Error(`el segmento ${open[1]} no cierra: no se puede montar el HTML`)
}

/**
 * Pone en su sitio el contenido de los límites de Suspense.
 *
 * React sirve el contenido de un `<Suspense>` fuera de posición: dentro del
 * `<main>` deja `<!--$?--><template id="B:0"></template>` y el contenido real
 * va al final, en un `<div hidden id="S:0">`, con un script que lo mueve al
 * montar. Para servir por HTTP está bien; para lo que hace este script es justo
 * lo contrario de lo que se busca: **el rastreador que no ejecuta JS —el motivo
 * entero del prerender— se encontraría el `<main>` con un comentario dentro y
 * la página escondida en un `hidden`.**
 *
 * Aquí se hace en build lo que ese script haría en el navegador: mover el
 * contenido a su hueco y tirar los andamios. Es seguro porque `main.jsx` usa
 * `createRoot`, no `hydrateRoot`: el navegador descarta este HTML y renderiza
 * de cero, así que no hay nada que reconstruir (ver PRERENDER-TODO.md §3).
 *
 * El `<Suspense>` que provoca esto es el de App.jsx, que envuelve `<Routes>`
 * para las rutas con `React.lazy`. Aparece en las 67 rutas, suspendan o no.
 */
function inlineDeferredContent(markup) {
  let out = markup

  for (let segment = takeDeferredSegment(out); segment; segment = takeDeferredSegment(out)) {
    const boundary = `B:${segment.id.slice(2)}`
    const placeholder = `<!--$?--><template id="${boundary}"></template><!--/$-->`
    if (!out.includes(placeholder)) {
      throw new Error(`el segmento ${segment.id} no tiene hueco (${boundary}) donde ir`)
    }
    // Primero se quita el div oculto (por índice) y luego se rellena el hueco,
    // para que el reemplazo no desplace las posiciones calculadas.
    out = out.slice(0, segment.start) + out.slice(segment.end)
    out = out.replace(placeholder, `<!--$-->${segment.content}<!--/$-->`)
  }

  // Los <script> sin atributos que quedan son el runtime de React para ese
  // trasvase, que ya no hace falta. El bundle de la app va en la plantilla,
  // fuera de #root, así que no se toca.
  out = out.replace(/<script>[\s\S]*?<\/script>/g, '')

  for (const leftover of ['<!--$?-->', '<div hidden id="S:', '$RC(']) {
    if (out.includes(leftover)) {
      throw new Error(
        `quedó "${leftover}" en el HTML: React cambió el formato de Suspense y ` +
        `este montaje se quedó corto. Revisar inlineDeferredContent().`
      )
    }
  }

  return out
}

/** '/' → dist/index.html · '/approach/risk' → dist/approach/risk/index.html */
function outputPath(route) {
  return route === '/'
    ? resolve(DIST, 'index.html')
    : resolve(DIST, route.replace(/^\//, ''), 'index.html')
}

// ---------------------------------------------------------------------------
// 1. Descubrimiento: qué artículos hay publicados
// ---------------------------------------------------------------------------

/**
 * Lee los posts publicados del mismo backend que usa la app en runtime
 * (BACKEND_URL sale de src/shared/api/config.js — no se repite aquí).
 *
 * Un fallo aquí ABORTA el build a propósito. Un build "exitoso" sin artículos
 * publicaría un /perspectives vacío y reescribiría el sitemap sin las URLs de
 * los artículos: le estaríamos diciendo a Google que el contenido ya indexado
 * desapareció. Es peor que no desplegar.
 */
async function fetchPublishedPosts() {
  const url = `${BACKEND_URL}/landings/posts`
  const attempts = 2
  let lastError

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(DISCOVERY_TIMEOUT_MS) })
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error('la respuesta no es un array de posts')
      return data
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        console.warn(`  ⚠ intento ${attempt}/${attempts} falló (${error.message}); reintentando…`)
      }
    }
  }

  throw new Error(
    `no se pudo leer ${url} tras ${attempts} intentos de ${DISCOVERY_TIMEOUT_MS} ms: ${lastError.message}\n` +
    `  El build se aborta a propósito: generar el sitio sin los artículos dejaría\n` +
    `  /perspectives vacío y borraría del sitemap URLs que ya están indexadas.\n` +
    `  Comprueba que el backend responde y vuelve a lanzar 'npm run build'.`
  )
}

console.log(`\n· Descubriendo artículos publicados en ${BACKEND_URL} …`)
const discovered = await fetchPublishedPosts()

// El endpoint público ya filtra is_published = 1 en SQL (financial-backend,
// posts.service.ts:60). Se vuelve a filtrar aquí a propósito: un borrador
// pre-renderizado es una URL pública e indexable con contenido sin revisar —
// los del pipeline de n8n entre ellos—, y esa garantía no debe depender de que
// nadie toque ese WHERE. Defensa en profundidad, no desconfianza.
const posts = discovered.filter(
  p => p && p.isPublished === true && typeof p.slug === 'string' && p.slug.trim(),
)
const skipped = discovered.length - posts.length
if (skipped > 0) {
  console.warn(`  ⚠ ${skipped} post(s) descartado(s) por no venir publicados o no traer slug`)
}
if (posts.length === 0) {
  throw new Error(
    'el backend respondió correctamente pero no devolvió ningún post publicado.\n' +
    '  Se aborta por lo mismo que si no respondiera: el sitio saldría con el\n' +
    '  listado vacío y el sitemap sin artículos. Si de verdad no hay ninguno\n' +
    '  publicado, es una decisión que toca tomar a mano, no un efecto colateral.'
  )
}
console.log(`  ${posts.length} artículo(s) publicado(s) → ${posts.length * 2} rutas ES/EN`)

// ---------------------------------------------------------------------------
// 2. Generación
// ---------------------------------------------------------------------------

// `post` es null en las estáticas; el listado recibe siempre la lista completa.
const jobs = [
  ...allRoutes().map(route => ({ route, post: null })),
  ...posts.flatMap(post => [
    { route: postPath(post.slug, 'en'), post },
    { route: postPath(post.slug, 'es'), post },
  ]),
]

let bytes = 0

for (const { route, post } of jobs) {
  // Contrato con src/shared/lib/prerenderData.js. Se fija por ruta, no una vez:
  // cada HTML de artículo tiene que ver SU post y ninguno más.
  globalThis.__PRERENDER__ = { posts, post }

  const markup = inlineDeferredContent(await render(route))
  const seo = resolveSeo(route, post)

  const html = applySeo(template, seo).replace(
    '<div id="root"></div>',
    `<div id="root">${markup}</div>`
  )

  const file = outputPath(route)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
  bytes += html.length

  console.log(`  ${route.padEnd(58)} ${(markup.length / 1024).toFixed(0)} kB de HTML`)
}

delete globalThis.__PRERENDER__

// ---------------------------------------------------------------------------
// 3. Sitemap: las URLs de artículo se añaden a la copia de dist/
// ---------------------------------------------------------------------------

/**
 * public/sitemap.xml sigue siendo la parte fija, escrita a mano. Los artículos
 * se añaden solo a la copia que Vite dejó en dist/, que es la que se sube: así
 * el archivo del repo no acumula contenido generado ni se queda desfasado.
 */
function postSitemapEntries() {
  return posts
    .map(post => {
      const en = attr(SITE_URL + postPath(post.slug, 'en'))
      const es = attr(SITE_URL + postPath(post.slug, 'es'))
      // published_at es DATE ('YYYY-MM-DD'); si viniera con otra forma se omite
      // en vez de inventar una fecha.
      const iso = String(post.publishedAt ?? '')
      const lastmod = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `\n    <lastmod>${iso}</lastmod>` : ''

      return [en, es]
        .map(loc => `  <url>
    <loc>${loc}</loc>${lastmod}
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${en}" />
    <xhtml:link rel="alternate" hreflang="es" href="${es}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${en}" />
  </url>`)
        .join('\n')
    })
    .join('\n')
}

/** Abre el bloque generado. Sirve de marca para poder reescribirlo. */
const SITEMAP_MARK = '  <!-- Artículos de Perspectives.'

const sitemapFile = resolve(DIST, 'sitemap.xml')
const sitemap = readFileSync(sitemapFile, 'utf8')
if (!sitemap.includes('</urlset>')) {
  throw new Error('dist/sitemap.xml no tiene </urlset>: no se pueden añadir los artículos')
}

// Dentro de `npm run build` esto siempre parte del sitemap limpio que Vite
// acaba de copiar de public/. Pero el script se puede relanzar a mano sobre un
// dist/ ya generado, y entonces sin esto las 46 URLs se añadirían otra vez.
const cut = sitemap.indexOf(SITEMAP_MARK)
const base = cut === -1 ? sitemap : sitemap.slice(0, cut) + '</urlset>\n'

writeFileSync(
  sitemapFile,
  base.replace(
    '</urlset>',
    SITEMAP_MARK + ' Generados por scripts/prerender.mjs a\n' +
    '       partir de GET /landings/posts (solo is_published = 1). No editar a\n' +
    '       mano: se reescriben en cada build. -->\n' +
    `${postSitemapEntries()}\n\n</urlset>`
  )
)

// ---------------------------------------------------------------------------
// 4. Manifiesto para la auditoría
// ---------------------------------------------------------------------------

// Vive en dist-ssr/ (intermedio, no se sube a Hostinger) para que
// scripts/check-seo.mjs pueda comprobar las rutas de artículo sin volver a
// llamar al backend — y para que un desfase entre lo generado y lo auditado
// salte en vez de pasar desapercibido. Sin `content`: pesa y no se audita.
writeFileSync(
  resolve(ROOT, 'dist-ssr/prerender-manifest.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      backendUrl: BACKEND_URL,
      staticRoutes: allRoutes(),
      posts: posts.map(p => ({
        slug: p.slug,
        publishedAt: p.publishedAt ?? null,
        image: p.image ?? null,
        i18n: {
          es: { title: p.i18n?.es?.title ?? '', body: p.i18n?.es?.body ?? '' },
          en: { title: p.i18n?.en?.title ?? '', body: p.i18n?.en?.body ?? '' },
        },
      })),
    },
    null,
    2,
  ),
)

console.log(
  `\n✓ ${jobs.length} rutas pre-renderizadas ` +
  `(${allRoutes().length} estáticas + ${posts.length * 2} de artículo, ` +
  `${(bytes / 1024).toFixed(0)} kB en total)\n` +
  `✓ sitemap.xml ampliado con ${posts.length * 2} URLs de artículo`
)
