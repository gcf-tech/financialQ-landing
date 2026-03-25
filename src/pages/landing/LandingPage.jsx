import { Hero } from '../../widgets/hero/Hero'
import { Footer } from '../../widgets/footer/Footer'
import { Button } from '../../shared/ui/button/Button'
import { Card } from '../../shared/ui/cards/Card'
import { useScrollReveal } from '../../shared/lib/useScrollReveal'
import { t } from '../../shared/config/locales'

const CLIENT_ICONS = [
  <svg key="0" style={{ width: 38, height: 38, color: 'var(--blue)', opacity: .65, marginBottom: 18 }} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="12" width="32" height="22" rx="1" /><path d="M14 12V9a6 6 0 0 1 12 0v3" /><circle cx="20" cy="23" r="3.5" />
  </svg>,
  <svg key="1" style={{ width: 38, height: 38, color: 'var(--blue)', opacity: .65, marginBottom: 18 }} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="20" cy="20" r="16" /><path d="M20 4a16 16 0 0 1 0 32M4 20h32" /><path d="M9 12c5 3.5 9 5 11 5s6-1.5 11-5M9 28c5-3.5 9-5 11-5s6 1.5 11 5" />
  </svg>,
  <svg key="2" style={{ width: 38, height: 38, color: 'var(--blue)', opacity: .65, marginBottom: 18 }} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 34L20 6l14 28" /><path d="M11 24h18" />
  </svg>,
  <svg key="3" style={{ width: 38, height: 38, color: 'var(--blue)', opacity: .65, marginBottom: 18 }} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 4v10M4 20h10M26 20h10M20 26v10" /><circle cx="20" cy="20" r="7" />
  </svg>,
]

const tl = t.landing

export function LandingPage({ navigate }) {
  useScrollReveal()

  return (
    <div>
      {/* Hero + Marquee */}
      <Hero navigate={navigate} />

      {/* Clientes preview */}
      <section className="section">
        <div className="wrap">
          <div className="col2 reveal" style={{ marginBottom: 56 }}>
            <div>
              <span className="eyebrow">{tl.clients.eyebrow}</span>
              <h2 className="display" style={{ fontSize: 'clamp(38px,5vw,58px)', marginTop: 18 }}>
                {tl.clients.heading}<br /><em>{tl.clients['heading.italic']}</em><br />{tl.clients.heading2}
              </h2>
              <Button variant="ghost" style={{ marginTop: 32 }} onClick={() => navigate('clientes')}>
                {tl.clients.btnViewAll}{' '}
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M1 6h10M6 1l5 5-5 5" />
                </svg>
              </Button>
            </div>
            <div>
              <p className="body-copy" style={{ fontSize: 16, marginBottom: 20 }}>{tl.clients.body1}</p>
              <p className="body-copy" style={{ fontSize: 16 }}>{tl.clients.body2}</p>
            </div>
          </div>

          <div className="g4">
            {tl.clients.cards.map((card, i) => (
              <Card key={i} className={`reveal${i > 0 ? ` d${i}` : ''}`}>
                {CLIENT_ICONS[i]}
                <h4 style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--black)', marginBottom: 9 }}>{card.title}</h4>
                <p className="body-copy" style={{ fontSize: 13 }}>{card.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Framework preview - dark */}
      <section className="section s-dk">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 55% 60% at 80% 20%,rgba(59,76,157,.18) 0%,transparent 65%),repeating-linear-gradient(0deg,transparent,transparent 71px,rgba(255,255,255,.02) 71px,rgba(255,255,255,.02) 72px)', pointerEvents: 'none' }} />
        <div className="wrap" style={{ position: 'relative', zIndex: 1 }}>
          <div className="col2 reveal">
            <div>
              <span className="eyebrow lt">{tl.framework.eyebrow}</span>
              <h2 className="display lt" style={{ fontSize: 'clamp(36px,5vw,56px)', marginTop: 18 }}>
                {tl.framework.heading}
              </h2>
              <p className="body-copy" style={{ color: 'rgba(255,255,255,.36)', marginTop: 20, fontSize: 15 }}>
                {tl.framework.body}
              </p>
              <Button variant="ivory" style={{ marginTop: 32 }} onClick={() => navigate('enfoque', 'framework')}>{tl.framework.btn}</Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'rgba(255,255,255,.06)' }}>
              {tl.framework.pillars.map((p, i) => (
                <Card key={p.num} variant="dark" className={`reveal d${i}`} style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 38, fontWeight: 300, color: 'rgba(230, 223, 197, 0.4)', lineHeight: 1, flexShrink: 0, width: 44 }}>{p.num}</div>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ivory)', marginBottom: 5 }}>{p.title}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 300, color: 'rgba(255,255,255,.3)', lineHeight: 1.65 }}>{p.body}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Perspectivas preview */}
      <section className="section s-wht">
        <div className="wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }} className="reveal">
            <div>
              <span className="eyebrow">{tl.insights.eyebrow}</span>
              <h2 className="display" style={{ fontSize: 'clamp(30px,4vw,46px)', marginTop: 14 }}>{tl.insights.heading}</h2>
            </div>
            <Button variant="ghost" onClick={() => navigate('perspectivas')}>
              {tl.insights.btnAll}{' '}
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 6h10M6 1l5 5-5 5" /></svg>
            </Button>
          </div>
          <div className="g53 reveal d1">
            <div className="il" onClick={() => navigate('perspectivas')}>
              <div className="i-tag bl">{tl.insights.featured.tag}</div>
              <div className="i-ttl" style={{ fontSize: 28, color: 'var(--ivory)' }}>{tl.insights.featured.title}</div>
              <div className="i-body" style={{ color: 'rgba(230,223,197,.52)' }}>{tl.insights.featured.body}</div>
              <div className="i-meta" style={{ color: 'rgba(230,223,197,.3)' }}>{tl.insights.featured.meta}</div>
              <div className="i-arr"><svg viewBox="0 0 12 12"><path d="M1 6h10M6 1l5 5-5 5" /></svg></div>
            </div>
            <div className="ic" onClick={() => navigate('perspectivas')}>
              <div className="i-tag lgt">{tl.insights.card1.tag}</div>
              <div className="i-ttl">{tl.insights.card1.title}</div>
              <div className="i-body">{tl.insights.card1.body}</div>
              <div className="i-meta">{tl.insights.card1.meta}</div>
              <div className="i-arr"><svg viewBox="0 0 12 12"><path d="M1 6h10M6 1l5 5-5 5" /></svg></div>
            </div>
            <div className="ic" onClick={() => navigate('perspectivas')}>
              <div className="i-tag lgt">{tl.insights.card2.tag}</div>
              <div className="i-ttl">{tl.insights.card2.title}</div>
              <div className="i-body">{tl.insights.card2.body}</div>
              <div className="i-meta">{tl.insights.card2.meta}</div>
              <div className="i-arr"><svg viewBox="0 0 12 12"><path d="M1 6h10M6 1l5 5-5 5" /></svg></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section s-alt">
        <div className="wrap">
          <div className="cta-blk reveal">
            <h2>{tl.cta.heading}<br /><em>{tl.cta['heading.italic']}</em></h2>
            <div className="cta-side">
              <Button variant="ivory" onClick={() => navigate('contacto')}>{tl.cta.btn}</Button>
              <div className="cta-note">{tl.cta.note}</div>
            </div>
          </div>
        </div>
      </section>

      <Footer variant="full" navigate={navigate} />
    </div>
  )
}
