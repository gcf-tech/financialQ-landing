import './Hero.css'
// import horizonteIcon from '../../assets/icons/horizonte.png' // usado solo por la hero-card (comentada)
import { Button } from '../../shared/ui/button/Button'
import { useTranslation } from '../../shared/config/locales/i18nContext'
import { useAppNavigate } from '../../shared/lib/useAppNavigate'

export function Hero() {
  const { t } = useTranslation()
  const navigate = useAppNavigate()

  return (
    <>
      <section id="hero">
        <div className="hero-top">
          <div className="hero-bg">
            <div className="hero-bg-img" />
            <div className="hero-bg-wash" />
          </div>

          <div className="hero-body">
            <div className="hero-sup">
              <div className="hero-sup-line" />
              {t.hero.eyebrow}
              <div className="hero-sup-line" />
            </div>

            <h1 className="hero-h1">
              {t.hero.heading}<br /><em>{t.hero['heading.italic']}</em><br />{t.hero.heading2}
            </h1>
            <p className="hero-sub">{t.hero.subtitle}</p>

            <div className="hero-rule" />

            <p className="hero-desc">{t.hero.description}</p>

            <div className="hero-btns">
              <Button variant="solid" onClick={() => navigate('contacto')}>{t.hero.ctaPrimary}</Button>
              <Button variant="ghost" className="hero-ghost" onClick={() => navigate('enfoque')}>
                {t.hero.ctaSecondary}{' '}
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" >
                  <path d="M4 1l5 5-5 5" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Card flotante del hero — oculta a pedido. Descomentar para restaurar.
          <aside className="hero-card">
            <img className="hero-card-icon" src={horizonteIcon} alt="" aria-hidden="true" />
            <div className="hero-card-body">
              <p className="hero-card-label">{t.hero.card.label}</p>
              <p className="hero-card-title">{t.hero.card.title}</p>
              <p className="hero-card-text">{t.hero.card.text}</p>
            </div>
          </aside>
          */}
        </div>

        <div className="hero-tags">
          {t.hero.tags.map((tag, i) => (
            <span key={i}>
              {i > 0 && <span className="h-tag-sep" />}
              <span className="h-tag">{tag}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Marquee bar */}
      <div className="mbar">
        <div className="mtrack">
          {[...t.marquee.items, ...t.marquee.items].map((item, i) => (
            <div key={i} className="mitem">{item}</div>
          ))}
        </div>
      </div>
    </>
  )
}
