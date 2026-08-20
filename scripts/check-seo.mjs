/**
 * Auditoría del build: comprueba que el SEO técnico quedó realmente aplicado
 * en dist/, no solo en el código fuente.
 *
 *   npm run build && node scripts/check-seo.mjs
 *
 * Cubre las rutas estáticas (seo.js) y las de artículo, que no se pueden
 * conocer leyendo el código: las declara dist-ssr/prerender-manifest.json, que
 * escribe scripts/prerender.mjs con lo que de verdad generó. No se vuelve a
 * llamar al backend a propósito — se audita el build, no el servidor.
 *
 * Sale con código 1 si algo falla, para poder encadenarlo en un hook o CI.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { allRoutes, resolveSeo, postPath, SITE_URL } from '../src/shared/config/seo.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = resolve(ROOT, 'dist')
const MANIFEST = resolve(ROOT, 'dist-ssr/prerender-manifest.json')

const problems = []
const notes = []

function fail(msg) { problems.push(msg) }
function ok(msg) { notes.push(msg) }

function read(relative) {
  const file = resolve(DIST, relative)
  return existsSync(file) ? readFileSync(file, 'utf8') : null
}

function routeFile(route) {
  return route === '/' ? 'index.html' : `${route.replace(/^\//, '')}/index.html`
}

/**
 * Escapa un texto como lo hace React al pintarlo en un nodo de texto. Sin esto
 * un título con `&` o comillas nunca se encontraría en el HTML generado.
 */
