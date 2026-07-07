import { useState, useMemo, useEffect, useCallback } from 'react'
import { Footer } from '../../widgets/footer/Footer'
import { Button } from '../../shared/ui/button/Button'
import { useScrollReveal } from '../../shared/lib/useScrollReveal'
import { useAppNavigate } from '../../shared/lib/useAppNavigate'
import { useAdminSession } from '../../shared/lib/useAdminSession'
import { useTranslation } from '../../shared/config/locales/i18nContext'
import { subscribeNewsletter } from '../../shared/api/newsletter'
import { fetchPosts, deletePost } from '../../shared/api/posts'
import './ui/perspectivesPage.css'

const SORT_KEYS = ['newest', 'oldest']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function PerspectivesPage() {
  const navigate = useAppNavigate()
  const { t, lang } = useTranslation()
  const { isAdmin } = useAdminSession()
  const tp = t.perspectivas

  // Posts desde el backend (antes: posts.json empaquetado en el build).
  // reloadKey re-ejecuta el fetch; el estado solo se muta en callbacks async
  // o en handlers de eventos (regla react-hooks/set-state-in-effect).
  const [posts, setPosts] = useState([])
  const [loadState, setLoadState] = useState('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const [adminError, setAdminError] = useState('')

  useEffect(() => {
    let alive = true
    fetchPosts()
      .then(list => {
        if (!alive) return
        setPosts(list)
        setLoadState('ready')
      })
      .catch(() => { if (alive) setLoadState('error') })
    return () => { alive = false }
  }, [reloadKey])

  const reload = useCallback(() => {
    setLoadState('loading')
    setReloadKey(k => k + 1)
  }, [])

  // Re-dispara el reveal cuando los posts llegan async.
  useScrollReveal(loadState)

  const handleDelete = async p => {
    const title = p.i18n[lang].title
    if (!window.confirm(tp.admin.deleteConfirm.replace('{title}', title))) return
    setAdminError('')
    try {
      await deletePost(p.id)
      reload()
    } catch {
      setAdminError(tp.admin.deleteError)
    }
  }

  const [h1, h2, h3] = tp.intro.headline
  const [n1, n2, n3] = tp.newsletter.headline

  const [sortKey, setSortKey] = useState('newest')

  // Newsletter: estado mínimo replicando el patrón del form de contacto
  // (idle | loading | success | error). El registro va a GHL vía subscribeNewsletter.
  const [nlEmail, setNlEmail] = useState('')
  const [nlName, setNlName] = useState('')
  const [nlStatus, setNlStatus] = useState('idle')
  const [nlTouched, setNlTouched] = useState(false)

  const emailInvalid = !EMAIL_RE.test(nlEmail.trim())

  const handleNlSubmit = async e => {
    e.preventDefault()
    if (nlStatus === 'loading') return
    setNlTouched(true)
    if (emailInvalid) return
    setNlStatus('loading')
    try {
      await subscribeNewsletter({ email: nlEmail, name: nlName }, lang)
      setNlStatus('success')
      setNlEmail('')
      setNlName('')
      setNlTouched(false)
    } catch {
      setNlStatus('error')
    }
  }

  // Orden por publishedAt (SSOT). El ISO ordena lexicográficamente, no se parsea
  // Date(). Empates de misma fecha → orden original del array como tiebreaker
  // estable (mismo en ambas direcciones).
  const sortedPosts = useMemo(() => {
    const dir = sortKey === 'oldest' ? 1 : -1
    return posts
      .map((p, i) => ({ p, i }))
      .sort((a, b) =>
        a.p.publishedAt === b.p.publishedAt
          ? a.i - b.i
          : (a.p.publishedAt < b.p.publishedAt ? -dir : dir),
      )
      .map(({ p }) => p)
  }, [sortKey, posts])

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
                  href="/docs/Global-Market-Outlook.pdf"
                  download="Global-Market-Outlook.pdf"
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

        <div className="wrap" style={{ paddingTop: 0 }}>
          <div className="persp-articles-toolbar reveal">
            <span className="persp-sort-label" id="persp-sort-label">{tp.sort.label}</span>
            <div className="persp-sort" role="radiogroup" aria-labelledby="persp-sort-label">
              {SORT_KEYS.map(key => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={sortKey === key}
                  className={`persp-sort-btn${sortKey === key ? ' is-active' : ''}`}
                  onClick={() => setSortKey(key)}
                >
                  {tp.sort[key]}
                </button>
              ))}
            </div>
            {isAdmin && (
              <div className="persp-admin-toolbar">
                <Button variant="solid" onClick={() => navigate('admin/post')}>
                  + {tp.admin.addPost}
                </Button>
              </div>
            )}
          </div>
          {adminError && <p className="persp-admin-error">{adminError}</p>}

          {loadState === 'loading' && (
            <p className="persp-list-status">{tp.list.loading}</p>
          )}
          {loadState === 'error' && (
            <div className="persp-list-status">
              <p>{tp.list.error}</p>
              <Button variant="ghost" onClick={reload}>{tp.list.retry}</Button>
            </div>
          )}
          {loadState === 'ready' && sortedPosts.length === 0 && (
            <p className="persp-list-status">{tp.list.empty}</p>
          )}

          <div className="persp-articles-grid">
            {sortedPosts.map((p, i) => {
              const c = p.i18n[lang]
              return (
                <article key={p.id} className={`persp-single-article reveal${i > 0 ? ` d${i}` : ''}`}>
                  {p.image && (
                    <img
                      src={p.image}
                      alt={c.title}
                      className="persp-single-article-img"
                    />
                  )}
                  <div className="persp-article-tags">
                    {p.tags.map(tag => (
                      <span
                        key={tag.id}
                        className="persp-article-type"
                        style={{ color: tag.color }}
                      >
                        {lang === 'es' ? tag.nameEs : tag.nameEn}
                      </span>
                    ))}
                  </div>
                  <div className="persp-single-article-title">{c.title}</div>
                  <p className="persp-single-article-excerpt">{c.body}</p>
                  <div className="persp-article-footer">
                    <span className="persp-article-date">{p.date}</span>
                    <span className="persp-article-read">{p.read}</span>
                  </div>
                  <div className="persp-single-article-cta">
                    <Button
                      variant="ghost"
                      onClick={() => navigate('perspectivas', p.slug)}
                      style={{
                        color: 'var(--black)',
                        borderColor: 'var(--border)',
                        borderWidth: 'thin',
                        backgroundColor: 'transparent',
                      }}
                    >
                      {tp.detail.readArticle}
                      <svg viewBox="0 0 12 12" style={{ fill: 'var(--black)' }}><path d="M1 6h10M6 1l5 5-5 5" /></svg>
                    </Button>
                    {p.href && (
                      <a
                        href={p.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="persp-single-article-original"
                      >
                        {tp.detail.viewOriginal} ↗
                      </a>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="persp-admin-actions">
                      <button
                        type="button"
                        className="persp-admin-btn"
                        title={tp.admin.edit}
                        aria-label={tp.admin.edit}
                        onClick={() => navigate('admin/post', p.slug)}
                      >
                        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4">
                          <path d="M11.3 1.7l3 3L5 14H2v-3l9.3-9.3zM9.5 3.5l3 3" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="persp-admin-btn persp-admin-btn-danger"
                        title={tp.admin.delete}
                        aria-label={tp.admin.delete}
                        onClick={() => handleDelete(p)}
                      >
                        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4">
                          <path d="M2.5 4h11M6.5 4V2.5h3V4M4 4l.8 10h6.4L12 4M6.5 7v4.5M9.5 7v4.5" />
                        </svg>
                      </button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </div>

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
              {nlStatus === 'success' ? (
                <div className="persp-nl-form reveal d1">
                  <div className="persp-nl-success">
                    <div className="persp-nl-success-title">{tp.newsletter.successTitle}</div>
                    <div className="persp-nl-success-body">{tp.newsletter.successBody}</div>
                  </div>
                </div>
              ) : (
                <form
                  className="persp-nl-form reveal d1"
                  onSubmit={handleNlSubmit}
                  noValidate
                >
                  <div>
                    <label className="persp-nl-label" htmlFor="persp-nl-email">{tp.newsletter.emailLabel}</label>
                    <input
                      id="persp-nl-email"
                      className="persp-nl-input"
                      type="email"
                      placeholder={tp.newsletter.emailPlaceholder}
                      autoComplete="email"
                      value={nlEmail}
                      onChange={e => setNlEmail(e.target.value)}
                      onBlur={() => setNlTouched(true)}
                    />
                    {nlTouched && emailInvalid && (
                      <p className="persp-nl-error">{tp.newsletter.errorEmail}</p>
                    )}
                  </div>
                  <div>
                    <label className="persp-nl-label" htmlFor="persp-nl-name">{tp.newsletter.nameLabel}</label>
                    <input
                      id="persp-nl-name"
                      className="persp-nl-input"
                      type="text"
                      placeholder={tp.newsletter.namePlaceholder}
                      autoComplete="name"
                      value={nlName}
                      onChange={e => setNlName(e.target.value)}
                    />
                  </div>
                  {nlStatus === 'error' && (
                    <p className="persp-nl-error">{tp.newsletter.errorSubmit}</p>
                  )}
                  <div className="persp-nl-submit">
                    <Button
                      variant="solid"
                      onClick={handleNlSubmit}
                      style={{
                        opacity: nlStatus === 'loading' ? 0.6 : 1,
                        pointerEvents: nlStatus === 'loading' ? 'none' : 'auto',
                      }}
                    >
                      {nlStatus === 'loading' ? tp.newsletter.sending : tp.newsletter.btn}
                    </Button>
                  </div>
                  <p className="persp-nl-disclaimer">{tp.newsletter.disclaimer}</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer variant="mini" />
    </div>
  )
}
