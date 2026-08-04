/**
 * Regenera las fuentes auto-hospedadas de public/fonts/.
 *
 * Solo hace falta correrlo si cambian las familias o el rango de pesos que
 * usa el sitio (ver --serif / --sans en src/shared/config/tokens.css).
 * El resultado se versiona: el build no depende de este script ni de red.
 *
 * Uso:  node scripts/gen-fonts.mjs
 *
 * Descarga los woff2 a public/fonts/ e imprime el bloque @font-face que
 * debe quedar en src/shared/config/fonts.css.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = resolve(ROOT, 'public/fonts')

// Rangos de peso alineados con el uso real del CSS. Ambas familias son
// variables en Google Fonts, por eso un archivo cubre todo el rango.
const GOOGLE_CSS_URL =
  'https://fonts.googleapis.com/css2' +
  '?family=Cormorant+Garamond:ital,wght@0,300..600;1,300..500' +
  '&family=Plus+Jakarta+Sans:wght@300..700' +
  '&display=swap'

// Sin un UA de navegador moderno, Google devuelve ttf/woff en vez de woff2.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

const SUBSETS = new Set(['latin', 'latin-ext'])

function parseFaces(css) {
  const faces = []
  for (const block of css.split('/*').slice(1)) {
    const subset = block.slice(0, block.indexOf('*/')).trim()
    if (!SUBSETS.has(subset)) continue

    const family = /font-family: '([^']+)'/.exec(block)[1]
    const style = /font-style: (\w+)/.exec(block)[1]
    const weight = /font-weight: ([\d ]+);/.exec(block)[1].trim()
    const url = /url\((https:[^)]+)\)/.exec(block)[1]
    const unicodeRange = /unicode-range: ([^;]+);/.exec(block)[1]
    const slug = `${family.toLowerCase().replace(/ /g, '-')}-${style}-${subset}`

    faces.push({ family, style, weight, url, unicodeRange, file: `${slug}.woff2` })
  }
  return faces
}

function fontFaceRule({ family, style, weight, file, unicodeRange }) {
  return `@font-face {
  font-family: '${family}';
  font-style: ${style};
  font-weight: ${weight};
  font-display: swap;
  src: url('/fonts/${file}') format('woff2');
  unicode-range: ${unicodeRange};
}`
}

const res = await fetch(GOOGLE_CSS_URL, { headers: { 'User-Agent': UA } })
if (!res.ok) throw new Error(`Google Fonts respondió ${res.status}`)

const faces = parseFaces(await res.text())
mkdirSync(OUT_DIR, { recursive: true })

for (const face of faces) {
  const buf = Buffer.from(await (await fetch(face.url)).arrayBuffer())
  writeFileSync(resolve(OUT_DIR, face.file), buf)
  console.log(`${face.file.padEnd(46)} ${(buf.length / 1024).toFixed(1)} KB`)
}

console.log('\n--- Pegar en src/shared/config/fonts.css ---\n')
console.log(faces.map(fontFaceRule).join('\n\n'))
