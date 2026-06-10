// Adapter LLM aislado (Dependency Inversion).
//
// El orquestador (ingest-post.mjs) depende SOLO de la función `summarize()`,
// no del proveedor concreto. Para cambiar de proveedor, se reescribe este
// archivo sin tocar el orquestador.
//
// Implementación actual: OpenAI Chat Completions vía fetch nativo (Node 18+),
// sin dependencias. El modelo se lee de OPENAI_MODEL (no se hardcodea).

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

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
 * Construye los mensajes system/user para el LLM.
 * @param {{ ogTitle:string, ogDescription:string, samples:Array }} input
 */
function buildPrompt({ ogTitle, ogDescription, samples }) {
  const system = [
    'Eres asistente editorial de FinancialQ Group (Global Corporate Finance).',
    'Escribes blurbs bilingües (español/inglés) de comentario de mercado:',
    'sobrios, analíticos, sin promesas comerciales, imitando el estilo de los ejemplos.',
    'Devuelve EXCLUSIVAMENTE un objeto JSON válido. Sin markdown, sin texto fuera del JSON.',
  ].join(' ')

  const schema = `{
  "es": { "tag": "string", "title": "string", "body": "string" },
  "en": { "tag": "string", "title": "string", "body": "string" },
  "cat": "opinion | newsletter",
  "read": "string (p. ej. \\"2 min\\")"
}`

  const user = [
    'Ejemplos del estilo existente (para inferir tono, longitud y formato del body):',
    JSON.stringify(samples, null, 2),
    '',
    'Artículo nuevo (LinkedIn Pulse):',
    `og:title: ${ogTitle}`,
    `og:description: ${ogDescription}`,
    '',
    'Reglas:',
    '- "body" en español e inglés con el patrón "Cómo X —en lugar de Y— logra Z" (1 oración, ~40 palabras).',
    '- "title": reescribe el og:title de forma natural en cada idioma (no traducción literal forzada).',
    '- "tag": "Comentario de Mercado" (es) / "Market Commentary" (en), salvo que el tema sugiera otro coherente con los ejemplos.',
    '- "cat": "opinion" o "newsletter" según el tipo de pieza.',
    '- "read": estima el tiempo de lectura ("2 min" para un blurb corto).',
    '',
    `Devuelve solo JSON con esta forma exacta:\n${schema}`,
  ].join('\n')

  return { system, user }
}

/**
 * Genera el contenido bilingüe del post a partir de los metadatos OG + ejemplos
 * de estilo. Contrato estable que el orquestador consume.
 * @param {{ ogTitle:string, ogDescription:string, samples:Array }} input
 * @returns {Promise<object>} JSON parseado: { es, en, cat, read }
 */
export async function summarize(input) {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL
  if (!apiKey) throw new Error('Falta OPENAI_API_KEY en el entorno.')
  if (!model) throw new Error('Falta OPENAI_MODEL en el entorno (no se hardcodea el modelo).')

  const { system, user } = buildPrompt(input)

  let res
  try {
    res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    })
  } catch (err) {
    throw new Error(`Error de red llamando a OpenAI: ${err.message}`)
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`OpenAI respondió ${res.status} ${res.statusText}. ${detail.slice(0, 500)}`)
  }

  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Respuesta de OpenAI sin contenido en choices[0].message.content.')
  }

  try {
    return parseJsonLoose(content)
  } catch (err) {
    throw new Error(
      `No se pudo parsear el JSON del LLM: ${err.message}\n--- contenido recibido ---\n${content.slice(0, 800)}`,
    )
  }
}
