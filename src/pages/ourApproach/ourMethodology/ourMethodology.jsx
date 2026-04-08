import { Footer } from '../../../widgets/footer/Footer'
import { useScrollReveal } from '../../../shared/lib/useScrollReveal'
import { useTranslation } from '../../../shared/config/locales/i18nContext'
import './ui/ourMethodology.css'

export function OurMethodologyPage() {
  useScrollReveal()
  const { t } = useTranslation()
  const tp = t.enfoque.proceso

  return (
    <div>
      <section className="s-proceso">
        <div className="wrap">
          <div className="proc-header">
            <div>
              <span className="eyebrow reveal">{tp.header.eyebrow}</span>
              <h1 className="proc-headline reveal d1">
                {tp.header.headlineLines[0]}<br />
                {tp.header.headlineLines[1]}<br />
                <em>{tp.header.headlineLines[2]}</em>
              </h1>
            </div>
            <div>
              <p className="proc-lead reveal d1">{tp.header.lead}</p>
              <div className="proc-framework-tag reveal d2">
                <div className="proc-dot" />
                <span>{tp.header.frameworkTag}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="wrap" style={{ paddingTop: 0 }}>
          <div className="proc-steps">
            {tp.steps.map((step, i) => (
              <div key={step.num} className={`proc-step reveal${i > 0 ? ` d${i}` : ''}${i === 2 ? ' proc-step--centered' : ''}`}>
                <div className="proc-step-num">{step.num}</div>
                <div className="proc-step-top">
                  <div className="proc-step-tag">{step.tag}</div>
                  <div className="proc-step-title">{step.title}</div>
                  <p className="proc-step-body">{step.body}</p>
                </div>
                <div className="proc-step-detail">
                  <div className="proc-detail-label">{step.detailLabel}</div>
                  {step.detailItems.map(item => (
                    <div key={item} className="proc-detail-item">{item}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="proc-monitor">
          <div className="wrap">
            <div className="proc-monitor-inner">
              <div className="proc-monitor-left">
                <span className="eyebrow reveal" style={{ color: 'rgba(230,223,197,.45)' }}>
                  {tp.monitoring.eyebrow}
                </span>
                <h2 className="reveal d1">
                  {tp.monitoring.heading}<br />
                  {tp.monitoring['heading.mid']}<br />
                  <em>{tp.monitoring['heading.italic']}</em>
                </h2>
                <p className="reveal d2">{tp.monitoring.body}</p>
              </div>
              <div className="proc-monitor-right">
                {tp.monitoring.items.map((item, i) => (
                  <div key={item.title} className={`proc-mon-item reveal${i > 0 ? ` d${i}` : ''}`}>
                    <div className="proc-mon-icon">{item.icon}</div>
                    <div className="proc-mon-title">{item.title}</div>
                    <p className="proc-mon-body">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="proc-cta">
          <div className="wrap">
            <div className="proc-cta-inner">
              <h2 className="proc-cta-text reveal">
                {tp.cta.heading}<br />
                {tp.cta['heading.mid']} <em>{tp.cta['heading.italic']}</em>.
              </h2>
              <div className="btn-solid reveal d1">{tp.cta.button}</div>
            </div>
          </div>
        </div>
      </section>

      <Footer variant="mini" />
    </div>
  )
}
