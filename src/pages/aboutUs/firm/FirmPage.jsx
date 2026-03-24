import { Footer } from '../../../widgets/footer/Footer'
import { useScrollReveal } from '../../../shared/lib/useScrollReveal'
import { t } from '../../../shared/config/locales'

const tf = t.sobre.firma

export function FirmPage() {
  useScrollReveal()

  return (
    <>
      <div className="pg-hero">
        <div className="pg-hero-bg" />
        <div className="wrap" style={{ position: 'relative', zIndex: 1 }}>
          <div className="pg-kicker">{tf.kicker}</div>
          <h1 className="pg-title">{tf.heading}<br /><em>{tf['heading.italic']}</em></h1>
        </div>
      </div>

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
              <p className="body-copy" style={{ fontSize: 15 }}>{tf.historyBody2}</p>
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
              <div className="gpill"><div className="gpill-dot" />{tf.legalPill}</div>
            </div>
            <div className="vlist reveal d1">
              {tf.items.map(item => (
                <div key={item.title} className="vitem">
                  <div className="v-num">·</div>
                  <div><div className="v-title">{item.title}</div><div className="v-body">{item.body}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    <Footer variant="mini" />
    </>
  )
}
