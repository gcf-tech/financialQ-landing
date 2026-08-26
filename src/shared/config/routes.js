/**
 * Tabla de slugs de URL por idioma.
 * Las claves son siempre los identificadores internos (español).
 * Los valores son el slug visible en la URL para cada idioma.
 */
export const ROUTE_SLUGS = {
  en: {
    sobre: 'about',
    firma: 'firm',
    equipo: 'team',
    mision: 'mission',
    governance: 'governance',
    enfoque: 'approach',
    filosofia: 'philosophy',
    framework: 'framework',
    proceso: 'process',
    riesgo: 'risk',
    // Mismo slug en los dos idiomas, como `framework` y `governance`: el
    // segmento que revela el idioma es el de la sección, no el de la subpágina.
    presupuesto: 'risk-budget',
    clientes: 'clients',
    perspectivas: 'perspectives',
    contacto: 'contact',
  },
  es: {
    sobre: 'sobre',
    firma: 'firma',
    equipo: 'equipo',
    mision: 'mision',
    governance: 'governance',
    enfoque: 'enfoque',
    filosofia: 'filosofia',
    framework: 'framework',
    proceso: 'proceso',
    riesgo: 'riesgo',
    presupuesto: 'risk-budget',
    clientes: 'clientes',
    perspectivas: 'perspectivas',
    contacto: 'contacto',
  },
}

/** Inverso: slug URL → clave interna, por idioma. */
export const SLUG_TO_KEY = Object.fromEntries(
  Object.entries(ROUTE_SLUGS).map(([lang, map]) => [
    lang,
    Object.fromEntries(Object.entries(map).map(([key, slug]) => [slug, key])),
  ])
)

/**
 * Traduce un pathname de un idioma a otro.
 * translatePath('/about/firm', 'en', 'es') → '/sobre/firma'
 */
export function translatePath(path, fromLang, toLang) {
  const reverse = SLUG_TO_KEY[fromLang]
  const slugs = ROUTE_SLUGS[toLang]
  const parts = path.split('/').filter(Boolean)
  const translated = parts.map(part => slugs[reverse[part] ?? part] ?? part)
  return translated.length > 0 ? '/' + translated.join('/') : '/'
}
