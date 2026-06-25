#!/usr/bin/env node
// Ingesta un artículo a src/pages/perspectives/posts.json bajo un modelo de
// OWNERSHIP: el contenido vive y se renderiza localmente; LinkedIn queda como
// enlace secundario, no como source-of-truth.
//
// Flujo:
//   1. Lee la URL Pulse (solo para `href` e idempotencia) y el cuerpo full del
//      autor desde --body-file (markdown). El cuerpo NUNCA se scrapea.
//   2. Open Graph opcional: og:title / og:description / og:image como contexto
//      auxiliar. Si el scrape falla, los overrides manuales bastan.
//      La fecha de publicación es la FUENTE DE VERDAD (`publishedAt`, ISO): sale
//      del JSON-LD "datePublished" (sobrevive al authwall) o de --published-at.
//      `date` ("May 2026") es display derivado de `publishedAt`.
//   3. Imagen: SIEMPRE local. Descarga og:image (o --image-url) a
//      public/posts-img/<id>.<ext>. Hotlinkear media.licdn.com es ERROR FATAL
//      (sus URLs caducan por el token "e="); si og:image da 403, exige
//      --image-url y aborta.
//   4. Genera blurb/title/tag/cat/read + traducción del cuerpo vía summarize()
//      (adapter LLM, Dependency Inversion). El cuerpo en el idioma origen se
//      preserva verbatim; el LLM solo traduce al otro idioma.
//   5. Imprime el objeto para revisión; con --commit lo añade a posts.json.
//   6. Idempotencia: si el href ya existe, aborta sin escribir.
//
// Uso:
//   node scripts/ingest-post.mjs <pulse-url> --body-file <path.md> [--commit]
//        [--body-lang es|en] [--id <slug>] [--published-at <ISO>]
//        [--title "..."] [--desc "..."] [--image-url <url>]
//
// Env: OPENAI_API_KEY, OPENAI_MODEL (requeridos por el adapter).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { summarize } from './lib/llmClient.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const POSTS_PATH = path.join(ROOT, 'src', 'pages', 'perspectives', 'posts.json')
const IMG_DIR = path.join(ROOT, 'public', 'posts-img')

// LinkedIn solo sirve OG a ciertos bots; este UA mejora las probabilidades,
// pero NO garantiza nada (puede devolver 999/authwall). Ver overrides manuales.
const USER_AGENT = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'

const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function usage() {
  console.log(`Uso:
  node scripts/ingest-post.mjs <pulse-url> --body-file <path.md> [--commit]
       [--body-lang es|en] [--id <slug>] [--published-at <ISO>]
       [--title "..."] [--desc "..."] [--image-url <url>]

  --body-file    (REQUERIDO) Cuerpo full del artículo en markdown, escrito por
                 el autor. Es el source-of-truth; nunca se scrapea.
  --body-lang    Idioma del cuerpo: "es" (default) o "en". El otro idioma lo
                 traduce el LLM; el idioma origen se conserva verbatim.
  --commit       Escribe el post en posts.json (por defecto: dry-run).
  --id           Fuerza el slug del id (por defecto: derivado de la URL).
  --published-at Override ISO (YYYY-MM-DD o YYYY-MM) de la fecha de publicación.
                 Es la fuente de verdad; "date" se deriva de ella. Si no se pasa,
                 se scrapea ("datePublished"/article:published_time); si tampoco
                 hay scrape, ERROR explícito (nunca asume "hoy").
  --title/--desc/--image-url   Overrides manuales si el scrape de OG falla.

  Env requeridas: OPENAI_API_KEY, OPENAI_MODEL.`)
}

function parseArgs(argv) {
  const out = { commit: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--commit') out.commit = true
    else if (a === '--body-file') out.bodyFile = argv[++i]
    else if (a === '--body-lang') out.bodyLang = argv[++i]
    else if (a === '--id') out.id = argv[++i]
    else if (a === '--published-at') out.publishedAt = argv[++i]
    else if (a === '--title') out.title = argv[++i]
    else if (a === '--desc') out.desc = argv[++i]
    else if (a === '--image-url') out.imageUrl = argv[++i]
    else if (a === '--help' || a === '-h') out.help = true
    else if (!a.startsWith('-') && !out.url) out.url = a
  }
  return out
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;|&apos;/gi, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
}

// Extrae el content de una meta OG tolerando ambos órdenes de atributos.
function metaContent(html, prop) {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*\\bcontent=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m) return decodeEntities(m[1]).trim()
  }
  return null
}

