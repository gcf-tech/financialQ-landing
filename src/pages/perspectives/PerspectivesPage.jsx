import { useState, useMemo, useEffect, useCallback } from 'react'
import { Footer } from '../../widgets/footer/Footer'
import { Button } from '../../shared/ui/button/Button'
import { useScrollReveal } from '../../shared/lib/useScrollReveal'
import { useAppNavigate } from '../../shared/lib/useAppNavigate'
import { useAdminSession } from '../../shared/lib/useAdminSession'
import { useTranslation } from '../../shared/config/locales/i18nContext'
import { subscribeNewsletter } from '../../shared/api/newsletter'
import {
  fetchPosts,
  listAdminPosts,
  deletePost,
  updatePost,
} from '../../shared/api/posts'
import { PostCard } from './ui/PostCard'
import './ui/perspectivesPage.css'

const SORT_KEYS = ['newest', 'oldest']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Filtros del panel admin. 'draft' primero porque es la pregunta que trae a
// alguien al panel: qué hay pendiente de revisar.
const ADMIN_STATUSES = [
  { key: 'draft', label: 'filterDraft', empty: 'emptyDraft' },
  { key: 'published', label: 'filterPublished', empty: 'emptyPublished' },
  { key: 'all', label: 'filterAll', empty: 'emptyAll' },
]
const ADMIN_PAGE_SIZE = 100

