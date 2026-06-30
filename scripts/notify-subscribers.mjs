#!/usr/bin/env node
// Aviso MANUAL de nuevo post a los suscriptores del newsletter (opción C1).
//
// Se ejecuta DESPUÉS de que el post esté vivo online (post-deploy), nunca antes:
// si se dispara antes del deploy el enlace del correo daría 404.
//
// Qué hace: lee posts.json, toma un post (el último ingerido por defecto, o el
// que indiques con --id) y hace POST de SUS DATOS (título, enlace, imagen) a un
// Inbound Webhook de GHL. NO manda la lista de suscriptores: esa la tiene GHL.
// El Workflow de GHL, al recibir el webhook, envía el email a todos los contactos
// con el tag del newsletter (ver src/shared/api/newsletter.js).
//
// Uso:
//   node scripts/notify-subscribers.mjs [--id <slug>] [--dry-run]
//
// Env requeridas (salvo --dry-run, que solo imprime el payload):
//   GHL_NEWSLETTER_WEBHOOK_URL  URL del Inbound Webhook trigger de GHL.
//   SITE_URL                    Base pública del sitio (p.ej. https://financialq.group),
//                               para construir enlaces e imagen absolutos.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROUTE_SLUGS } from '../src/shared/config/routes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const POSTS_PATH = path.join(ROOT, 'src', 'pages', 'perspectives', 'posts.json')

function parseArgs(argv) {
  const out = { dryRun: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') out.dryRun = true
    else if (a === '--id') out.id = argv[++i]
    else if (a === '--help' || a === '-h') out.help = true
  }
  return out
}

function usage() {
  console.log(`Uso:
  node scripts/notify-subscribers.mjs [--id <slug>] [--dry-run]

  --id        Slug del post a anunciar. Por defecto: el último de posts.json
              (el recién ingerido, que ingest-post añade al final del array).
  --dry-run   Imprime el payload sin enviar nada a GHL (no requiere env).

  Env requeridas (salvo --dry-run):
    GHL_NEWSLETTER_WEBHOOK_URL   Inbound Webhook trigger de GHL.
    SITE_URL                     Base pública del sitio (sin slash final).`)
}

// Recorta un blurb a una longitud razonable para el preview del correo.
function excerpt(s, max = 220) {
  const t = (s || '').trim().replace(/\s+/g, ' ')
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    usage()
    return
  }

  const siteUrl = (process.env.SITE_URL || '').replace(/\/+$/, '')
  const webhookUrl = process.env.GHL_NEWSLETTER_WEBHOOK_URL

  if (!args.dryRun) {
    if (!webhookUrl) throw new Error('Falta GHL_NEWSLETTER_WEBHOOK_URL en el entorno.')
    if (!siteUrl) throw new Error('Falta SITE_URL en el entorno (necesaria para enlaces absolutos).')
  }

  const posts = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf8'))
  if (posts.length === 0) throw new Error('posts.json está vacío.')

  // Por defecto, el último post del array = el recién ingerido (ingest-post hace push).
  const post = args.id ? posts.find((p) => p.id === args.id) : posts[posts.length - 1]
  if (!post) throw new Error(`No se encontró un post con id="${args.id}" en posts.json.`)

  const base = siteUrl || '{SITE_URL}'
  const image = post.image?.startsWith('http') ? post.image : `${base}${post.image}`

  // Payload bilingüe: el Workflow de GHL de cada tag (es/en) usa su bloque.
  // url por idioma respeta los slugs traducidos (/perspectivas vs /perspectives).
  const langs = ['es', 'en']
  const byLang = Object.fromEntries(
    langs.map((lng) => {
      const slug = ROUTE_SLUGS[lng].perspectivas
      const c = post.i18n?.[lng] || {}
      return [lng, {
        title: c.title || '',
        excerpt: excerpt(c.body),
        tag: c.tag || '',
        url: `${base}/${slug}/${post.id}`,
      }]
    }),
  )

  const payload = {
    id: post.id,
    image,
    date: post.date,
    publishedAt: post.publishedAt,
    es: byLang.es,
    en: byLang.en,
  }

  if (args.dryRun) {
    console.log('=== Payload (dry-run, NO enviado) ===')
    console.log(JSON.stringify(payload, null, 2))
    console.log('\nReejecuta sin --dry-run (y con las env) para enviar a GHL.')
    return
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`El webhook de GHL devolvió ${res.status} ${res.statusText}. ${body}`)
  }

  console.log(`✓ Aviso enviado a GHL para el post id="${post.id}".`)
  console.log('  GHL repartirá el correo a los suscriptores del tag del newsletter.')
}

main().catch((err) => {
  console.error(`\n✗ ${err.message}`)
  process.exit(1)
})
