// Suscripción al newsletter de Perspectivas. Reutiliza el mismo passthrough a
// GHL que el form de contacto (ver contact.js): el suscriptor queda como
// contacto en GHL, distinguido por un tag propio. El aviso de "nuevo post" lo
// envía GHL a ese tag (disparado manualmente vía scripts/notify-subscribers.mjs).
const BACKEND_URL = 'https://dashboardback.financialqgroup.com'

export async function subscribeNewsletter({ email, name }, lang) {
  // El form solo pide nombre completo en un campo; lo partimos en first/last
  // como mejor esfuerzo (GHL acepta lastName vacío).
  const trimmed = (name || '').trim()
  const sep = trimmed.indexOf(' ')
  const firstName = sep === -1 ? trimmed : trimmed.slice(0, sep)
  const lastName = sep === -1 ? '' : trimmed.slice(sep + 1).trim()

  const payload = {
    email: email.trim(),
    firstName,
    lastName,
    // Tag distintivo: es el segmento al que el workflow de GHL envía el aviso.
    tags: [`${lang} - financialq - newsletter`],
  }

  const res = await fetch(`${BACKEND_URL}/landings/contacts/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Request failed')
  }

  return res.json()
}
