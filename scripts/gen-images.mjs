/**
 * Genera las variantes de imagen que sirve el sitio.
 *
 * Los originales (3176x684 los logos, 1920x1080 el hero) pesan 20–40× lo que
 * el navegador necesita; este script produce las versiones al tamaño real de
 * uso, en WebP y con fallback PNG donde hace falta.
 *
 * `sharp` NO es dependencia del proyecto: el resultado se versiona y el build
 * no lo necesita. Para volver a correrlo:
 *
 *   npm install sharp --no-save
 *   node scripts/gen-images.mjs
 *
 * Tamaños de logo = alto real en CSS × densidad:
 *   header  #mainNav .logo-img { height: 45px }  → 209x45  y  418x90  (@2x)
 *   footer  footer   .logo-img { height: 34px }  → 158x34  y  316x68  (@2x)
 */

import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const p = (...parts) => resolve(ROOT, ...parts)

const HEADER_LOGO = p('src/assets/images/header/logo_financialQ.png')
const FOOTER_LOGO = p('src/assets/images/footer/logo_blanco_financialQ.png')
const HERO = p('src/assets/images/hero/New-york.png')

mkdirSync(p('public/fonts'), { recursive: true })

/**
 * Logo a un tamaño dado, en WebP.
 * Sin fallback PNG a propósito: WebP lo soporta todo navegador capaz de correr
 * React 19, y un <picture> con dos fuentes complicaría el markup del header
 * para cubrir un caso que no existe en este público.
 */
async function logo(src, outDir, name, width, height) {
  await sharp(src)
    .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 92, effort: 6 })
    .toFile(resolve(outDir, `${name}.webp`))
  return `${name}.webp ${width}x${height}`
}

const done = []

// --- Logos responsive (1x y 2x) ---
const headerDir = p('src/assets/images/header')
const footerDir = p('src/assets/images/footer')

done.push(await logo(HEADER_LOGO, headerDir, 'logo_financialQ-209w', 209, 45))
done.push(await logo(HEADER_LOGO, headerDir, 'logo_financialQ-418w', 418, 90))
done.push(await logo(FOOTER_LOGO, footerDir, 'logo_blanco_financialQ-158w', 158, 34))
done.push(await logo(FOOTER_LOGO, footerDir, 'logo_blanco_financialQ-316w', 316, 68))

// --- Logo con URL estable para el JSON-LD y consumidores externos ---
// Va en public/ (sin hash) porque el schema.org lo referencia por URL absoluta.
await sharp(HEADER_LOGO)
  .resize(836, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .flatten({ background: '#ffffff' })
  .png({ compressionLevel: 9 })
  .toFile(p('public/logo-financialq.png'))
done.push('public/logo-financialq.png 836x180')

// --- Fondo del hero: PNG de 2.1 MB → WebP ---
// Es una foto, no un gráfico: PNG era el formato equivocado. Se mantiene la
// resolución (1920x1080) porque cubre pantallas grandes con `background: cover`.
await sharp(HERO)
  .resize(1920, 1080, { fit: 'cover' })
  .webp({ quality: 72, effort: 6 })
  .toFile(p('src/assets/images/hero/New-york.webp'))
done.push('New-york.webp 1920x1080')

// --- Imagen social (Open Graph / Twitter card) ---
// Recorte del hero real. TODO: sustituir por una pieza con marca y claim
// cuando exista diseño; 1200x630 es el tamaño que piden LinkedIn/X/Facebook.
await sharp(HERO)
  .resize(1200, 630, { fit: 'cover', position: 'top' })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(p('public/og-image.jpg'))
done.push('public/og-image.jpg 1200x630')

console.log(done.join('\n'))
