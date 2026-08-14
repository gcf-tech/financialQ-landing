// Adapter LLM aislado (Dependency Inversion).
//
// El orquestador (ingest-post.mjs) depende SOLO de las funciones `summarize()`
// y `assertLlmConfigured()`, no del proveedor concreto ni de los nombres de sus
// variables de entorno. Para cambiar de proveedor, se reescribe este archivo
// sin tocar el orquestador.
//
// Implementación actual: Gemini (API nativa, generateContent) vía fetch nativo
// (Node 18+), sin dependencias. OpenAI Chat Completions queda como alterna,
// seleccionable con LLM_PROVIDER y usable como fallback con
// LLM_FALLBACK_PROVIDER. El modelo se lee del entorno (no se hardcodea).
//
// Env:
//   LLM_PROVIDER           gemini | openai   (default: gemini)
//   LLM_FALLBACK_PROVIDER  gemini | openai   (vacío = sin fallback)
//   GEMINI_API_KEY / GEMINI_MODEL [/ GEMINI_BASE_URL]
//   OPENAI_API_KEY / OPENAI_MODEL [/ OPENAI_BASE_URL]
//   LLM_TIMEOUT_MS         timeout por petición (default: 180000)

const PROVIDERS = ['gemini', 'openai']

const BASE_URL_DEFAULT = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  openai: 'https://api.openai.com/v1',
}

// Sin timeout, un proveedor colgado deja el script colgado para siempre y el
// fallback nunca se dispara. Default holgado: la traducción de un artículo
// largo tarda decenas de segundos.
const TIMEOUT_MS_DEFAULT = 180_000

/**
 * Fallo de DISPONIBILIDAD del proveedor: red, HTTP no-2xx o respuesta vacía.
 * Es lo único que dispara el fallback, porque es lo único que otro proveedor
 * puede resolver. Un JSON mal formado no lo dispara.
 */
class ProviderUnavailableError extends Error {}

/**
 * Parsea JSON tolerando que el modelo envuelva la respuesta en fences markdown
 * (```json ... ```) o agregue texto alrededor del objeto.
 * @param {string} raw
 * @returns {object}
 */
function parseJsonLoose(raw) {
  let s = (raw ?? '').trim()

  // Quita fences ```json ... ``` o ``` ... ```
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (fence) s = fence[1].trim()

  // Si aún hay prosa alrededor, recorta del primer "{" al último "}"
  if (!s.startsWith('{')) {
    const a = s.indexOf('{')
    const b = s.lastIndexOf('}')
    if (a !== -1 && b !== -1 && b > a) s = s.slice(a, b + 1)
  }

  return JSON.parse(s)
}

/**
 * Resuelve la config de un proveedor desde el entorno.
 * @param {'gemini'|'openai'} provider
 * @returns {{provider:string, apiKey:string, model:string, baseUrl:string}|null}
 *          null si le falta la key o el modelo.
 */
function resolveConfig(provider) {
  const prefix = provider.toUpperCase()
  const apiKey = (process.env[`${prefix}_API_KEY`] ?? '').trim()
  const model = (process.env[`${prefix}_MODEL`] ?? '').trim()
  if (!apiKey || !model) return null

  const baseUrl = (process.env[`${prefix}_BASE_URL`] || BASE_URL_DEFAULT[provider]).replace(/\/+$/, '')

  // Un LLM_TIMEOUT_MS inválido o <= 0 se ignora en favor del default.
  const rawTimeout = Number(process.env.LLM_TIMEOUT_MS)
  const timeoutMs = Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : TIMEOUT_MS_DEFAULT

  return { provider, apiKey, model, baseUrl, timeoutMs }
}

/** Distingue el timeout del resto de fallos de red al construir el mensaje. */
function describeFetchError(err, config) {
  return err?.name === 'TimeoutError'
    ? `timeout tras ${config.timeoutMs} ms`
    : `error de red: ${err?.message ?? err}`
}

/**
 * Normaliza el nombre del proveedor primario. Un valor desconocido no se ignora
 * en silencio: se avisa y se cae a gemini.
 * @returns {'gemini'|'openai'}
 */
function resolvePrimaryName() {
  const raw = (process.env.LLM_PROVIDER ?? '').trim().toLowerCase()
  if (!raw) return 'gemini'
  if (PROVIDERS.includes(raw)) return raw
  console.warn(`⚠ LLM_PROVIDER="${raw}" no es válido (${PROVIDERS.join(' | ')}); usando gemini.`)
  return 'gemini'
}