async function fetchHtml(url) {
  let res
  try {
    res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
    })
  } catch (err) {
    throw new Error(`No se pudo hacer fetch de la página: ${err.message}`)
  }
  if (res.status === 999) {
    throw new Error('LinkedIn devolvió HTTP 999 (anti-scraping). Usa --title/--desc/--image-url.')
  }
  if (!res.ok) {
    throw new Error(`La página devolvió ${res.status} ${res.statusText}.`)
  }
  const html = await res.text()
  if (/authwall|\/uas\/login|please log in/i.test(html) && !/og:title/i.test(html)) {
    throw new Error('La página devolvió un muro de login (authwall) sin OG. Usa --title/--desc/--image-url.')
  }
  return html
}

function slugFromUrl(url) {
  const u = new URL(url)
  const parts = u.pathname.split('/').filter(Boolean)
  const idx = parts.indexOf('pulse')
  const raw = idx !== -1 && parts[idx + 1] ? parts[idx + 1] : parts[parts.length - 1] || 'post'
  return raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Fecha de publicación: el JSON-LD ("datePublished") sobrevive al authwall de
// LinkedIn; la meta og `article:published_time` casi siempre viene vacía tras el
// login, así que queda solo como fallback.
function publishedTimeFromHtml(html) {
  const jsonLd = html.match(/"datePublished"\s*:\s*"([^"]+)"/i)
  return jsonLd?.[1] || metaContent(html, 'article:published_time')
}

// Normaliza a "YYYY-MM-DD" (o "YYYY-MM") y valida. Acepta timestamps ISO completos.
function normalizePublishedAt(input) {
  const m = String(input).trim().match(/^(\d{4}-\d{2}(?:-\d{2})?)/)
  if (!m) throw new Error(`Fecha de publicación inválida (se esperaba ISO YYYY-MM-DD): "${input}".`)
  return m[1]
}

