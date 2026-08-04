import { useState } from 'react'
import { useTranslation } from '../../config/locales/i18nContext'
import { translatePath } from '../../config/routes'
import './LanguagePicker.css'

const FLAG_URLS = {
  en: 'https://flagcdn.com/w80/us.png',
  es: 'https://flagcdn.com/w80/es.png',
}

const LANG_LABELS = {
  en: 'English',
  es: 'Español',
}

const LANGUAGES = ['en', 'es']

export function LanguagePicker() {
  const { lang, setLanguage } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const otherLangs = LANGUAGES.filter(l => l !== lang)

  const handleChange = (newLang) => {
    // Traduce la URL actual al equivalente en el nuevo idioma antes de recargar.
    // e.g. /about/firm → /sobre/firma al cambiar a ES
    const newPath = translatePath(window.location.pathname, lang, newLang)
    setLanguage(newLang)
    window.location.href = newPath
  }

  return (
    <div
      className="lang-picker"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Bandera activa */}
      <div className="lang-current">
        <img src={FLAG_URLS[lang]} alt={LANG_LABELS[lang]} width="44" height="44" />
      </div>

      {/* Opciones — aparecen al hacer hover */}
      <div className={`lang-options${isOpen ? ' open' : ''}`} aria-hidden={!isOpen}>
        {otherLangs.map(l => (
          <button
            key={l}
            title={LANG_LABELS[l]}
            className="lang-option"
            onClick={() => handleChange(l)}
          >
            <img src={FLAG_URLS[l]} alt={LANG_LABELS[l]} width="44" height="44" />
          </button>
        ))}
      </div>
    </div>
  )
}
