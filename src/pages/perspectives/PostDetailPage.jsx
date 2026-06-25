import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import { Footer } from '../../widgets/footer/Footer'
import { Button } from '../../shared/ui/button/Button'
import { useScrollReveal } from '../../shared/lib/useScrollReveal'
import { useAppNavigate } from '../../shared/lib/useAppNavigate'
import { useTranslation } from '../../shared/config/locales/i18nContext'
import posts from './posts.json'
import './ui/postDetailPage.css'

export function PostDetailPage() {
  const { id } = useParams()
  useScrollReveal()
  const navigate = useAppNavigate()
  const { t, lang } = useTranslation()
  const tp = t.perspectivas
  const td = tp.detail

  const post = posts.find(p => p.id === id)

  // Ruta de detalle resiliente: id inexistente → mensaje + volver a la lista.
  if (!post) {
    return (
      <div>
        <section className="s-post-detail">
          <div className="wrap">
            <p className="post-detail-notfound">{td.notFound}</p>
            <div className="post-detail-back">
              <Button variant="ghost" onClick={() => navigate('perspectivas')}>
                {td.back}
              </Button>
            </div>
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
          <span className="persp-article-type reveal d1">{c.tag}</span>
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

        {post.href && (
          <div className="wrap post-detail-original">
            <a href={post.href} target="_blank" rel="noopener noreferrer" className="post-detail-original-link">
              {td.viewOriginal} ↗
            </a>
          </div>
        )}
      </article>

      <Footer variant="mini" />
    </div>
  )
}