/**
 * Fallback opcional: solo si está declarado, es distinto al primario y tiene su
 * propia key + modelo. Declarado a medias = warning y sin fallback.
 * @param {string} primaryName
 */
function resolveFallback(primaryName) {
  const raw = (process.env.LLM_FALLBACK_PROVIDER ?? '').trim().toLowerCase()
  if (!raw) return null

  if (!PROVIDERS.includes(raw)) {
    console.warn(`⚠ LLM_FALLBACK_PROVIDER="${raw}" no es válido; fallback desactivado.`)
    return null
  }
  if (raw === primaryName) {
    console.warn('⚠ LLM_FALLBACK_PROVIDER es igual a LLM_PROVIDER; fallback desactivado.')
    return null
  }

  const config = resolveConfig(raw)
  if (!config) {
    console.warn(`⚠ Fallback "${raw}" declarado pero sin ${raw.toUpperCase()}_API_KEY / ${raw.toUpperCase()}_MODEL; fallback desactivado.`)
    return null
  }
  return config
}

/**
 * Falla rápido si el proveedor primario no está configurado, ANTES de gastar
 * red o tiempo en el scrape. El orquestador llama a esto en vez de conocer los
 * nombres concretos de las variables.
 * @returns {{provider:string, model:string}} descriptor para logging
 */
export function assertLlmConfigured() {
  const primaryName = resolvePrimaryName()
  const config = resolveConfig(primaryName)
  if (!config) {
    const prefix = primaryName.toUpperCase()
    throw new Error(
      `Falta ${prefix}_API_KEY o ${prefix}_MODEL en el entorno (el modelo no se hardcodea).`,
    )
  }
  return { provider: config.provider, model: config.model }
}

/**
 * Construye los mensajes system/user para el LLM.
 *
 * El cuerpo full (`body`) lo provee el autor en `bodyLang`; el adapter NUNCA
 * lo inventa ni lo scrapea. Su trabajo es:
 *   - copiar verbatim el cuerpo en `content.<bodyLang>`,
 *   - traducirlo fielmente en `content.<otherLang>`,
 *   - derivar blurb/title/tag/cat/read a partir de ese cuerpo.
 *
 * @param {{ ogTitle:string, ogDescription:string, body:string, bodyLang:'es'|'en', samples:Array }} input
 */
function buildPrompt({ ogTitle, ogDescription, body, bodyLang, samples }) {
  const otherLang = bodyLang === 'es' ? 'en' : 'es'

  const system = [
    'Eres asistente editorial de FinancialQ Group (Global Corporate Finance).',
    'Escribes contenido bilingüe (español/inglés) de comentario de mercado:',
    'sobrio, analítico, sin promesas comerciales, imitando el estilo de los ejemplos.',
    'Devuelve EXCLUSIVAMENTE un objeto JSON válido. Sin markdown, sin texto fuera del JSON.',
  ].join(' ')

  const schema = `{
  "es": { "tag": "string", "title": "string", "body": "string", "content": "string (markdown)" },
  "en": { "tag": "string", "title": "string", "body": "string", "content": "string (markdown)" },
  "cat": "opinion | newsletter",
  "read": "string (p. ej. \\"2 min\\")"
}`

  const user = [
    'Ejemplos del estilo existente (para inferir tono, longitud y formato del body):',
    JSON.stringify(samples, null, 2),
    '',
    `Cuerpo del artículo (markdown), escrito por el autor en "${bodyLang}":`,
    '<<<BODY',
    body,
    'BODY',
    '',
    'Metadatos del enlace original (LinkedIn Pulse), solo como contexto auxiliar:',
    `og:title: ${ogTitle}`,
    `og:description: ${ogDescription}`,
    '',
    'Reglas:',
    `- "content.${bodyLang}": devuelve el cuerpo recibido EXACTAMENTE, carácter por carácter, sin reescribir, resumir ni reordenar. Conserva el markdown tal cual.`,
    `- "content.${otherLang}": traducción fiel y COMPLETA del cuerpo al otro idioma, preservando la estructura markdown (encabezados, listas, énfasis, enlaces).`,
    '- "body" en español e inglés: blurb de 1 oración (~40 palabras) que resuma el cuerpo con el patrón "Cómo X —en lugar de Y— logra Z".',
    '- "title": titula el artículo de forma natural en cada idioma (apóyate en el cuerpo y el og:title; no traducción literal forzada).',
    '- "tag": "Comentario de Mercado" (es) / "Market Commentary" (en), salvo que el tema sugiera otro coherente con los ejemplos.',
    '- "cat": "opinion" o "newsletter" según el tipo de pieza.',
    '- "read": estima el tiempo de lectura del cuerpo completo ("2 min", "5 min", etc.).',
    '',
    `Devuelve solo JSON con esta forma exacta:\n${schema}`,
  ].join('\n')

  return { system, user }
}

