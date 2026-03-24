import { Footer } from '../../../widgets/footer/Footer'
import { useScrollReveal } from '../../../shared/lib/useScrollReveal'
import { t } from '../../../shared/config/locales'
import './ui/investmentPhilosophy.css'

const tf = t.enfoque.filosofia

const driverIcons = {
  trend:  <><path d="M2 12 L6 7 L10 9 L14 4"/></>,
  clock:  <><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/></>,
  arrows: <><path d="M8 2v12M4 6l4-4 4 4M4 10l4 4 4-4"/></>,
  plus:   <><path d="M3 8h10M8 3v10"/></>,
}

export function InvestmentPhilosophyPage() {
  useScrollReveal()

  return (
    <div>
      <section className="s-filosofia">

        {/* Statement */}
        <div className="wrap">
          <div className="filo-statement">
            <div className="filo-stmt-left">
              <span className="eyebrow reveal">{tf.statement.eyebrow}</span>
              <h1 className="filo-headline reveal d1">
                {tf.statement.headlineLines.map((line, i) => (
                  <span key={i}>{i === tf.statement.headlineLines.length - 1 ? <em>{line}</em> : line}<br /></span>
                ))}
              </h1>
            </div>
            <div className="filo-stmt-right">
              <div className="filo-three">
                {tf.statement.principles.map((p, i) => (
                  <div key={p.num} className={`filo-principle-big reveal${i > 0 ? ` d${i}` : ''}`}>
                    <div className="filo-p-num">{p.num}</div>
                    <div className="filo-p-word">{p.word}</div>
                    <p className="filo-p-sub">{p.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Convictions */}
        <div className="wrap" style={{ paddingTop: 0 }}>
          <div className="filo-convictions">
            {tf.convictions.map((c, i) => (
              <div key={c.num} className={`filo-conv reveal${i > 0 ? ` d${i}` : ''}`}>
                <div className="filo-conv-n">{c.num}</div>
                <span className="filo-conv-tag">{c.tag}</span>
                <div className="filo-conv-title">{c.title}</div>
                <p className="filo-conv-body">{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Drivers */}
        <div className="filo-drivers">
          <div className="wrap">
            <div className="filo-drivers-inner">
              <div>
                <span className="eyebrow reveal" style={{ color: 'rgba(230,223,197,.45)' }}>{tf.drivers.eyebrow}</span>
                <h2 className="filo-drivers-hed reveal d1">
                  {tf.drivers.heading}<br /><em>{tf.drivers['heading.italic']}</em>
                </h2>
                <p className="filo-drivers-sub reveal d2">{tf.drivers.body}</p>
              </div>
              <div className="filo-driver-list">
                {tf.drivers.items.map((item, i) => (
                  <div key={item.name} className={`filo-driver-item reveal${i > 0 ? ` d${i}` : ''}`}>
                    <div className="filo-driver-icon">
                      <svg viewBox="0 0 16 16">{driverIcons[item.icon]}</svg>
                    </div>
                    <div>
                      <div className="filo-driver-name">{item.name}</div>
                      <p className="filo-driver-desc">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Close */}
        <div className="filo-close">
          <div className="wrap">
            <div className="filo-close-inner">
              <h2 className="filo-close-quote reveal">
                {tf.close.quote} <em>{tf.close['quote.italic']}</em>
              </h2>
              <p className="filo-close-body reveal d1">{tf.close.body}</p>
            </div>
          </div>
        </div>

      </section>
      <Footer variant="mini" />
    </div>
  )
}