function asRendered(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// ------------------------------------------------- 0. Manifiesto del prerender
const manifest = existsSync(MANIFEST)
  ? JSON.parse(readFileSync(MANIFEST, 'utf8'))
  : null

if (!manifest) {
  fail(
    `falta ${MANIFEST.replace(ROOT + '\\', '').replace(ROOT + '/', '')} — ` +
    `lo escribe scripts/prerender.mjs. Corre 'npm run build' antes de auditar.`
  )
}

const postsManifest = manifest?.posts ?? []
/** [{ route, lang, post }] — las dos URLs de cada artículo publicado. */
const postRoutes = postsManifest.flatMap(post =>
  ['en', 'es'].map(lang => ({ route: postPath(post.slug, lang), lang, post })),
)

// ---------------------------------------------------------------- 1. Archivos
for (const f of ['robots.txt', 'sitemap.xml', 'llms.txt', 'og-image.jpg', 'logo-financialq.png']) {
  if (read(f) === null && !existsSync(resolve(DIST, f))) fail(`falta dist/${f}`)
}

const robots = read('robots.txt')
if (robots && !robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) {
  fail('robots.txt no declara la URL absoluta del sitemap')
}

// ------------------------------------------- 2. sitemap.xml vs rutas del build
const sitemap = read('sitemap.xml')
if (sitemap) {
  const inSitemap = new Set(
    [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map(m => m[1].replace(SITE_URL, '') || '/')
  )
  // Estáticas del código + artículos realmente generados. Las dos direcciones
  // se comprueban: una URL de artículo que sobre en el sitemap sería una
  // promesa de contenido que no existe, y una que falte no se rastrea.
  const inCode = new Set([...allRoutes(), ...postRoutes.map(p => p.route)])

  for (const route of inCode) {
    if (!inSitemap.has(route)) fail(`sitemap.xml no incluye ${route}`)
  }
  for (const loc of inSitemap) {
    if (!inCode.has(loc)) fail(`sitemap.xml incluye ${loc}, que no se generó`)
  }
  ok(`sitemap.xml y build coinciden (${allRoutes().length} estáticas + ${postRoutes.length} de artículo)`)
}

// ------------------------------------------------------ 3. <head> por ruta
/**
 * Mismo contrato para las 21 estáticas y para las de artículo: el <head> lo
 * dicta seo.js, y el #root tiene que traer contenido de verdad. La única
 * diferencia es que a las de artículo hay que pasarle el post para que
 * resolveSeo devuelva el título real en vez del respaldo de Perspectives.
 */
function auditRoute(route, article) {
  const html = read(routeFile(route))
  if (html === null) {
    fail(`no se pre-renderizó ${route} (falta dist/${routeFile(route)})`)
    return null
  }

  const seo = resolveSeo(route, article)

  if (seo.description.length > 155) {
    fail(`${route}: description de ${seo.description.length} caracteres (máx. 155)`)
  }
  if (!html.includes(`<html lang="${seo.lang}">`)) {
    fail(`${route}: <html lang> no es "${seo.lang}"`)
  }
  if (!html.includes(`<title>${seo.title}</title>`)) {
    fail(`${route}: <title> no coincide con seo.js`)
  }
  if (!html.includes(`<link rel="canonical" href="${seo.canonical}" />`)) {
    fail(`${route}: canonical incorrecta (esperada ${seo.canonical})`)
  }
  for (const alt of seo.alternates) {
    if (!html.includes(`hreflang="${alt.hreflang}" href="${alt.href}"`)) {
      fail(`${route}: falta hreflang ${alt.hreflang} → ${alt.href}`)
    }
  }

  // Lo que de verdad importa: contenido visible sin ejecutar JS.
  // Se mide todo lo que hay entre la apertura de #root y el <script> del
  // bundle; el cierre exacto de #root no se puede localizar por regex porque
  // el markup anida cientos de </div>.
  const afterRoot = html.split('<div id="root">')[1] ?? ''
  const body = afterRoot.split('<script type="module"')[0]
  if (body.length < 2000) {
    fail(`${route}: #root tiene ${body.length} bytes — el prerender no pintó la página`)
  }

  // El contenido tiene que estar DENTRO del <main>, no escondido en un
  // `<div hidden>` al final esperando a que un script lo mueva. React sirve así
  // los límites de Suspense y scripts/prerender.mjs lo deshace en build
  // (inlineDeferredContent); si eso dejara de funcionar, el #root seguiría
  // pesando lo mismo y solo esta comprobación lo notaría — para un rastreador
  // sin JS la página estaría vacía.
  for (const leftover of ['<!--$?-->', '<div hidden id="S:']) {
    if (html.includes(leftover)) {
      fail(`${route}: el contenido quedó diferido en el HTML ("${leftover}")`)
    }
  }
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)
  if (!main) {
    fail(`${route}: no hay <main> en el HTML estático`)
  } else if (main[1].length < 1000) {
    fail(`${route}: el <main> tiene ${main[1].length} bytes — el contenido no está en su sitio`)
  }
  if (!/<h1[\s>]/.test(html)) {
    fail(`${route}: no hay <h1> en el HTML estático`)
  }
  if (!/href="\/[a-z]/.test(html)) {
    fail(`${route}: no hay enlaces internos rastreables`)
  }

  return html
}

for (const route of allRoutes()) auditRoute(route, null)
ok(`${allRoutes().length} rutas estáticas con <head> correcto y contenido estático`)

// -------------------------------- 4. Artículos: HTML propio y nada a medias
/**
 * Textos de "cargando" de los dos diccionarios. El detalle de post reutiliza
 * el del listado (`perspectivas.list.loading`, ver PostDetailPage.jsx), así que
 * con esa clave se cubren las dos páginas. Si alguno aparece en el HTML
 * generado es que el prerender guardó el estado de carga en vez del contenido
 * — exactamente el defecto que tenía /perspectives hasta ahora.
 */
const LOADING_STRINGS = ['en', 'es'].map(lang => {
  const dict = JSON.parse(
    readFileSync(resolve(ROOT, `src/shared/config/locales/${lang}/common.json`), 'utf8'),
  )
  return dict.perspectivas?.list?.loading
}).filter(Boolean)

/**
 * Los contenedores que SOLO existen mientras la página no tiene datos:
 * `persp-list-status` es el <p> de cargando/error/vacío del listado y
 * `post-detail-notfound` el del detalle. Que aparezcan en un HTML generado
 * significa que se congeló un estado transitorio.
 *
 * Se comprueba la clase y no la palabra "Loading" suelta a propósito: el texto
 * del artículo es prosa libre y ya hubo un falso positivo real
 * ("un único activo está cargando con mucho peso", en entrepreneurs-overexposed).
 * La clase no depende del copy ni del idioma.
 */
const STATE_MARKERS = ['persp-list-status', 'post-detail-notfound']

function assertNoLoading(route, html) {
  for (const needle of LOADING_STRINGS) {
    if (html.includes(needle)) {
      fail(`${route}: el HTML generado contiene el estado de carga ("${needle}")`)
    }
  }
  for (const marker of STATE_MARKERS) {
    if (html.includes(marker)) {
      fail(`${route}: el HTML generado congeló un estado sin datos (.${marker})`)
    }
  }
}

for (const { route, lang, post } of postRoutes) {
  const html = auditRoute(route, post)
  if (!html) continue

  assertNoLoading(route, html)

  // El cuerpo del artículo, no solo la cáscara: el <h1> ya lo comprueba
  // auditRoute, pero un título sin cuerpo sería igual de inútil para indexar.
  if (!html.includes('s-post-detail')) {
    fail(`${route}: falta el <article class="s-post-detail"> — no se pintó el detalle`)
  }
  const title = post.i18n?.[lang]?.title
  if (title && !html.includes(asRendered(title))) {
    fail(`${route}: el HTML no contiene el título del artículo ("${title}")`)
  }
}
if (postRoutes.length) {
  ok(`${postRoutes.length} rutas de artículo con contenido, título y canónica propios`)
}

// ----------------------------- 5. Listado de Perspectives: pintado, no "cargando"
for (const lang of ['en', 'es']) {
  const route = lang === 'en' ? '/perspectives' : '/perspectivas'
  const html = read(routeFile(route))
  if (!html) continue

  assertNoLoading(route, html)

  // Todos los títulos publicados, no una muestra: el listado no pagina, así
  // que si falta uno es que el prerender no lo pintó.
  const missing = postsManifest
    .map(p => p.i18n?.[lang]?.title)
    .filter(t => t && !html.includes(asRendered(t)))

  if (missing.length) {
    fail(
      `${route}: faltan ${missing.length}/${postsManifest.length} títulos de artículo ` +
      `en el HTML generado (p. ej. "${missing[0]}")`
    )
  }
}
if (postsManifest.length) {
  ok(`/perspectives y /perspectivas listan los ${postsManifest.length} artículos sin ejecutar JS`)
}

// ----------------------------------------------- 6. Home: hero y servicios
const home = read('index.html')
if (home) {
  const expected = {
    'texto del hero': 'Structured',
    'subtítulo del hero': 'Built for Permanence',
    'sección de clientes': 'with Complexity',
    'sección de framework': 'Capital Architecture',
    'JSON-LD': '"@type": ["Organization", "FinancialService"]',
  }
  for (const [label, needle] of Object.entries(expected)) {
    if (!home.includes(needle)) fail(`la home pre-renderizada no contiene ${label} ("${needle}")`)
  }
  ok('home: hero, servicios y JSON-LD presentes sin ejecutar JS')
}

// -------------------------------------------- 7. Sin fuentes remotas ni render-blocking
if (home && /fonts\.(googleapis|gstatic)\.com/.test(home)) {
  fail('index.html sigue cargando Google Fonts desde red externa')
}
const assetsDir = resolve(DIST, 'assets')
if (existsSync(assetsDir)) {
  for (const css of readdirSync(assetsDir).filter(f => f.endsWith('.css'))) {
    if (/@import\s+url\(["']?https/.test(readFileSync(resolve(assetsDir, css), 'utf8'))) {
      fail(`assets/${css} conserva un @import remoto (bloquea el render)`)
    }
  }
}
ok('sin dependencias de fuentes remotas')

// ---------------------------------------------------------------- Resultado
for (const n of notes) console.log(`  ✓ ${n}`)
if (problems.length) {
  console.error(`\n✗ ${problems.length} problema(s):`)
  for (const p of problems) console.error(`  · ${p}`)
  process.exit(1)
}
console.log('\n✓ SEO técnico verificado sobre dist/')
