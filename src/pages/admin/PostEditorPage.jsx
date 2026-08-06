import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import { Footer } from '../../widgets/footer/Footer'
import { Button } from '../../shared/ui/button/Button'
import { useTranslation } from '../../shared/config/locales/i18nContext'
import { useAppNavigate } from '../../shared/lib/useAppNavigate'
import { useAdminSession } from '../../shared/lib/useAdminSession'
import {
  fetchPost,
  fetchTags,
  createPost,
  updatePost,
  uploadPostImage,
  translateDraft,
  createTag,
  deleteTag,
} from '../../shared/api/posts'
import { MarkdownEditor } from './ui/MarkdownEditor'
import './ui/adminPages.css'

const EMPTY_FORM = {
  titleEn: '',
  contentEn: '',
  bodyEn: '',
  titleEs: '',
  contentEs: '',
  bodyEs: '',
  read: '',
  publishedAt: new Date().toISOString().slice(0, 10),
  href: '',
  imageUrl: '',
}

/**
 * Editor de posts de Perspectives (/admin/post para crear,
 * /admin/post/:slug para editar). Flujo: David escribe en inglés, el botón
 * "Traducir con IA" genera el borrador en español (revisable), y Publicar
 * guarda vía backend. Solo accesible con sesión admin.
 */
