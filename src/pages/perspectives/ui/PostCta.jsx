import { useTranslation } from '../../../shared/config/locales/i18nContext'
import { useAppNavigate, useAppPath } from '../../../shared/lib/useAppNavigate'
import { CAPTURE_INSTRUMENTS, POST_CAPTURE_INSTRUMENT } from '../../../shared/config/capture'
import { FIRM_PRINCIPAL } from '../../../shared/config/firm'

/**
 * Bloque de cierre del detalle de post: la oferta de conversación.
 *
 * Nada de lo que pinta está escrito aquí. El instrumento —destino, copy y
 * prefijo de atribución— sale de `shared/config/capture.js`, el texto de los
 * diccionarios y el nombre de `shared/config/firm.js`. Cambiar de instrumento
 * es cambiar `POST_CAPTURE_INSTRUMENT`, no este archivo.
 *
 * @param {{ slug: string }} props slug del artículo de origen, para la atribución
 */

/** Resuelve una clave de diccionario con puntos ('a.b.c') sobre el objeto `t`. */
function fromDict(t, key) {
  return key.split('.').reduce((node, part) => node?.[part], t)
}

export function PostCta({ slug }) {
  const { t, lang } = useTranslation()
  const href = useAppPath()
  const go = useAppNavigate()

  const instrument = CAPTURE_INSTRUMENTS[POST_CAPTURE_INSTRUMENT]
  const label = fromDict(t, lang === 'es' ? instrument.labelEs : instrument.labelEn)
    ?.replace('{name}', FIRM_PRINCIPAL.name)

  // Sin copy no se pinta un botón vacío: es preferible que falte el bloque a
  // que el artículo cierre con un rectángulo azul sin texto.
  if (!label) return null

  // Atribución de origen. Viaja en el href (lo que ve un rastreador y lo que
  // se copia al abrir en pestaña nueva) y en la navegación SPA, que es por
  // donde pasa casi todo el mundo.
  const search = '?' + new URLSearchParams({
    source: `${instrument.source}-${slug}`,
    locale: lang,
  })

  // Patrón de navegación interna de CLAUDE.md §4: ancla real + preventDefault.
  // Ctrl/cmd/shift-click y el botón central se dejan pasar — son "abrir en
  // pestaña nueva" y ahí el <a> tiene que comportarse como un <a>.
  const onClick = e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    go(instrument.href, null, search)
  }

  return (
    <aside className="wrap post-cta reveal" data-instrument={instrument.id}>
      <a
        className="btn-solid post-cta-link"
        href={href(instrument.href, null, search)}
        onClick={onClick}
      >
        {label}
      </a>
    </aside>
  )
}
