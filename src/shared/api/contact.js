const BACKEND_URL = 'https://financial-back-prod-production.up.railway.app'

export async function submitContact(formData, lang) {
  const payload = {
    email: formData.email,
    firstName: formData.firstName,
    lastName: formData.lastName,
    customField: {
      profile: formData.profile,
      investableAssets: formData.assets,
      situation: formData.situation,
    },
    tags: [`${lang} - financialq - landing`],
  }

  if (formData.company.trim()) {
    payload.companyName = formData.company.trim()
  }

  // Campos opcionales: solo se envían si el usuario eligió un valor.
  if (formData.income) {
    payload.customField.householdIncome = formData.income
  }
  if (formData.referral) {
    payload.customField.referralSource = formData.referral
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
