import { Footer } from '../../../widgets/footer/Footer'
import { useScrollReveal } from '../../../shared/lib/useScrollReveal'
import { useTranslation } from '../../../shared/config/locales/i18nContext'
import { PageHero } from '../../../shared/ui/pageHero/PageHero'
import { ValueList } from '../../../shared/ui/valueList/ValueList'

export function FirmPage() {
  useScrollReveal()
  const { t } = useTranslation()
  const tf = t.sobre.firma

  return (
    <>
      <PageHero kicker={tf.kicker} heading={tf.heading} headingItalic={tf['heading.italic']} />

      <section className="section">
        <div className="wrap">
          <div className="col2 reveal">
            <div>
              <span className="eyebrow">{tf.historyEyebrow}</span>
              <h2 className="display" style={{ fontSize: 'clamp(34px,4vw,50px)', marginTop: 18 }}>
                {tf.historyHeading}<br /><em>{tf['historyHeading.italic']}</em>
              </h2>
            </div>
            <div>
              <p className="body-copy" style={{ fontSize: 15, marginBottom: 18 }}>{tf.historyBody1}</p>
              <p className="body-copy" style={{ fontSize: 15, marginBottom: 18 }}>{tf.historyBody2}</p>
              <p className="body-copy" style={{ fontSize: 15 }}>{tf.historyBody3}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section s-alt">
        <div className="wrap">
          <div className="col2 reveal">
            <div>
              <span className="eyebrow">{tf.legalEyebrow}</span>
              <h2 className="display" style={{ fontSize: 'clamp(30px,4vw,46px)', marginTop: 16 }}>
                {tf.legalHeading}<br /><em>{tf['legalHeading.italic']}</em>
              </h2>
              <p className="body-copy" style={{ marginTop: 18, marginBottom: 28 }}>{tf.legalBody}</p>
              <a
                className="gpill gpill--link"
                href={tf.legalPillHref}
                download
                target="_blank"
                rel="noreferrer"
              >
                <div className="gpill-dot" />
                {tf.legalPill}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 1v7M3 6l3 3 3-3M1 10h10" />
                </svg>
              </a>
            </div>
            <ValueList items={tf.items} delay={1} />
          </div>
        </div>
      </section>

      <Footer variant="mini" />
    </>
  )
}
