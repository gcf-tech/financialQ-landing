import { Footer } from '../../../widgets/footer/Footer'
import { useScrollReveal } from '../../../shared/lib/useScrollReveal'
import { useTranslation } from '../../../shared/config/locales/i18nContext'
import { PageHero } from '../../../shared/ui/pageHero/PageHero'
import { ValueList } from '../../../shared/ui/valueList/ValueList'

export function MissionPage() {
  useScrollReveal()
  const { t } = useTranslation()
  const tm = t.sobre.mision

  return (
    <>
      <PageHero kicker={tm.kicker} heading={tm.heading} headingItalic={tm['heading.italic']} />

      <section className="section">
        <div className="wrap">
          <div className="g2" style={{ marginBottom: 64 }}>
            <div className="card reveal" style={{ background: 'var(--ivory-pale)', border: '1px solid var(--border)', padding: '48px 44px' }}>
              <span className="eyebrow" style={{ marginBottom: 18, display: 'flex' }}>{tm.missionEyebrow}</span>
              <p style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 400, color: 'var(--black)', lineHeight: 1.35 }}>
                {tm.missionText}
              </p>
            </div>
            <div style={{ background: 'var(--blue)', padding: '48px 44px' }} className="reveal d1">
              <span className="eyebrow" style={{ marginBottom: 18, display: 'flex', color: 'rgba(230,223,197,.55)' }}>{tm.visionEyebrow}</span>
              <p style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 400, color: 'var(--ivory)', lineHeight: 1.35 }}>
                {tm.visionText}
              </p>
            </div>
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 24 }}>
            {tm.valuesLabel}
          </div>
          <ValueList items={tm.values} />
        </div>
      </section>

      <Footer variant="mini" />
    </>
  )
}
