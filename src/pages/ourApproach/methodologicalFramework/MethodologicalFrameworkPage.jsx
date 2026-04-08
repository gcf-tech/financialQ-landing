import { Footer } from '../../../widgets/footer/Footer'
import { Card } from '../../../shared/ui/cards/Card'
import { useScrollReveal } from '../../../shared/lib/useScrollReveal'
import { useTranslation } from '../../../shared/config/locales/i18nContext'

export function MethodologicalFrameworkPage() {
  useScrollReveal()
  const { t } = useTranslation()
  const tf = t.enfoque.framework

  return (
    <div>
      <section className="section s-dk" style={{ paddingTop: 'calc(var(--gap) + 24px)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 55% 60% at 80% 20%,rgba(59,76,157,.2) 0%,transparent 65%),repeating-linear-gradient(0deg,transparent,transparent 71px,rgba(255,255,255,.02) 71px,rgba(255,255,255,.02) 72px)', pointerEvents: 'none' }} />
        <div className="wrap" style={{ position: 'relative', zIndex: 1 }}>
          <span className="eyebrow lt" style={{ marginBottom: 20, display: 'flex' }}>{tf.eyebrow}</span>
          <h1 className="display lt" style={{ fontSize: 'clamp(40px,6vw,76px)' }}>
            {tf.heading}<br /><span style={{ color: 'rgba(230,223,197,.35)' }}>{tf['heading.sup']}</span>
          </h1>
          <p className="body-copy" style={{ color: 'rgba(255,255,255,.35)', fontSize: 16, maxWidth: 560, marginTop: 22 }}>
            {tf.body}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="g2">
            {tf.pillars.map((p, i) => (
              <Card key={p.num} className={`reveal${i > 0 ? ` d${i}` : ''}`} style={{ padding: '52px 44px' }}>
                <div className="pnum">{p.num}</div>
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--black)', marginBottom: 12 }}>{p.title}</h3>
                <p className="body-copy">{p.body}</p>
                <div style={{ marginTop: 22, paddingTop: 22, borderTop: '1px solid var(--border)', fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>{p.deliverables.label}</div>
                <ul className="cc-list">
                  {p.deliverables.items.map(item => <li key={item}>{item}</li>)}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer variant="mini" />
    </div>
  )
}
