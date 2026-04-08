import { Footer } from '../../widgets/footer/Footer'
import { Button } from '../../shared/ui/button/Button'
import { useScrollReveal } from '../../shared/lib/useScrollReveal'
import { useAppNavigate } from '../../shared/lib/useAppNavigate'
import { useTranslation } from '../../shared/config/locales/i18nContext'
import './ui/customerPage.css'

export function CustomerPage() {
  useScrollReveal()
  const { t } = useTranslation()
  const tc = t.clientes
  const navigate = useAppNavigate()

  const [h1, h2, h3] = tc.intro.headline
  const [cg1, cg2, cg3] = tc.commonGround.heading
  const [w1, w2, w3] = tc.welcome.heading

  return (
    <div>
      <section className="s-customer">
        <div className="wrap cli-intro-wrap">
          <div className="cli-intro">
            <div>
              <span className="eyebrow reveal">{tc.intro.eyebrow}</span>
              <h1 className="cli-headline reveal d1">
                {h1}<br />
                {h2}<br />
                <em>{h3}</em>
              </h1>
            </div>
            <div className="cli-intro-common">
              <p className="cli-lead reveal d1">{tc.intro.lead}</p>
              <div className="cli-common reveal d2">
                <p>
                  <strong>{tc.intro.commonStrong}</strong>
                  {tc.intro.commonRest}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--white)' }}>
          <div className="wrap" style={{ paddingTop: 0 }}>
            <div className="cli-profiles">
              {tc.profiles.map((p, i) => (
                <div key={p.tag} className={`cli-profile reveal${i > 0 ? ` d${i % 4}` : ''}`}>
                  <div className="cli-profile-n">{p.roman}</div>
                  <span className="cli-profile-tag">{p.tag}</span>
                  <div className="cli-profile-title">{p.title}</div>
                  <p className="cli-profile-body">{p.body}</p>
                  <div className="cli-profile-traits">
                    {p.traits.map(trait => (
                      <div key={trait} className="cli-trait">{trait}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cli-common-ground">
          <div className="wrap">
            <div className="cli-cg-inner">
              <div>
                <span className="eyebrow reveal">{tc.commonGround.eyebrow}</span>
                <h2 className="cli-cg-hed reveal d1">
                  {cg1}<br />
                  {cg2}<br />
                  <em>{cg3}</em>
                </h2>
                <p className="cli-cg-sub reveal d2">{tc.commonGround.sub}</p>
              </div>
              <div className="cli-shared">
                {tc.commonGround.shared.map((item, i) => (
                  <div key={item.num} className={`cli-shared-item reveal${i > 0 ? ` d${i % 4}` : ''}`}>
                    <div className="cli-shared-num">{item.num}</div>
                    <div className="cli-shared-title">{item.title}</div>
                    <p className="cli-shared-body">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="cli-welcome">
          <div className="wrap">
            <div className="cli-welcome-inner">
              <div>
                <span className="eyebrow reveal">{tc.welcome.eyebrow}</span>
                <h2 className="cli-welcome-hed reveal d1">
                  {w1}<br />
                  {w2}<br />
                  <em>{w3}</em>
                </h2>
                <p className="cli-welcome-body reveal d2">{tc.welcome.body}</p>
              </div>
              <div className="cli-types">
                {tc.welcome.types.map((row, i) => (
                  <div key={row.name} className={`cli-type reveal${i > 0 ? ` d${i % 4}` : ''}`}>
                    <div className="cli-type-name">{row.name}</div>
                    <div className="cli-type-tag">{row.tag}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="cli-cta">
          <div className="wrap">
            <div className="cli-cta-inner">
              <h2 className="cli-cta-text reveal">
                {tc.cta.headingBefore}<br />
                <em>{tc.cta.headingEm}</em>
              </h2>
              <Button variant="ivory" className="reveal d1" onClick={() => navigate('contacto')}>
                {tc.cta.btn}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer variant="mini" />
    </div>
  )
}
