import { useState } from 'react'
import { useTranslation } from '../../config/locales/i18nContext'
import { translatePath } from '../../config/routes'
import './LanguagePicker.css'

/**
 * Selector de idioma.
 *
 * Etiquetas de texto (EN / ES), no banderas. Dos motivos, y el segundo es el
 * que obligaba a cambiarlo:
 *
 *  1. Una bandera es un país, no un idioma. El inglés se marcaba con la de
 *     Estados Unidos, que deja fuera a todo el mundo anglófono que no es
 *     estadounidense; y el español con la de España, en un sitio cuyo público
 *     hispanohablante es sobre todo americano.
 *  2. Las imágenes venían de `flagcdn.com`. Al renderizarlas en SSR, React
 *     emitía además un `<link rel="preload" as="image">` hacia ese dominio en
 *     **cada una de las 67 páginas** del build: una petición a un tercero
 *     dentro del render inicial de todo el sitio, en el camino crítico y fuera
 *     de nuestro control. Ya no hay ninguna dependencia externa aquí.
 *
 * Los códigos visibles (EN / ES) salen del propio identificador de idioma: son
 * códigos ISO, iguales en los dos diccionarios, así que no son copy traducible.
 * Lo que sí sale de i18n es todo lo que lee un lector de pantalla.
 */

const LANGUAGES = ['en', 'es']

export function LanguagePicker() {
  const { t, lang, setLanguage } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const tp = t.picker

  const otherLangs = LANGUAGES.filter(l => l !== lang)

  const handleChange = (newLang) => {
    // Traduce la URL actual al equivalente en el nuevo idioma antes de recargar.
    // e.g. /about/firm → /sobre/firma al cambiar a ES
    const newPath = translatePath(window.location.pathname, lang, newLang)
    setLanguage(newLang)
    window.location.href = newPath
  }

  return (
    // El grupo se nombra con el idioma activo ("Idioma actual: español"), que
    // es lo que antes no se anunciaba: el indicador era un <div> con una imagen.
    <div
      className="lang-picker"
      role="group"
      aria-label={tp.current.replace('{lang}', tp.names[lang])}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Idioma activo. Decorativo para la accesibilidad: lo que dice ya está
          en el nombre del grupo, y repetirlo solo añadiría ruido. */}
      <div className="lang-current" aria-hidden="true">
        <span className="lang-code">{lang.toUpperCase()}</span>
      </div>

      {/* Opciones — aparecen al hacer hover o al recibir el foco */}
      <div className={`lang-options${isOpen ? ' open' : ''}`}>
        {otherLangs.map(l => {
          const label = tp.switchTo.replace('{lang}', tp.names[l])
          return (
            <button
              key={l}
              type="button"
              title={label}
              aria-label={label}
              className="lang-option"
              onClick={() => handleChange(l)}
            >
              <span className="lang-code">{l.toUpperCase()}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
