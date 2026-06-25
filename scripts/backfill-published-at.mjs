#!/usr/bin/env node
// Backfill one-off: añade `publishedAt` (ISO YYYY-MM-DD) a los posts existentes
// de posts.json que aún no lo tienen.
//
// `publishedAt` es la FUENTE DE VERDAD de la fecha; `date` ("May 2026") queda
// como display derivado. La fecha real se obtiene scrapeando LinkedIn Pulse:
//   - PRIMARIO: "datePublished" del JSON-LD embebido (sobrevive al authwall).
//   - FALLBACK: meta og `article:published_time` (suele venir vacío tras login).
//
// Reglas (honestidad de datos):
//   - Idempotente: salta los posts que ya tienen `publishedAt`.
//   - Si un post no se puede scrapear, NO se inventa fecha: queda PENDIENTE y se
//     reporta. Para esos se puede fijar la fecha a mano editando posts.json.
//   - Inserta `publishedAt` justo antes de `date`, preservando el orden de claves.
//
// Uso:
//   node scripts/backfill-published-at.mjs           (dry-run: scrapea y reporta)
//   node scripts/backfill-published-at.mjs --commit   (escribe posts.json)

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const POSTS_PATH = path.join(ROOT, 'src', 'pages', 'perspectives', 'posts.json')

const USER_AGENT = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'

// Extrae la fecha de publicación de la página: JSON-LD primero, OG después.
// Devuelve "YYYY-MM-DD" o null si no se encuentra.
function extractPublishedAt(html) {
  const jsonLd = html.match(/"datePublished"\s*:\s*"([^"]+)"/i)
  const ogMeta =
    html.match(/article:published_time["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/content=["']([^"']+)["'][^>]*article:published_time/i)
  const raw = jsonLd?.[1] || ogMeta?.[1]
  if (!raw) return null
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : null
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// LinkedIn throttlea con HTTP 999 de forma intermitente. Reintenta con backoff
// antes de declarar un post como pendiente (evita falsos negativos transitorios).
async function scrapePublishedAt(url, { retries = 3, backoffMs = 2500 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
    })
    if (res.status === 999 || res.status === 429) {
      if (attempt < retries) {
        await sleep(backoffMs * (attempt + 1))
        continue
      }
      throw new Error(`HTTP ${res.status} (rate-limit) tras ${retries} reintentos`)
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    const html = await res.text()
    const date = extractPublishedAt(html)
    if (!date) throw new Error('sin datePublished/article:published_time en el HTML')
    return date
  }
}

// Reconstruye el post insertando `publishedAt` antes de `date` (orden de claves).
function withPublishedAt(post, publishedAt) {
  const out = {}
  for (const [k, v] of Object.entries(post)) {
    if (k === 'date') out.publishedAt = publishedAt
    out[k] = v
  }
  if (!('publishedAt' in out)) out.publishedAt = publishedAt // por si no hubiera `date`
  return out
}

async function main() {
  const commit = process.argv.includes('--commit')
  const posts = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf8'))

  const done = []
  const pending = []
  let changed = false

  for (let i = 0; i < posts.length; i++) {
    const p = posts[i]
    if (p.publishedAt) {
      done.push({ id: p.id, publishedAt: p.publishedAt, status: 'ya tenía' })
      continue
    }
    try {
      const publishedAt = await scrapePublishedAt(p.href)
      posts[i] = withPublishedAt(p, publishedAt)
      changed = true
      done.push({ id: p.id, publishedAt, status: 'scrapeado' })
    } catch (err) {
      pending.push({ id: p.id, href: p.href, error: err.message })
    }
  }

  console.log('\n=== Backfill publishedAt ===')
  for (const d of done) console.log(`  ✓ ${d.publishedAt}  ${d.id}  (${d.status})`)
  if (pending.length) {
    console.log('\n=== PENDIENTES (no se pudo scrapear, fijar a mano) ===')
    for (const p of pending) console.log(`  ✗ ${p.id}  →  ${p.error}\n     ${p.href}`)
  }

  if (!commit) {
    console.log(`\nDry-run. ${changed ? 'Reejecuta con --commit para escribir posts.json.' : 'Nada que escribir.'}`)
    return
  }
  if (!changed) {
    console.log('\nNada que escribir (todos ya tenían publishedAt).')
    return
  }
  fs.writeFileSync(POSTS_PATH, `${JSON.stringify(posts, null, 2)}\n`, 'utf8')
  console.log(`\n✓ posts.json actualizado. ${done.length} con publishedAt, ${pending.length} pendientes.`)
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}`)
  process.exit(1)
})
