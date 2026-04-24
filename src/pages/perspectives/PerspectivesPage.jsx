import { useState } from 'react'
import { Footer } from '../../widgets/footer/Footer'
import { Button } from '../../shared/ui/button/Button'
import { useScrollReveal } from '../../shared/lib/useScrollReveal'
import { useTranslation } from '../../shared/config/locales/i18nContext'
import './ui/perspectivesPage.css'

const TABS = [
  { key: 'todos', labelKey: 'all' },
  { key: 'ensayo', labelKey: 'ensayo' },
  { key: 'tecnica', labelKey: 'tecnica' },
  { key: 'carta', labelKey: 'carta' },
]

function FeaturedGeom() {
  return (
    <svg className="persp-feat-geom" viewBox="0 0 120 120" fill="none" aria-hidden>
      <rect x="20" y="20" width="80" height="80" stroke="#3B4C9D" strokeWidth="1" />
      <rect x="35" y="35" width="50" height="50" stroke="#E6DFC5" strokeWidth="0.5" />
      <line x1="20" y1="20" x2="100" y2="100" stroke="#3B4C9D" strokeWidth="0.5" />
      <line x1="100" y1="20" x2="20" y2="100" stroke="#3B4C9D" strokeWidth="0.5" />
      <circle cx="60" cy="60" r="25" stroke="#E6DFC5" strokeWidth="0.5" />
    </svg>
  )
}

function GridArticleRow({ articles, variant, filter }) {
  const visible = articles.filter(a => filter === 'todos' || a.cat === filter)

  if (visible.length === 0) return null

  const gridCls = variant === 'alt' ? 'persp-grid-alt' : 'persp-grid'
  const cardCls = variant === 'alt' ? 'persp-article-alt' : 'persp-article'

  return (
    <div className={gridCls}>
      {visible.map((item, i) => (
        <div key={item.title} className={`${cardCls} reveal${i > 0 ? ` d${i % 4}` : ''}`} role="article">
          <span className="persp-article-type">{item.tag}</span>
          <div className="persp-article-title">{item.title}</div>
          <p className="persp-article-excerpt">{item.body}</p>
          <div className="persp-article-footer">
            <span className="persp-article-date">{item.date}</span>
            <span className="persp-article-read">{item.read}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function PerspectivesPage() {
  const [filter, setFilter] = useState('todos')
  useScrollReveal()
  const { t } = useTranslation()
  const tp = t.perspectivas

  const [h1, h2, h3] = tp.intro.headline
  const [n1, n2, n3] = tp.newsletter.headline

  return (
    <div>
      <section className="s-perspectives">
        <div className="wrap">
          <div className="persp-header">
            <div>
              <span className="eyebrow reveal">{tp.intro.eyebrow}</span>
              <h1 className="persp-headline reveal d1">
                {h1}<br />
                {h2}<br />
                <em>{h3}</em>
              </h1>
            </div>
            <div>
              <p className="persp-lead reveal d1">{tp.intro.lead}</p>
              <div className="persp-focus reveal d2">
                {tp.intro.focusItems.map(text => (
                  <div key={text} className="persp-focus-item">{text}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="persp-filters">
            {TABS.filter(tab => tab.key === 'todos').map(tab => (
              <div
                key={tab.key}
                className={`persp-filter${filter === tab.key ? ' active' : ''}`}
                onClick={() => setFilter(tab.key)}
                role="tab"
                aria-selected={filter === tab.key}
              >
                {tp.tabs[tab.labelKey]}
              </div>
            ))}
          </div>
        </div>

        <div className="wrap" style={{ paddingTop: 0 }}>
          <div className="persp-featured">
            {/*<div className="persp-feat-img">
              <div className="persp-feat-img-inner" />
              <div className="persp-feat-img-grid" />
              <div className="persp-feat-badge">
                <span>{tp.featured.badge}</span>
              </div>
              <FeaturedGeom />
            </div>*/}
            <div className="persp-feat-content" style={{ gridColumn: '1 / -1' }}>
              <span className="persp-feat-type">{tp.featured.articleType}</span>
              <h2 className="persp-feat-title reveal">{tp.featured.title}</h2>
              <p className="persp-feat-excerpt reveal d1">{tp.featured.excerpt}</p>
              <div className="persp-feat-meta reveal d2">
                <span className="persp-meta-date">{tp.featured.date}</span>
                <div className="persp-meta-sep" />
                <span className="persp-meta-read">{tp.featured.readTime}</span>
              </div>
              <div className="persp-feat-cta reveal d2">
                <a
                  //href="/docs/Global-Market-Outlook.pdf"
                  //download="Global-Market-Outlook.pdf"
                  style={{ textDecoration: 'none' }}
                >
                  <Button variant="ghost" style=
                    {{
                      color: 'var(--ivory)',
                      borderColor: 'var(--border)',
                      borderWidth: 'thin',
                      backgroundColor: 'transparent'
                    }}>
                    {tp.featured.readCta}
                    <svg viewBox="0 0 12 12" style={{ fill: 'var(--ivory)' }}><path d="M1 6h10M6 1l5 5-5 5" /></svg>
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/*<div className="wrap" style={{ paddingTop: 0 }}>
          <GridArticleRow articles={tp.gridRow1} variant="default" filter={filter} />
          <GridArticleRow articles={tp.gridRow2} variant="alt" filter={filter} />
        </div>*/}

        <div className="persp-about">
          <div className="wrap">
            <div className="persp-about-inner">
              <div>
                <span className="eyebrow reveal">{tp.about.eyebrow}</span>
                <h2 className="persp-about-hed reveal d1">
                  {tp.about.headline.line1}<br />
                  {tp.about.headline.line2Prefix}<em>{tp.about.headline.line2Em}</em>
                </h2>
                <p className="persp-about-body reveal d2">{tp.about.body}</p>
              </div>
              <div className="persp-themes">
                {tp.about.themes.map((text, i) => (
                  <div key={text} className={`persp-theme reveal${i > 0 ? ` d${Math.min(i, 4)}` : ''}`}>
                    <div className="persp-theme-dot" />
                    <span className="persp-theme-text">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="persp-newsletter">
          <div className="wrap">
            <div className="persp-nl-inner">
              <div>
                <span className="eyebrow reveal">{tp.newsletter.eyebrow}</span>
                <h2 className="persp-nl-hed reveal d1">
                  {n1}<br />
                  {n2}<br />
                  <em>{n3}</em>
                </h2>
                <p className="persp-nl-body reveal d2">{tp.newsletter.body}</p>
              </div>
              <form
                className="persp-nl-form reveal d1"
                onSubmit={e => e.preventDefault()}
              >
                <div>
                  <label className="persp-nl-label" htmlFor="persp-nl-email">{tp.newsletter.emailLabel}</label>
                  <input id="persp-nl-email" className="persp-nl-input" type="email" placeholder={tp.newsletter.emailPlaceholder} autoComplete="email" />
                </div>
                <div>
                  <label className="persp-nl-label" htmlFor="persp-nl-name">{tp.newsletter.nameLabel}</label>
                  <input id="persp-nl-name" className="persp-nl-input" type="text" placeholder={tp.newsletter.namePlaceholder} autoComplete="name" />
                </div>
                <div className="persp-nl-submit">
                  <Button variant="solid">{tp.newsletter.btn}</Button>
                </div>
                <p className="persp-nl-disclaimer">{tp.newsletter.disclaimer}</p>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer variant="mini" />
    </div>
  )
}
