/**
 * Auditoría del build: comprueba que el SEO técnico quedó realmente aplicado
 * en dist/, no solo en el código fuente.
 *
 *   npm run build && node scripts/check-seo.mjs
 *
 * Sale con código 1 si algo falla, para poder encadenarlo en un hook o CI.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { allRoutes, resolveSeo, SITE_URL } from '../src/shared/config/seo.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = resolve(ROOT, 'dist')

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

// ---------------------------------------------------------------- 1. Archivos
for (const f of ['robots.txt', 'sitemap.xml', 'llms.txt', 'og-image.jpg', 'logo-financialq.png']) {
  if (read(f) === null && !existsSync(resolve(DIST, f))) fail(`falta dist/${f}`)
}

const robots = read('robots.txt')
if (robots && !robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) {
  fail('robots.txt no declara la URL absoluta del sitemap')
}

// ------------------------------------------- 2. sitemap.xml vs rutas del código
const sitemap = read('sitemap.xml')
if (sitemap) {
  const inSitemap = new Set(
    [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map(m => m[1].replace(SITE_URL, '') || '/')
  )
  const inCode = new Set(allRoutes())

  for (const route of inCode) {
    if (!inSitemap.has(route)) fail(`sitemap.xml no incluye ${route} (está en seo.js)`)
  }
  for (const loc of inSitemap) {
    if (!inCode.has(loc)) fail(`sitemap.xml incluye ${loc}, que no existe en seo.js`)
  }
  ok(`sitemap.xml y seo.js coinciden (${inCode.size} rutas)`)
}

// ------------------------------------------------------ 3. <head> por ruta
for (const route of allRoutes()) {
  const html = read(routeFile(route))
  if (html === null) {
    fail(`no se pre-renderizó ${route} (falta dist/${routeFile(route)})`)
    continue
  }

  const seo = resolveSeo(route)

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
  if (!/<h1[\s>]/.test(html)) {
    fail(`${route}: no hay <h1> en el HTML estático`)
  }
  if (!/href="\/[a-z]/.test(html)) {
    fail(`${route}: no hay enlaces internos rastreables`)
  }
}
ok(`${allRoutes().length} rutas con <head> correcto y contenido estático`)

// ----------------------------------------------- 4. Home: hero y servicios
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

// -------------------------------------------- 5. Sin fuentes remotas ni render-blocking
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