// Deriva el display "Mon YYYY" desde el ISO SIN parsear Date() (evita corrimientos
// de zona horaria). `publishedAt` es la fuente de verdad.
function displayDate(iso) {
  const m = String(iso).match(/^(\d{4})-(\d{2})/)
  if (!m) throw new Error(`publishedAt no es ISO YYYY-MM(-DD): "${iso}".`)
  return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`
}

async function downloadImage(imageUrl, id) {
  let res
  try {
    res = await fetch(imageUrl, { redirect: 'follow', headers: { 'User-Agent': USER_AGENT } })
  } catch (err) {
    throw new Error(`No se pudo descargar og:image: ${err.message}`)
  }
  if (res.status === 403) {
    throw new Error('og:image devolvió 403 (token "e=" caducado). Reintenta con la URL fresca o usa --image-url.')
  }
  if (!res.ok) throw new Error(`Descarga de og:image devolvió ${res.status} ${res.statusText}.`)

  const ct = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
  const ext = EXT_BY_TYPE[ct]
  if (!ext) throw new Error(`El Content-Type de la imagen no es una imagen soportada: "${ct}".`)

  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length === 0) throw new Error('La imagen descargada está vacía.')

  fs.mkdirSync(IMG_DIR, { recursive: true })
  const fileName = `${id}.${ext}`
  fs.writeFileSync(path.join(IMG_DIR, fileName), buf)
  return { publicPath: `/posts-img/${fileName}`, bytes: buf.length }
}

function loadPosts() {
  return JSON.parse(fs.readFileSync(POSTS_PATH, 'utf8'))
}

function normalizeHref(href) {
  try {
    const u = new URL(href)
    return (u.origin + u.pathname).replace(/\/+$/, '').toLowerCase()
  } catch {
    return (href || '').trim().toLowerCase()
  }
}

// Valida que el JSON del LLM cumple el esquema antes de usarlo.
function validateLlm(o) {
  const errs = []
  for (const lang of ['es', 'en']) {
    if (!o?.[lang]) {
      errs.push(`falta "${lang}"`)
      continue
    }
    for (const k of ['tag', 'title', 'body', 'content']) {
      if (typeof o[lang][k] !== 'string' || !o[lang][k].trim()) errs.push(`${lang}.${k} inválido`)
    }
  }
  if (typeof o?.cat !== 'string' || !o.cat.trim()) errs.push('cat inválido')
  if (typeof o?.read !== 'string' || !o.read.trim()) errs.push('read inválido')
  if (errs.length) throw new Error(`El JSON del LLM no cumple el esquema: ${errs.join(', ')}`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || !args.url || !args.bodyFile) {
    usage()
    process.exit(args.help ? 0 : 1)
  }

  const bodyLang = args.bodyLang ?? 'es'
  if (bodyLang !== 'es' && bodyLang !== 'en') {
    throw new Error(`--body-lang debe ser "es" o "en" (recibido: "${bodyLang}").`)
  }

  const posts = loadPosts()

  // Idempotencia: aborta antes de cualquier gasto de red/LLM (y sin requerir credenciales).
  const target = normalizeHref(args.url)
  if (posts.some((p) => normalizeHref(p.href) === target)) {
    console.error(`✗ Idempotencia: el href ya existe en posts.json (${args.url}). Abortando sin escribir.`)
    process.exit(2)
  }

  // Falla rápido si faltan credenciales del adapter.
  if (!process.env.OPENAI_API_KEY) throw new Error('Falta OPENAI_API_KEY en el entorno.')
  if (!process.env.OPENAI_MODEL) throw new Error('Falta OPENAI_MODEL en el entorno (no se hardcodea el modelo).')

  // Cuerpo full del autor (source-of-truth). NUNCA se scrapea.
  let body
  try {
    body = fs.readFileSync(path.resolve(args.bodyFile), 'utf8')
  } catch (err) {
    throw new Error(`No se pudo leer --body-file (${args.bodyFile}): ${err.message}`)
  }
  if (!body.trim()) throw new Error(`--body-file (${args.bodyFile}) está vacío.`)

  // Open Graph: overrides manuales o scrape. Solo contexto auxiliar; si falla,
  // los overrides bastan (el cuerpo ya está garantizado por --body-file).
  const og = { title: args.title, description: args.desc, image: args.imageUrl, publishedTime: null }
  // Hay que ir al HTML si falta algún OG o si no se pasó --published-at (la
  // fecha también se scrapea).
  if (!og.title || !og.description || !og.image || !args.publishedAt) {
    const html = await fetchHtml(args.url)
    og.title ??= metaContent(html, 'og:title')
    og.description ??= metaContent(html, 'og:description')
    og.image ??= metaContent(html, 'og:image')
    og.publishedTime = publishedTimeFromHtml(html)
  }
  if (!og.title || !og.description) throw new Error('No se obtuvieron og:title/og:description. Usa --title/--desc.')
  if (!og.image) throw new Error('No se obtuvo og:image. Usa --image-url.')

  // Fecha de publicación (SSOT). --published-at gana; si no, lo scrapeado. Si ni
  // flag ni scrape dan fecha, error explícito: nunca se asume "hoy".
  const rawPublished = args.publishedAt || og.publishedTime
  if (!rawPublished) {
    throw new Error(
      'No se obtuvo fecha de publicación (ni --published-at ni datePublished/article:published_time). Pasa --published-at <ISO>.',
    )
  }
  const publishedAt = normalizePublishedAt(rawPublished)

  const id = args.id || slugFromUrl(args.url)

  // Imagen: SIEMPRE local. downloadImage descarga a /posts-img y devuelve la
  // ruta local; si og:image da 403 lanza error pidiendo --image-url.
  const img = await downloadImage(og.image, id)
  // Invariante de ownership: jamás se persiste un hotlink. Defensa en profundidad.
  if (!img.publicPath.startsWith('/posts-img/')) {
    throw new Error(`La imagen no quedó local (${img.publicPath}). Hotlinking prohibido.`)
  }

  // LLM (adapter): traduce el cuerpo al otro idioma y deriva blurb/title/tag/cat/read.
  // Infiere tono desde los primeros posts existentes.
  const samples = posts.slice(0, 3).map((p) => ({ es: p.i18n.es, en: p.i18n.en, cat: p.cat, read: p.read }))
  const llm = await summarize({
    ogTitle: og.title,
    ogDescription: og.description,
    body,
    bodyLang,
    samples,
  })
  validateLlm(llm)

  // Source-of-truth: el cuerpo en el idioma origen se persiste VERBATIM,
  // sin depender de que el LLM lo haya copiado fielmente.
  llm[bodyLang].content = body

  // Ensambla el objeto con el esquema de posts.json (incluye content bilingüe).
  const post = {
    id,
    cat: llm.cat,
    image: img.publicPath,
    href: args.url,
    read: llm.read,
    publishedAt,
    date: displayDate(publishedAt),
    i18n: { es: llm.es, en: llm.en },
  }

  console.log('\n=== Objeto generado (revisión) ===')
  console.log(JSON.stringify(post, null, 2))
  console.log(`\n(imagen guardada en public${img.publicPath}, ${img.bytes} bytes)`)

  const knownCats = new Set(posts.map((p) => p.cat))
  if (!knownCats.has(post.cat)) {
    console.warn(`⚠ cat "${post.cat}" no aparece en posts.json (${[...knownCats].join(', ')}). Revísalo antes de commitear.`)
  }

  if (!args.commit) {
    console.log('\nDry-run. Reejecuta con --commit para añadirlo a posts.json.')
    return
  }

  posts.push(post)
  fs.writeFileSync(POSTS_PATH, `${JSON.stringify(posts, null, 2)}\n`, 'utf8')
  console.log(`\n✓ Añadido a posts.json (id="${id}"). Total: ${posts.length} posts.`)
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}`)
  process.exit(1)
})