export function PerspectivesPage() {
  const navigate = useAppNavigate()
  const { t, lang } = useTranslation()
  const { isAdmin } = useAdminSession()
  const tp = t.perspectivas
  // Los textos de publicar/despublicar —incluido el aviso de que el correo del
  // newsletter no se puede recuperar— ya existen para el editor. Se reutilizan
  // en vez de traducirlos otra vez: el diálogo tiene que decir lo mismo se
  // dispare desde donde se dispare.
  const te = t.admin.editor

  // Posts desde el backend (antes: posts.json empaquetado en el build).
  // reloadKey re-ejecuta el fetch; el estado solo se muta en callbacks async
  // o en handlers de eventos (regla react-hooks/set-state-in-effect).
  const [posts, setPosts] = useState([])
  const [adminItems, setAdminItems] = useState([])
  const [adminStatus, setAdminStatus] = useState('draft')
  const [loadState, setLoadState] = useState('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const [adminError, setAdminError] = useState('')
  // Id del post cuya acción está en vuelo, para no disparar dos veces la misma
  // publicación desde una tarjeta a la que se le hizo doble clic.
  const [busyId, setBusyId] = useState('')

  // Con sesión admin la página se alimenta del endpoint de administración, que
  // SÍ devuelve los borradores; sin sesión, del público de siempre. El
  // prerender entra siempre por la rama pública: useAdminSession devuelve
  // isAdmin=false en Node (no hay localStorage), así que el HTML estático no
  // cambia.
  useEffect(() => {
    let alive = true
    const request = isAdmin
      ? listAdminPosts({ status: adminStatus, limit: ADMIN_PAGE_SIZE }).then(
          res => res.items,
        )
      : fetchPosts()

    request
      .then(list => {
        if (!alive) return
        if (isAdmin) setAdminItems(list)
        else setPosts(list)
        setLoadState('ready')
      })
      .catch(() => { if (alive) setLoadState('error') })
    return () => { alive = false }
  }, [reloadKey, isAdmin, adminStatus])

  const reload = useCallback(() => {
    setLoadState('loading')
    setReloadKey(k => k + 1)
  }, [])

  // Re-dispara el reveal cuando los posts llegan async.
  useScrollReveal(loadState)

  const handleDelete = async (id, title) => {
    if (busyId) return
    if (!window.confirm(tp.admin.deleteConfirm.replace('{title}', title))) return
    setAdminError('')
    setBusyId(id)
    try {
      await deletePost(id)
      reload()
    } catch {
      setAdminError(tp.admin.deleteError)
    } finally {
      setBusyId('')
    }
  }

  /**
   * Publicar / despublicar desde la tarjeta. Mismo contrato que el botón del
   * editor (`PostEditorPage.handleTogglePublish`): manda SOLO el flag, con el
   * mismo diálogo de confirmación, porque la primera publicación dispara el
   * correo del newsletter en el backend y eso no se deshace.
   */
  const handleTogglePublish = async (item, title) => {
    if (busyId) return
    const next = !item.isPublished
    const message = (next ? te.publishConfirm : te.unpublishConfirm).replace(
      '{title}',
      title,
    )
    if (!window.confirm(message)) return

    setAdminError('')
    setBusyId(item.id)
    try {
      await updatePost(item.id, { isPublished: next })
      // Recargar en vez de parchear el item en memoria: con el filtro en
      // "Borradores" el post recién publicado deja de pertenecer a la lista, y
      // el servidor es quien decide eso.
      reload()
    } catch {
      setAdminError(next ? te.publishError : te.unpublishError)
    } finally {
      setBusyId('')
    }
  }

  const changeAdminStatus = status => {
    if (status === adminStatus) return
    setLoadState('loading')
    setAdminStatus(status)
  }

  /**
   * Título de una tarjeta del panel. El backend devuelve los dos y NO rellena
   * uno con el otro: un título vacío significa que esa traducción quedó a
   * medias. El fallback es solo de presentación y vive aquí, en el frontend,
   * para que la tarjeta siga siendo identificable — pero el badge de idioma es
   * el que dice la verdad sobre qué versión existe.
   *
   * Ojo al orden: primero el idioma de la interfaz y después el otro, no
   * siempre `titleEs`. Con la interfaz en inglés, caer al español teniendo el
   * inglés guardado sería enseñar el idioma equivocado.
   */
  const rowTitle = item => {
    const own = lang === 'es' ? item.titleEs : item.titleEn
    const other = lang === 'es' ? item.titleEn : item.titleEs
    return own?.trim() || other?.trim() || tp.admin.untitled
  }

  /** Mismo criterio que `rowTitle`, para el blurb de la tarjeta. */
  const rowExcerpt = item => {
    const own = lang === 'es' ? item.bodyEs : item.bodyEn
    const other = lang === 'es' ? item.bodyEn : item.bodyEs
    return own?.trim() || other?.trim() || ''
  }

  /**
   * Etiqueta "solo ES" / "solo EN" cuando el post existe en un idioma nada más.
   * Devuelve null si están los dos (lo normal) o si no está ninguno — en ese
   * caso el propio título ya sale como "(sin título)" y el badge sobraría.
   */
  const singleLangBadge = item => {
    const es = Boolean(item.titleEs?.trim())
    const en = Boolean(item.titleEn?.trim())
    if (es === en) return null
    return es ? tp.admin.onlyEs : tp.admin.onlyEn
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
            {isAdmin ? (
              <>
                <span className="persp-sort-label" id="persp-status-label">
                  {tp.admin.filterLabel}
                </span>
                <div
                  className="persp-sort"
                  role="radiogroup"
                  aria-labelledby="persp-status-label"
                >
                  {ADMIN_STATUSES.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={adminStatus === key}
                      className={`persp-sort-btn${adminStatus === key ? ' is-active' : ''}`}
                      onClick={() => changeAdminStatus(key)}
                    >
                      {tp.admin[label]}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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
              <p>{isAdmin ? tp.admin.loadError : tp.list.error}</p>
              <Button variant="ghost" onClick={reload}>{tp.list.retry}</Button>
            </div>
          )}
          {loadState === 'ready' && !isAdmin && sortedPosts.length === 0 && (
            <p className="persp-list-status">{tp.list.empty}</p>
          )}

          {/* Panel de administración: la MISMA parrilla y la MISMA tarjeta que
              el listado público, con badges de estado y acciones encima. Antes
              eran filas de tabla, porque el endpoint admin solo devolvía
              metadatos; desde que devuelve también portada, blurb, fecha,
              tiempo de lectura y etiquetas no hay motivo para mantener dos
              representaciones del mismo recurso. Lo que cambia con sesión no es
              la forma del post, es lo que puedes hacer con él. */}
          {isAdmin && loadState === 'ready' && (
            <div className="persp-admin-panel">
              <div className="persp-admin-panel-head">
                <h2 className="persp-admin-panel-title">{tp.admin.panelTitle}</h2>
                <p className="persp-admin-panel-hint">{tp.admin.panelHint}</p>
              </div>

              {adminItems.length === 0 ? (
                <p className="persp-list-status">
                  {tp.admin[
                    ADMIN_STATUSES.find(s => s.key === adminStatus).empty
                  ]}
                </p>
              ) : (
                <div className="persp-articles-grid">
                  {adminItems.map((item, i) => {
                    const title = rowTitle(item)
                    const onlyLang = singleLangBadge(item)
                    const busy = busyId === item.id
                    return (
                      <PostCard
                        key={item.id}
                        title={title}
                        excerpt={rowExcerpt(item)}
                        image={item.image}
                        date={item.date}
                        read={item.read}
                        href={item.href}
                        tags={item.tags || []}
                        lang={lang}
                        readLabel={tp.detail.readArticle}
                        originalLabel={tp.detail.viewOriginal}
                        onRead={() => navigate('perspectivas', item.slug)}
                        className={`reveal${i > 0 ? ` d${i}` : ''}`}
                        emptyCover
                        badges={
                          <>
                            <span
                              className={`persp-status-badge${item.isPublished ? ' is-published' : ' is-draft'}`}
                            >
                              {item.isPublished
                                ? tp.admin.badgePublished
                                : tp.admin.badgeDraft}
                            </span>
                            {onlyLang && (
                              <span className="persp-lang-badge is-partial">
                                {onlyLang}
                              </span>
                            )}
                            <span className="persp-card-updated">
                              {/* ISO cortado, sin Date(): mismo criterio que el
                                  resto de fechas de la página. */}
                              {tp.admin.updatedAt}{' '}
                              {String(item.updatedAt || '').slice(0, 10)}
                            </span>
                          </>
                        }
                        adminActions={
                          <>
                            <button
                              type="button"
                              className="persp-admin-btn"
                              title={tp.admin.edit}
                              aria-label={`${tp.admin.edit}: ${title}`}
                              onClick={() => navigate('admin/post', item.slug)}
                            >
                              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4">
                                <path d="M11.3 1.7l3 3L5 14H2v-3l9.3-9.3zM9.5 3.5l3 3" />
                              </svg>
                            </button>

                            {/* La acción con consecuencias: publicar por
                                primera vez manda el correo del newsletter. Va
                                con etiqueta de texto, no con un icono que haya
                                que adivinar, y como <button> de verdad. */}
                            <Button
                              as="button"
                              variant="ghost"
                              className="persp-card-publish"
                              disabled={busy}
                              aria-label={`${item.isPublished ? te.unpublish : te.publish}: ${title}`}
                              onClick={() => handleTogglePublish(item, title)}
                              style={{ opacity: busy ? 0.6 : 1 }}
                            >
                              {busy
                                ? item.isPublished
                                  ? te.unpublishing
                                  : te.publishing
                                : item.isPublished
                                  ? te.unpublish
                                  : te.publish}
                            </Button>

                            <button
                              type="button"
                              className="persp-admin-btn persp-admin-btn-danger"
                              title={tp.admin.delete}
                              aria-label={`${tp.admin.delete}: ${title}`}
                              onClick={() => handleDelete(item.id, title)}
                            >
                              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4">
                                <path d="M2.5 4h11M6.5 4V2.5h3V4M4 4l.8 10h6.4L12 4M6.5 7v4.5M9.5 7v4.5" />
                              </svg>
                            </button>
                          </>
                        }
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* La parrilla pública no se pinta con sesión admin: su sitio lo
              ocupa el panel de arriba. (Ojo: no vale `hidden`, porque la regla
              `display: grid` del propio .persp-articles-grid gana al atributo.) */}
          {!isAdmin && (
          <div className="persp-articles-grid">
            {sortedPosts.map((p, i) => {
              const c = p.i18n[lang]
              return (
                // Sin badges, sin adminActions y sin emptyCover: la tarjeta
                // emite exactamente el mismo árbol que cuando este JSX estaba
                // aquí en línea. La rama sin sesión no cambia.
                <PostCard
                  key={p.id}
                  title={c.title}
                  excerpt={c.body}
                  image={p.image}
                  date={p.date}
                  read={p.read}
                  href={p.href}
                  tags={p.tags}
                  lang={lang}
                  readLabel={tp.detail.readArticle}
                  originalLabel={tp.detail.viewOriginal}
                  onRead={() => navigate('perspectivas', p.slug)}
                  className={`reveal${i > 0 ? ` d${i}` : ''}`}
                />
              )
            })}
          </div>
          )}
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
