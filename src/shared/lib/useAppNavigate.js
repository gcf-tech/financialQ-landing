import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../config/locales/i18nContext'
import { ROUTE_SLUGS } from '../config/routes'

/**
 * Construye el pathname de una página a partir de claves internas.
 * buildPath('en', 'sobre', 'firma') → '/about/firm'
 */
export function buildPath(lang, page, sub = null) {
  if (page === 'inicio') return '/'
  const slugs = ROUTE_SLUGS[lang] ?? ROUTE_SLUGS.en
  const base = `/${slugs[page] ?? page}`
  return sub ? `${base}/${slugs[sub] ?? sub}` : base
}

/**
 * Devuelve el href de una página en el idioma activo, para pintar enlaces
 * reales (<a href>) que los crawlers puedan seguir.
 * Uso: const href = useAppPath(); <a href={href('sobre', 'firma')}>…</a>
 */
export function useAppPath() {
  const { lang } = useTranslation()
  return (page, sub = null) => buildPath(lang, page, sub)
}

/**
 * Wrapper sobre useNavigate que:
 * - Traduce claves internas (page, sub) a slugs URL según el idioma activo
 * - Hace scroll al top en cada navegación
 */
export function useAppNavigate() {
  const { lang } = useTranslation()
  const navigate = useNavigate()

  return (page, sub = null) => {
    navigate(buildPath(lang, page, sub))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
