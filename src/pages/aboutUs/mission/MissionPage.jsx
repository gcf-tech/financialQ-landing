import { Footer } from '../../../widgets/footer/Footer'
import { useScrollReveal } from '../../../shared/lib/useScrollReveal'
import { t } from '../../../shared/config/locales'

const tm = t.sobre.mision

export function MissionPage() {
  useScrollReveal()

  return (
    <>
      <div className="pg-hero">
        <div className="pg-hero-bg" />
        <div className="wrap" style={{ position: 'relative', zIndex: 1 }}>
          <div className="pg-kicker">{tm.kicker}</div>
          <h1 className="pg-title">{tm.heading}<br /><em>{tm['heading.italic']}</em></h1>
        </div>
      </div>

      <section className="section">
        <div className="wrap">
          <div className="g2" style={{ marginBottom: 64 }}>
            <div className="card reveal" style={{ border: '1px solid var(--border)', padding: '48px 44px' }}>
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
          <div className="vlist reveal">
            {tm.values.map(v => (
              <div key={v.num} className="vitem">
                <div className="v-num">{v.num}</div>
                <div><div className="v-title">{v.title}</div><div className="v-body">{v.body}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer variant="mini" />
    </>
  )
}
