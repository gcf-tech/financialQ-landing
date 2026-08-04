import { createContext, useContext, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ROUTE_SLUGS } from '../routes'
import { DEFAULT_LANG } from '../seo'
import en from './en/common.json'
import es from './es/common.json'

const TRANSLATIONS = { en, es }

const I18nContext = createContext(null)

/**
 * Slugs que pueden aparecer como primer segmento de la URL, mapeados a idioma.
 * Solo secciones raíz: los sub-slugs (`framework`, `governance`) coinciden en
 * ambos idiomas y nunca ocupan la primera posición.
 *   { about: 'en', sobre: 'es', approach: 'en', enfoque: 'es', ... }
 */
const SECTION_KEYS = ['sobre', 'enfoque', 'clientes', 'perspectivas', 'contacto']
const SLUG_LANG = Object.fromEntries(
  ['en', 'es'].flatMap(lang => SECTION_KEYS.map(key => [ROUTE_SLUGS[lang][key], lang]))
)

/** Idioma que dicta la URL, o null si la ruta no lo revela (home, /admin). */
function langFromPath(pathname) {
  const first = (pathname || '/').split('/').filter(Boolean)[0]
  return first ? (SLUG_LANG[first] ?? null) : null
}

/**
 * Preferencia guardada, o el idioma por defecto.
 * El guard de localStorage es para el prerender: scripts/prerender.mjs
 * renderiza en Node, donde no existe. Allí siempre gana DEFAULT_LANG, que es
 * justo lo que debe llevar el HTML estático de la home.
 */
function storedLang() {
  if (typeof localStorage === 'undefined') return DEFAULT_LANG
  const stored = localStorage.getItem('lang')
  return stored === 'es' || stored === 'en' ? stored : DEFAULT_LANG
}

export function I18nProvider({ children }) {
  const { pathname } = useLocation()
  const [prefLang, setPrefLang] = useState(storedLang)

  // La URL manda: /sobre es español y /about inglés, pase lo que pase. La
  // preferencia guardada solo decide donde la ruta no revela idioma — es
  // decir, en la home y en las rutas privadas.
  const lang = langFromPath(pathname) ?? prefLang

  const setLanguage = (newLang) => {
    localStorage.setItem('lang', newLang)
    setPrefLang(newLang)
  }

  return (
    <I18nContext.Provider value={{ t: TRANSLATIONS[lang], lang, setLanguage }}>
      {children}
    </I18nContext.Provider>
  )
}

/**
 * Hook para acceder a traducciones y cambiar idioma en runtime.
 * Uso: const { t, lang, setLanguage } = useTranslation()
 */
export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider')
  return ctx
}
