import { Footer } from '../../../widgets/footer/Footer'
import { useScrollReveal } from '../../../shared/lib/useScrollReveal'
import { useTranslation } from '../../../shared/config/locales/i18nContext'
import { PageHero } from '../../../shared/ui/pageHero/PageHero'
import { ValueList } from '../../../shared/ui/valueList/ValueList'

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--blue)" strokeWidth="1.5">
      <path d="M8 2v8M4 7l4 4 4-4M2 12v2h12v-2" />
    </svg>
  )
}

export function GovernancePage() {
  useScrollReveal()
  const { t } = useTranslation()
  const tg = t.governance

  return (
    <div>
      <PageHero kicker={tg.kicker} heading={tg.heading} headingItalic={tg['heading.italic']} />

      <section className="section">
        <div className="wrap">
          <div className="col2 eq reveal">
            <div>
              <span className="eyebrow">{tg.obligationEyebrow}</span>
              <h2 className="display" style={{ fontSize: 'clamp(32px,4vw,48px)', marginTop: 16, marginBottom: 20 }}>
                {tg.obligationHeading}<br /><em>{tg['obligationHeading.italic']}</em>
              </h2>
              <p className="body-copy" style={{ fontSize: 15, marginBottom: 28 }}>{tg.obligationBody}</p>
              {/*<div className="gpill"><div className="gpill-dot" />{tg.pill}</div>*/}
            </div>
            <ValueList items={tg.obligations} delay={1} />
          </div>
        </div>
      </section>

      <section className="section s-alt">
        <div className="wrap">
          <div style={{ textAlign: 'center', maxWidth: 580, margin: '0 auto 56px' }} className="reveal">
            <span className="eyebrow" style={{ justifyContent: 'center', marginBottom: 16 }}>{tg.feeComparison.eyebrow}</span>
            <h2 className="display" style={{ fontSize: 'clamp(30px,4vw,46px)', marginTop: 12 }}>
              {tg.feeComparison.heading}<br /><em>{tg.feeComparison['heading.italic']}</em>
            </h2>
          </div>
          <div className="g2 reveal d1">
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: 44 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#4CAF82', marginBottom: 16 }}>{tg.feeComparison.feeOnly.label}</div>
              <ul className="cc-list" style={{ gap: 10 }}>
                {tg.feeComparison.feeOnly.items.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: 44 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#C0614E', marginBottom: 16 }}>{tg.feeComparison.feeBased.label}</div>
              <ul className="cc-list" style={{ gap: 10 }}>
                {tg.feeComparison.feeBased.items.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section s-wht">
        <div className="wrap">
          <div className="col2 eq reveal">
            <div>
              <span className="eyebrow">{tg.docs.eyebrow}</span>
              <h2 className="display" style={{ fontSize: 'clamp(30px,4vw,44px)', marginTop: 16 }}>
                {tg.docs.heading}<br /><em>{tg.docs['heading.italic']}</em>
              </h2>
              <p className="body-copy" style={{ marginTop: 18 }}>{tg.docs.body}</p>
            </div>
            {/*<div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--border)' }}>
              {tg.docs.items.map(doc => (
                <div
                  key={doc.title}
                  style={{ background: 'var(--white)', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, transition: 'background .2s', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--white)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--white)'}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--black)', marginBottom: 3 }}>{doc.title}</div>
                    <div style={{ fontSize: 12, fontWeight: 300, color: 'var(--muted)' }}>{doc.desc}</div>
                  </div>
                  <DownloadIcon />
                </div>
              ))}
            </div>*/}
          </div>
        </div>
      </section>

      <Footer variant="mini" />
    </div>
  )
}
