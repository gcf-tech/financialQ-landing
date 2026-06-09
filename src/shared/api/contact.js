import { GHL_FIELD_KEYS as K } from '../config/ghlFields'

const BACKEND_URL = 'https://financial-back-prod-production.up.railway.app'

export async function submitContact(formData, lang) {
  // Passthrough genérico a GHL: las keys son fieldKey nativos. Los values de
  // los dropdowns ya vienen canónicos desde el form (ver ghlFields.js).
  const customField = {
    [K.profile]: formData.profile,
    [K.assets]: formData.assets,
    [K.situation]: formData.situation,
  }

  // Opcionales: solo se envían si el usuario eligió un valor.
  if (formData.income) {
    customField[K.income] = formData.income
  }
  if (formData.referral) {
    customField[K.referral] = formData.referral
  }

  const payload = {
    email: formData.email,
    firstName: formData.firstName,
    lastName: formData.lastName,
    customField,
    tags: [`${lang} - financialq - landing`],
  }

  if (formData.company.trim()) {
    payload.companyName = formData.company.trim()
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
