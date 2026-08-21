import { GHL_FIELD_IDS as K } from '../config/ghlFields'
import { BACKEND_URL } from './config'

export async function submitContact(formData, lang) {
  // Passthrough genérico a GHL: las keys son fieldKey nativos. Los values de
  // los dropdowns ya vienen canónicos desde el form (ver ghlFields.js).
  // situation es LARGE_TEXT → string plano, no array.
  const customField = {
    [K.situation]: formData.situation,
  }

  // Los cuatro dropdowns son MULTIPLE_OPTIONS: el value canónico viaja dentro
  // de un array de un elemento.
  //
  // El guard se queda aunque el formulario los exija ahora todos. Esta función
  // es el contrato con el backend y no depende de qué valide la página: quien
  // la llame con un dropdown vacío mandaría `[""]` —un array con la opción
  // vacía— a un campo de opciones de GHL, y eso ensucia la segmentación sin
  // que nada falle. Quien no quiera dar un dato tiene en cada desplegable su
  // opción explícita («Prefiero no decirlo» / «Otro»), que sí se transmite:
  // una negativa es un dato, un hueco no.
  for (const [field, id] of [
    ['profile', K.profile],
    ['assets', K.assets],
    ['income', K.income],
    ['referral', K.referral],
  ]) {
    if (formData[field]) {
      customField[id] = [formData[field]]
    }
  }

  // Atribución de origen (?source=post-<slug> en la URL de /contacto). Viaja
  // por dos caminos, y no es redundancia:
  //
  //  · **El tag es lo que llega a GHL.** El backend fusiona los tags con los
  //    que el contacto ya tenía en vez de reemplazarlos, así que quien escribe
  //    desde tres artículos distintos conserva los tres orígenes. Se descartó
  //    mandarlo como atributo `source` de GHL justamente por lo contrario: ese
  //    es un valor único que se sobrescribe en cada upsert.
  //  · **El campo `source` es el contrato con el backend**, declarado en
  //    `create-contact.dto.ts`. Sin él, `whitelist: true` lo descartaría en
  //    silencio. El backend NO lo reenvía a GHL: existe para que la atribución
  //    llegue como dato propio y no haya que deducirla parseando un tag.
  const tags = [`${lang} - financialq - landing`]
  if (formData.source) tags.push(formData.source)

  const payload = {
    email: formData.email,
    firstName: formData.firstName,
    lastName: formData.lastName,
    customField,
    tags,
  }

  if (formData.source) {
    payload.source = formData.source
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
