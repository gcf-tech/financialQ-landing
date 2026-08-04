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
 * Encadenado en `npm run build`:
 *   vite build && vite build --ssr … && node scripts/prerender.mjs
 *
 * Salida:  dist/index.html, dist/sobre/index.html, dist/approach/risk/index.html …
 * Servido: ver la regla "1a-bis" de public/.htaccess
 *
 * El HTML estático es para los crawlers; el navegador lo reemplaza al montar
 * React (main.jsx usa createRoot, no hydrateRoot — ver PRERENDER-TODO.md).
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { allRoutes, resolveSeo } from '../src/shared/config/seo.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = resolve(ROOT, 'dist')
const SSR_ENTRY = resolve(ROOT, 'dist-ssr/entry-server.js')

const { render } = await import(pathToFileURL(SSR_ENTRY).href)
const template = readFileSync(resolve(DIST, 'index.html'), 'utf8')

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

  out = setMeta(out, 'property', 'og:title', seo.title)
  out = setMeta(out, 'property', 'og:description', seo.description)
  out = setMeta(out, 'property', 'og:url', seo.canonical)
  out = setMeta(out, 'property', 'og:locale', seo.lang === 'es' ? 'es_ES' : 'en_US')

  out = setMeta(out, 'name', 'twitter:title', seo.title)
  out = setMeta(out, 'name', 'twitter:description', seo.description)

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

/** '/' → dist/index.html · '/approach/risk' → dist/approach/risk/index.html */
function outputPath(route) {
  return route === '/'
    ? resolve(DIST, 'index.html')
    : resolve(DIST, route.replace(/^\//, ''), 'index.html')
}

const routes = allRoutes()
let bytes = 0

for (const route of routes) {
  const markup = render(route)
  const seo = resolveSeo(route)

  const html = applySeo(template, seo).replace(
    '<div id="root"></div>',
    `<div id="root">${markup}</div>`
  )

  const file = outputPath(route)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
  bytes += html.length

  console.log(`  ${route.padEnd(24)} ${(markup.length / 1024).toFixed(0)} kB de HTML`)
}

console.log(
  `\n✓ ${routes.length} rutas pre-renderizadas ` +
  `(${(bytes / 1024).toFixed(0)} kB en total)`
)
