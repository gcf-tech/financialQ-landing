import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import { Footer } from '../../widgets/footer/Footer'
import { Button } from '../../shared/ui/button/Button'
import { useScrollReveal } from '../../shared/lib/useScrollReveal'
import { useAppNavigate } from '../../shared/lib/useAppNavigate'
import { useTranslation } from '../../shared/config/locales/i18nContext'
import { prerenderData } from '../../shared/lib/prerenderData'
import { PostCta } from './ui/PostCta'
import { fetchPost } from '../../shared/api/posts'
import './ui/postDetailPage.css'

export function PostDetailPage() {
  const { id } = useParams() // slug del post en la URL
  const navigate = useAppNavigate()
  const { t, lang } = useTranslation()
  const tp = t.perspectivas
  const td = tp.detail

  // Semilla del prerender (ver PerspectivesPage). Se comprueba el slug: el
  // global lleva el post de la ruta que se está generando, y renderizar aquí
  // otro sería publicar un artículo bajo la URL de otro.
  const seeded = prerenderData().post
  const seededPost = seeded && seeded.slug === id ? seeded : null

  const [post, setPost] = useState(seededPost)
  const [loadState, setLoadState] = useState(seededPost ? 'ready' : 'loading')

  // El estado solo se muta en callbacks async (regla set-state-in-effect);
  // el estado inicial ya es 'loading'.
  useEffect(() => {
    let alive = true
    fetchPost(id)
      .then(data => {
        if (!alive) return
        setPost(data)
        setLoadState(data ? 'ready' : 'notfound')
      })
      .catch(() => { if (alive) setLoadState('notfound') })
    return () => { alive = false }
  }, [id])

  // Re-dispara el reveal cuando el post llega async.
  useScrollReveal(loadState)

  // Ruta de detalle resiliente: id inexistente o error → mensaje + volver.
  if (loadState !== 'ready') {
    return (
      <div>
        <section className="s-post-detail">
          <div className="wrap">
            <p className="post-detail-notfound">
              {loadState === 'loading' ? tp.list.loading : td.notFound}
            </p>
            {loadState === 'notfound' && (
              <div className="post-detail-back">
                <Button variant="ghost" onClick={() => navigate('perspectivas')}>
                  {td.back}
                </Button>
              </div>
            )}
          </div>
        </section>
        <Footer variant="mini" />
      </div>
    )
  }

  const c = post.i18n[lang]

  return (
    <div>
      <article className="s-post-detail">
        <div className="wrap post-detail-head">
          <button type="button" className="post-detail-backlink reveal" onClick={() => navigate('perspectivas')}>
            ← {td.back}
          </button>
          <div className="persp-article-tags reveal d1">
            {post.tags.map(tag => (
              <span
                key={tag.id}
                className="persp-article-type"
                style={{ color: tag.color }}
              >
                {lang === 'es' ? tag.nameEs : tag.nameEn}
              </span>
            ))}
          </div>
          <h1 className="post-detail-title reveal d1">{c.title}</h1>
          <div className="post-detail-meta reveal d2">
            <span>{post.date}</span>
            <span className="post-detail-meta-sep" />
            <span>{post.read}</span>
          </div>
        </div>

        {post.image && (
          <div className="wrap">
            <img src={post.image} alt={c.title} className="post-detail-img reveal d2" />
          </div>
        )}

        <div className="wrap post-detail-body reveal d2">
          {c.content ? (
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{c.content}</ReactMarkdown>
          ) : (
            // Posts legacy (sin content): degradar al blurb + enlace al original.
            <p className="post-detail-fallback">{c.body}</p>
          )}
        </div>
      </article>

      {/* Acciones de cierre. Fuera del <article> a propósito: la oferta no es
          contenido del artículo. El enlace al original la acompaña dentro del
          mismo contenedor para que las dos se lean como un bloque y no como
          dos elementos sueltos; la separación la pone el contenedor.

          Orden: primero la atribución, después la oferta — la atribución no
          compite con ella. */}
      <div className="wrap post-detail-actions reveal">
        {post.href && (
          <a href={post.href} target="_blank" rel="noopener noreferrer" className="post-detail-original-link">
            {td.viewOriginal} ↗
          </a>
        )}
        <PostCta slug={post.slug || id} />
      </div>

      <Footer variant="mini" />
    </div>
  )
}
