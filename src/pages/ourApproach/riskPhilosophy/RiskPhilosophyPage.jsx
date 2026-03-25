import { Footer } from '../../../widgets/footer/Footer'
import { useScrollReveal } from '../../../shared/lib/useScrollReveal'
import { t } from '../../../shared/config/locales'
import './ui/riskPhilosophy.css'

const tr = t.enfoque.riesgo

export function RiskPhilosophyPage() {
  useScrollReveal()

  const [h1, h2, h3] = tr.hero.headline

  return (
    <div>
      <section className="s-riesgo">
        <div className="rsk-hero">
          <span className="rsk-hero-watermark" aria-hidden>{tr.hero.watermark}</span>
          <div className="wrap">
            <div className="rsk-hero-inner">
              <div>
                <span className="eyebrow reveal">{tr.hero.eyebrow}</span>
                <h1 className="rsk-hero-headline reveal d1">
                  {h1}<br />
                  {h2}<br />
                  <em>{h3}</em>
                </h1>
              </div>
              <div>
                {tr.hero.bodies.map((text, i) => (
                  <p key={i} className={`rsk-hero-body reveal d${i + 1}`}>
                    {text}
                  </p>
                ))}
                <div className="rsk-axiom reveal d3">
                  <p>{tr.hero.axiom}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rsk-dims">
          <div className="wrap">
            <div className="rsk-dims-header">
              <div>
                <span className="eyebrow reveal">{tr.dimensionsIntro.eyebrow}</span>
                <h2 className="rsk-dims-hed reveal d1">
                  {tr.dimensionsIntro.headingBefore}<br />
                  <em>{tr.dimensionsIntro.headingEm}</em>
                </h2>
              </div>
              <p className="rsk-dims-desc reveal d2">{tr.dimensionsIntro.desc}</p>
            </div>
          </div>

          <div className="wrap" style={{ paddingTop: 0 }}>
            <div className="rsk-grid">
              {tr.dimensions.map((dim, i) => (
                <div key={dim.tag} className={`rsk-dim reveal${i > 0 ? ` d${i % 4}` : ''}`}>
                  <div className="rsk-dim-bg">{dim.roman}</div>
                  <span className="rsk-dim-tag">{dim.tag}</span>
                  <div className="rsk-dim-name">{dim.title}</div>
                  <p className="rsk-dim-body">{dim.body}</p>
                  <div className="rsk-dim-example">{dim.example}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rsk-interaction">
          <div className="wrap">
            <div className="rsk-int-inner">
              <div className="rsk-int-item">
                <span className="rsk-int-label" style={{ color: 'var(--blue)' }}>{tr.interaction.left.label}</span>
                <h2 className="rsk-int-quote" style={{ color: 'var(--ivory)' }}>
                  {tr.interaction.left.quoteLines[0]}<br />
                  {tr.interaction.left.quoteLines[1]}
                </h2>
                <p className="rsk-int-body" style={{ color: 'var(--muted)' }}>{tr.interaction.left.body}</p>
              </div>
              <div className="rsk-int-item dark">
                <span className="rsk-int-label" style={{ color: 'black' }}>{tr.interaction.right.label}</span>
                <div className="rsk-principles">
                  {tr.interaction.right.principles.map((p, i) => (
                    <div key={p.num} className={`rsk-prin reveal${i > 0 ? ` d${i}` : ''}`}>
                      <div className="rsk-prin-num">{p.num}</div>
                      <div>
                        <div className="rsk-prin-title">{p.title}</div>
                        <p className="rsk-prin-body">{p.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rsk-final">
          <div className="wrap">
            <div className="rsk-final-inner">
              <h2 className="rsk-final-quote reveal">
                {tr.closing.quote[0]}<br />
                {tr.closing.quote[1]}<br />
                <em>{tr.closing.quote[2]}</em>
              </h2>
              <p className="rsk-final-body reveal d1">{tr.closing.body}</p>
            </div>
          </div>
        </div>
      </section>

      <Footer variant="mini" />
    </div>
  )
}