export function PostEditorPage() {
  const { slug } = useParams()
  const isEdit = Boolean(slug)
  const { t } = useTranslation()
  const ta = t.admin.editor
  const navigate = useAppNavigate()
  const { isAdmin, mustChangePassword } = useAdminSession()

  const [form, setForm] = useState(EMPTY_FORM)
  const [postId, setPostId] = useState(null)
  const [tags, setTags] = useState([])
  const [tagIds, setTagIds] = useState([])
  const [newTag, setNewTag] = useState({ nameEs: '', nameEn: '', color: '#8A7A5C' })
  const [activeTab, setActiveTab] = useState('en')
  const [loadState, setLoadState] = useState(isEdit ? 'loading' : 'ready')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Sin sesión admin, o con cambio de contraseña pendiente: volver a /admin
    // (allí se resuelve el primer cambio antes de editar).
    if (!isAdmin || mustChangePassword) navigate('admin')
  }, [isAdmin, mustChangePassword]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let alive = true
    fetchTags().then(list => { if (alive) setTags(list) }).catch(() => {})

    if (isEdit) {
      fetchPost(slug)
        .then(post => {
          if (!alive) return
          if (!post) {
            setLoadState('notfound')
            return
          }
          setPostId(post.id)
          setTagIds(post.tags.map(tag => tag.id))
          setForm({
            titleEn: post.i18n.en.title,
            contentEn: post.i18n.en.content || '',
            bodyEn: post.i18n.en.body || '',
            titleEs: post.i18n.es.title,
            contentEs: post.i18n.es.content || '',
            bodyEs: post.i18n.es.body || '',
            read: post.read || '',
            publishedAt: post.publishedAt,
            href: post.href || '',
            imageUrl: post.image || '',
          })
          setLoadState('ready')
        })
        .catch(() => { if (alive) setLoadState('notfound') })
    }
    return () => { alive = false }
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  // from: idioma en el que escribió el autor; el LLM genera el otro.
  const handleTranslate = async from => {
    const title = from === 'en' ? form.titleEn : form.titleEs
    const content = from === 'en' ? form.contentEn : form.contentEs
    if (busy || !title.trim() || !content.trim()) return
    setBusy('translating')
    setError('')
    try {
      const r = await translateDraft(
        from === 'en'
          ? { titleEn: title.trim(), contentEn: content }
          : { titleEs: title.trim(), contentEs: content },
      )
      setForm(prev => ({
        ...prev,
        ...(from === 'en'
          ? { titleEs: r.titleEs, contentEs: r.contentEs }
          : { titleEn: r.titleEn, contentEn: r.contentEn }),
        bodyEs: r.bodyEs,
        bodyEn: r.bodyEn,
        read: prev.read || r.read,
      }))
      setActiveTab(from === 'en' ? 'es' : 'en')
    } catch {
      setError(ta.translateError)
    } finally {
      setBusy('')
    }
  }

  const handleImage = async e => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || busy) return
    setBusy('uploading')
    setError('')
    try {
      const imageUrl = await uploadPostImage(file)
      set('imageUrl', imageUrl)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const handleAddTag = async () => {
    if (busy || !newTag.nameEs.trim() || !newTag.nameEn.trim()) return
    setBusy('tag')
    setError('')
    try {
      const created = await createTag({
        nameEs: newTag.nameEs.trim(),
        nameEn: newTag.nameEn.trim(),
        color: newTag.color,
      })
      setTags(prev => [...prev, created])
      setTagIds(prev => [...prev, created.id])
      setNewTag({ nameEs: '', nameEn: '', color: '#8A7A5C' })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const handleDeleteTag = async tag => {
    if (busy || !window.confirm(ta.deleteTagConfirm)) return
    setBusy('tag')
    try {
      await deleteTag(tag.id)
      setTags(prev => prev.filter(x => x.id !== tag.id))
      setTagIds(prev => prev.filter(id => id !== tag.id))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const toggleTag = id =>
    setTagIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    )

  const handleSave = async () => {
    if (busy) return
    const required = ['titleEn', 'contentEn', 'titleEs', 'contentEs']
    if (required.some(key => !form[key].trim())) {
      setError(ta.requiredError)
      return
    }
    setBusy('saving')
    setError('')
    const data = {
      titleEn: form.titleEn.trim(),
      contentEn: form.contentEn,
      bodyEn: form.bodyEn.trim(),
      titleEs: form.titleEs.trim(),
      contentEs: form.contentEs,
      bodyEs: form.bodyEs.trim(),
      read: form.read.trim() || '2 min',
      publishedAt: form.publishedAt,
      href: form.href.trim(),
      imageUrl: form.imageUrl,
      tagIds,
    }
    try {
      if (isEdit) {
        await updatePost(postId, data)
      } else {
        await createPost(data)
      }
      navigate('perspectivas')
    } catch {
      setError(ta.saveError)
      setBusy('')
    }
  }

  if (!isAdmin || mustChangePassword) return null

  if (loadState !== 'ready') {
    return (
      <div>
        {/* data-clarity-mask: ver shared/lib/clarity.js */}
        <section className="s-admin" data-clarity-mask="true">
          <div className="wrap admin-wrap">
            <p className="admin-session-note">
              {loadState === 'loading' ? ta.loading : ta.notFound}
            </p>
          </div>
        </section>
        <Footer variant="mini" />
      </div>
    )
  }

  const activeContent = activeTab === 'en' ? form.contentEn : form.contentEs

  return (
    <div>
      {/* data-clarity-mask: ver shared/lib/clarity.js */}
      <section className="s-admin" data-clarity-mask="true">
        <div className="wrap admin-wrap admin-wrap-wide">
          <span className="eyebrow">{isEdit ? ta.editTitle : ta.newTitle}</span>
          <h1 className="admin-title">
            {form.titleEn || (isEdit ? ta.editTitle : ta.newTitle)}
          </h1>

          <div className="admin-editor-grid">
            <div className="admin-editor-form">
              <div className="admin-tabs" role="tablist">
                {['en', 'es'].map(tab => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab}
                    className={`admin-tab${activeTab === tab ? ' is-active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'en' ? ta.tabEn : ta.tabEs}
                  </button>
                ))}
              </div>

              {activeTab === 'en' ? (
                <div>
                  <label className="admin-label" htmlFor="ed-title-en">{ta.titleLabel}</label>
                  <input
                    id="ed-title-en"
                    className="admin-input"
                    value={form.titleEn}
                    onChange={e => set('titleEn', e.target.value)}
                  />
                  <label className="admin-label" htmlFor="ed-content-en">{ta.contentLabel}</label>
                  <MarkdownEditor
                    id="ed-content-en"
                    value={form.contentEn}
                    onChange={v => set('contentEn', v)}
                    labels={ta.toolbar}
                  />
                  <label className="admin-label" htmlFor="ed-body-en">{ta.excerptLabel}</label>
                  <input
                    id="ed-body-en"
                    className="admin-input"
                    value={form.bodyEn}
                    onChange={e => set('bodyEn', e.target.value)}
                  />
                  <p className="admin-hint">{ta.translateHint}</p>
                  <Button
                    variant="ghost"
                    onClick={() => handleTranslate('en')}
                    style={{ opacity: busy === 'translating' ? 0.6 : 1 }}
                  >
                    {busy === 'translating' ? ta.translating : ta.translateBtn}
                  </Button>
                </div>
              ) : (
                <div>
                  <label className="admin-label" htmlFor="ed-title-es">{ta.titleLabel}</label>
                  <input
                    id="ed-title-es"
                    className="admin-input"
                    value={form.titleEs}
                    onChange={e => set('titleEs', e.target.value)}
                  />
                  <label className="admin-label" htmlFor="ed-content-es">{ta.contentLabel}</label>
                  <MarkdownEditor
                    id="ed-content-es"
                    value={form.contentEs}
                    onChange={v => set('contentEs', v)}
                    labels={ta.toolbar}
                  />
                  <label className="admin-label" htmlFor="ed-body-es">{ta.excerptLabel}</label>
                  <input
                    id="ed-body-es"
                    className="admin-input"
                    value={form.bodyEs}
                    onChange={e => set('bodyEs', e.target.value)}
                  />
                  <p className="admin-hint">{ta.translateHintToEn}</p>
                  <Button
                    variant="ghost"
                    onClick={() => handleTranslate('es')}
                    style={{ opacity: busy === 'translating' ? 0.6 : 1 }}
                  >
                    {busy === 'translating' ? ta.translating : ta.translateBtnToEn}
                  </Button>
                </div>
              )}

              <div className="admin-meta-grid">
                <div>
                  <label className="admin-label" htmlFor="ed-date">{ta.dateLabel}</label>
                  <input
                    id="ed-date"
                    className="admin-input"
                    type="date"
                    value={form.publishedAt}
                    onChange={e => set('publishedAt', e.target.value)}
                  />
                </div>
                <div>
                  <label className="admin-label" htmlFor="ed-read">{ta.readLabel}</label>
                  <input
                    id="ed-read"
                    className="admin-input"
                    placeholder="2 min"
                    value={form.read}
                    onChange={e => set('read', e.target.value)}
                  />
                </div>
              </div>

              <label className="admin-label" htmlFor="ed-href">{ta.hrefLabel}</label>
              <input
                id="ed-href"
                className="admin-input"
                type="url"
                value={form.href}
                onChange={e => set('href', e.target.value)}
              />

              <label className="admin-label">{ta.imageLabel}</label>
              {form.imageUrl && (
                <img src={form.imageUrl} alt="" className="admin-image-preview" />
              )}
              <label className="admin-upload-btn">
                {busy === 'uploading'
                  ? ta.uploading
                  : form.imageUrl ? ta.changeImage : ta.uploadBtn}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImage}
                  style={{ display: 'none' }}
                />
              </label>

              <label className="admin-label">{ta.tagsLabel}</label>
              <div className="admin-tags">
                {tags.map(tag => (
                  <span
                    key={tag.id}
                    className={`admin-tag-chip${tagIds.includes(tag.id) ? ' is-selected' : ''}`}
                    style={{ '--tag-color': tag.color }}
                  >
                    <button type="button" className="admin-tag-toggle" onClick={() => toggleTag(tag.id)}>
                      {tag.nameEs} / {tag.nameEn}
                    </button>
                    <button
                      type="button"
                      className="admin-tag-remove"
                      aria-label={`${ta.deleteTagConfirm} (${tag.nameEn})`}
                      onClick={() => handleDeleteTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="admin-newtag-row">
                <input
                  className="admin-input"
                  placeholder={ta.newTagNameEs}
                  value={newTag.nameEs}
                  onChange={e => setNewTag(v => ({ ...v, nameEs: e.target.value }))}
                />
                <input
                  className="admin-input"
                  placeholder={ta.newTagNameEn}
                  value={newTag.nameEn}
                  onChange={e => setNewTag(v => ({ ...v, nameEn: e.target.value }))}
                />
                <input
                  className="admin-color-input"
                  type="color"
                  aria-label={ta.newTagColor}
                  value={newTag.color}
                  onChange={e => setNewTag(v => ({ ...v, color: e.target.value }))}
                />
                <Button variant="ghost" onClick={handleAddTag}>{ta.addTag}</Button>
              </div>

              {error && <p className="admin-error">{error}</p>}

              <div className="admin-actions-row">
                <Button
                  variant="solid"
                  onClick={handleSave}
                  style={{ opacity: busy === 'saving' ? 0.6 : 1 }}
                >
                  {busy === 'saving' ? ta.saving : isEdit ? ta.saveEdit : ta.save}
                </Button>
                <Button variant="ghost" onClick={() => navigate('perspectivas')}>
                  {ta.cancel}
                </Button>
              </div>
            </div>

            <div className="admin-editor-preview">
              <span className="admin-label">{ta.previewLabel}</span>
              <div className="admin-preview-body">
                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                  {activeContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer variant="mini" />
    </div>
  )
}
