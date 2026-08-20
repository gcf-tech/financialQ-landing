import { BACKEND_URL } from './config'
import { getAccessToken } from './auth'

// Posts y etiquetas de Perspectives. Lectura pública; escritura con sesión
// admin (ver shared/api/auth.js). El backend expone /landings/posts y
// /landings/tags (repo financial-backend, módulo src/landings/posts).

async function parseError(res, fallback) {
  const err = await res.json().catch(() => ({}))
  return new Error(err.error || err.message || fallback)
}

async function authHeaders() {
  const token = await getAccessToken()
  return { Authorization: `Bearer ${token}` }
}

// ---------- Lectura pública ----------

export async function fetchPosts() {
  const res = await fetch(`${BACKEND_URL}/landings/posts`)
  if (!res.ok) throw await parseError(res, 'Could not load posts')
  return res.json()
}

export async function fetchPost(slug) {
  const res = await fetch(`${BACKEND_URL}/landings/posts/${encodeURIComponent(slug)}`)
  if (res.status === 404) return null
  if (!res.ok) throw await parseError(res, 'Could not load post')
  return res.json()
}

export async function fetchTags() {
  const res = await fetch(`${BACKEND_URL}/landings/tags`)
  if (!res.ok) throw await parseError(res, 'Could not load tags')
  return res.json()
}

// ---------- Lectura admin (incluye borradores) ----------

/**
 * Listado del panel: NO filtra por publicado, así que es la única vía para ver
 * un borrador. Devuelve { items, page, limit, total, totalPages }.
 *
 * Cada item trae metadatos, no el artículo: id, slug, titleEs, titleEn,
 * isPublished, notifiedAt, createdAt, updatedAt, createdBy, updatedBy. Los DOS
 * títulos, sin elegir idioma por el cliente: si uno viene vacío es que la
 * traducción de ese borrador quedó a medias, y el panel lo muestra.
 *
 * params: { status: 'draft' | 'published' | 'all', page, limit }
 */
export async function listAdminPosts(params = {}) {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  const qs = query.toString()

  const res = await fetch(
    `${BACKEND_URL}/landings/posts/admin${qs ? `?${qs}` : ''}`,
    { headers: await authHeaders() },
  )
  if (!res.ok) throw await parseError(res, 'Could not load admin posts')
  return res.json()
}

/**
 * Detalle para el editor, publicado o no. Misma forma que fetchPost (i18n,
 * tags…) más `isPublished`. Acepta el uuid o el slug.
 */
export async function getAdminPost(idOrSlug) {
  const res = await fetch(
    `${BACKEND_URL}/landings/posts/admin/${encodeURIComponent(idOrSlug)}`,
    { headers: await authHeaders() },
  )
  if (res.status === 404) return null
  if (!res.ok) throw await parseError(res, 'Could not load post')
  return res.json()
}

// ---------- Escritura (admin) ----------

export async function createPost(data) {
  const res = await fetch(`${BACKEND_URL}/landings/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw await parseError(res, 'Could not create post')
  return res.json()
}

export async function updatePost(id, data) {
  const res = await fetch(`${BACKEND_URL}/landings/posts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw await parseError(res, 'Could not update post')
  return res.json()
}

export async function deletePost(id) {
  const res = await fetch(`${BACKEND_URL}/landings/posts/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) throw await parseError(res, 'Could not delete post')
  return res.json()
}

/** Sube la imagen de portada y devuelve su URL pública. */
export async function uploadPostImage(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BACKEND_URL}/landings/posts/upload-image`, {
    method: 'POST',
    headers: await authHeaders(),
    body: form,
  })
  if (!res.ok) throw await parseError(res, 'Could not upload image')
  const data = await res.json()
  return data.imageUrl
}

/**
 * Traducción bidireccional vía LLM del backend. Enviar { titleEn, contentEn }
 * para generar el español o { titleEs, contentEs } para generar el inglés.
 * Devuelve título/cuerpo del idioma destino + { bodyEs, bodyEn, read }.
 */
export async function translateDraft(fields) {
  const res = await fetch(`${BACKEND_URL}/landings/posts/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(fields),
  })
  if (!res.ok) throw await parseError(res, 'Translation failed')
  return res.json()
}

export async function createTag(data) {
  const res = await fetch(`${BACKEND_URL}/landings/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw await parseError(res, 'Could not create tag')
  return res.json()
}

export async function deleteTag(id) {
  const res = await fetch(`${BACKEND_URL}/landings/tags/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) throw await parseError(res, 'Could not delete tag')
  return res.json()
}