/**
 * Transporte Gemini (API nativa). responseMimeType fuerza JSON válido, así que
 * parseJsonLoose queda como red de seguridad y no como necesidad.
 * @returns {Promise<string>} texto crudo del modelo
 */
async function callGemini(config, system, user) {
  const url = `${config.baseUrl}/models/${encodeURIComponent(config.model)}:generateContent`

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'x-goog-api-key': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
    })
  } catch (err) {
    throw new ProviderUnavailableError(describeFetchError(err, config))
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new ProviderUnavailableError(`HTTP ${res.status} ${res.statusText}. ${detail.slice(0, 500)}`)
  }

  const data = await res.json()

  const blockReason = data?.promptFeedback?.blockReason
  if (blockReason) throw new ProviderUnavailableError(`prompt bloqueado (${blockReason})`)

  const candidate = data?.candidates?.[0]
  const parts = candidate?.content?.parts
  const text = Array.isArray(parts) ? parts.map((p) => p?.text ?? '').join('') : ''

  if (!text.trim()) {
    // finishReason explica el vacío (MAX_TOKENS, SAFETY, RECITATION...).
    throw new ProviderUnavailableError(
      `respuesta vacía (finishReason: ${candidate?.finishReason ?? 'desconocido'})`,
    )
  }

  // Truncar por límite de tokens produce JSON incompleto; avisarlo aquí evita
  // que el síntoma aparezca como "Unexpected end of JSON input".
  if (candidate?.finishReason === 'MAX_TOKENS') {
    console.warn('⚠ Gemini cortó la respuesta por MAX_TOKENS: el JSON puede venir incompleto.')
  }

  return text
}

/**
 * Transporte OpenAI (Chat Completions). Se conserva como alterna/fallback.
 * @returns {Promise<string>} texto crudo del modelo
 */
async function callOpenAI(config, system, user) {
  let res
  try {
    res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
    })
  } catch (err) {
    throw new ProviderUnavailableError(describeFetchError(err, config))
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new ProviderUnavailableError(`HTTP ${res.status} ${res.statusText}. ${detail.slice(0, 500)}`)
  }

  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text || !String(text).trim()) {
    throw new ProviderUnavailableError('respuesta sin contenido en choices[0].message.content')
  }
  return String(text)
}

function callProvider(config, system, user) {
  return config.provider === 'gemini'
    ? callGemini(config, system, user)
    : callOpenAI(config, system, user)
}

/**
 * Genera el contenido bilingüe del post a partir del cuerpo del autor + los
 * metadatos OG + ejemplos de estilo. Contrato estable que el orquestador
 * consume. El cuerpo full siempre lo provee el autor (`input.body`); el adapter
 * no lo scrapea.
 * @param {{ ogTitle:string, ogDescription:string, body:string, bodyLang:'es'|'en', samples:Array }} input
 * @returns {Promise<object>} JSON parseado: { es, en, cat, read } con content por idioma
 */
export async function summarize(input) {
  const primaryName = resolvePrimaryName()
  const primary = resolveConfig(primaryName)
  if (!primary) {
    const prefix = primaryName.toUpperCase()
    throw new Error(`Falta ${prefix}_API_KEY o ${prefix}_MODEL en el entorno (el modelo no se hardcodea).`)
  }
  const fallback = resolveFallback(primaryName)

  const { system, user } = buildPrompt(input)

  let content
  try {
    content = await callProvider(primary, system, user)
  } catch (err) {
    if (!(err instanceof ProviderUnavailableError)) throw err

    if (!fallback) {
      throw new Error(`${primary.provider} no disponible: ${err.message}`)
    }

    console.warn(`⚠ ${primary.provider} no disponible (${err.message}); reintentando con ${fallback.provider}.`)
    try {
      content = await callProvider(fallback, system, user)
    } catch (fallbackErr) {
      throw new Error(
        `Ambos proveedores fallaron — ${primary.provider}: ${err.message} | ${fallback.provider}: ${fallbackErr.message}`,
      )
    }
  }

  try {
    return parseJsonLoose(content)
  } catch (err) {
    throw new Error(
      `No se pudo parsear el JSON del LLM: ${err.message}\n--- contenido recibido ---\n${content.slice(0, 800)}`,
    )
  }
}
