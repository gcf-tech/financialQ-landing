#!/usr/bin/env node
// Migración one-shot: localiza las imágenes hotlinkeadas de posts.json.
//
// El modelo viejo guardaba `image` apuntando a media.licdn.com, cuyo token "e="
// caduca y rompe la imagen. Este script descarga cada imagen remota a
// public/posts-img/<id>.<ext> y reescribe `image` a esa ruta local, alineando
// los posts existentes con la invariante de ownership del nuevo ingest.
//
// Idempotente: los posts cuyo `image` ya es local (/posts-img/...) se omiten.
// Si el token ya caducó (403) la descarga falla y se reporta: hay que reingestar
// esa imagen con --image-url fresca (no se inventa nada).
//
// Modo masivo (default): recorre todas las imágenes remotas y las localiza
// usando la URL ya guardada en `image`. Útil justo tras ingestar, mientras los
// tokens "e=" siguen vivos.
//
// Modo puntual (--id <id> [--image-url <url>]): re-localiza UN post cuyo token
// caducó, sin tocar posts.json a mano. La URL fresca se toma de --image-url
// (recomendado) o, si se omite, de la que tenga el post. Cierra el ciclo de los
// posts que dieron 403 en la migración masiva.
//
// Uso:
//   node scripts/localize-images.mjs                         (dry-run masivo)
//   node scripts/localize-images.mjs --commit                (masivo)
//   node scripts/localize-images.mjs --id <id> --image-url <url> --commit  (puntual)

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const POSTS_PATH = path.join(ROOT, 'src', 'pages', 'perspectives', 'posts.json')
const IMG_DIR = path.join(ROOT, 'public', 'posts-img')

const USER_AGENT = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'

const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

async function downloadImage(imageUrl, id) {
  let res
  try {
    res = await fetch(imageUrl, { redirect: 'follow', headers: { 'User-Agent': USER_AGENT } })
  } catch (err) {
    throw new Error(`fetch falló: ${err.message}`)
  }
  if (res.status === 403) {
    throw new Error('403 (token "e=" caducado). Reingesta con --image-url fresca.')
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)

  const ct = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
  const ext = EXT_BY_TYPE[ct]
  if (!ext) throw new Error(`Content-Type no soportado: "${ct}"`)

  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length === 0) throw new Error('imagen vacía')

  fs.mkdirSync(IMG_DIR, { recursive: true })
  fs.writeFileSync(path.join(IMG_DIR, `${id}.${ext}`), buf)
  return { publicPath: `/posts-img/${id}.${ext}`, bytes: buf.length }
}

function parseArgs(argv) {
  const out = { commit: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--commit') out.commit = true
    else if (a === '--id') out.id = argv[++i]
    else if (a === '--image-url') out.imageUrl = argv[++i]
  }
  return out
}

// Modo puntual: re-localiza un único post por id con una URL fresca.
async function localizeOne(posts, args) {
  const post = posts.find((p) => p.id === args.id)
  if (!post) throw new Error(`No existe un post con id="${args.id}" en posts.json.`)

  const source = args.imageUrl || post.image
  if (!/^https?:\/\//i.test(source)) {
    throw new Error(
      `El post "${args.id}" no tiene una URL remota de origen. Pasa --image-url <url> con la imagen fresca.`,
    )
  }

  if (!args.commit) {
    console.log(`Re-localizaría "${args.id}" desde:\n  ${source}\n\nDry-run. Añade --commit para escribir.`)
    return
  }

  const img = await downloadImage(source, args.id)
  post.image = img.publicPath
  fs.writeFileSync(POSTS_PATH, `${JSON.stringify(posts, null, 2)}\n`, 'utf8')
  console.log(`✓ "${args.id}" → public${img.publicPath} (${img.bytes} bytes). posts.json reescrito.`)
}

// Modo masivo: localiza todas las imágenes remotas con su URL ya guardada.
async function localizeAll(posts, args) {
  const remote = posts.filter((p) => /^https?:\/\//i.test(p.image))
  if (remote.length === 0) {
    console.log('✓ Nada que migrar: todas las imágenes ya son locales.')
    return
  }

  console.log(`${remote.length} imagen(es) remota(s) por localizar${args.commit ? '' : ' (dry-run)'}:\n`)

  let ok = 0
  const failed = []
  for (const p of remote) {
    if (!args.commit) {
      console.log(`  - ${p.id}: ${p.image.slice(0, 80)}…`)
      continue
    }
    try {
      const img = await downloadImage(p.image, p.id)
      p.image = img.publicPath
      ok++
      console.log(`  ✓ ${p.id} → public${img.publicPath} (${img.bytes} bytes)`)
    } catch (err) {
      failed.push({ id: p.id, msg: err.message })
      console.error(`  ✗ ${p.id}: ${err.message}`)
    }
  }

  if (!args.commit) {
    console.log('\nDry-run. Reejecuta con --commit para descargar y reescribir posts.json.')
    return
  }

  if (ok > 0) {
    fs.writeFileSync(POSTS_PATH, `${JSON.stringify(posts, null, 2)}\n`, 'utf8')
    console.log(`\n✓ posts.json reescrito: ${ok} imagen(es) localizada(s).`)
  }
  if (failed.length) {
    console.error(`\n⚠ ${failed.length} fallaron (probable token caducado): ${failed.map((f) => f.id).join(', ')}`)
    console.error('  Esas siguen apuntando al hotlink; re-localízalas con --id <id> --image-url <url> fresca.')
    process.exit(1)
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const posts = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf8'))

  if (args.id) await localizeOne(posts, args)
  else await localizeAll(posts, args)
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}`)
  process.exit(1)
})
