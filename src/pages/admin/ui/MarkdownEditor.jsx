import { useRef } from 'react'
import { htmlToMarkdown } from './htmlToMarkdown'

/**
 * Textarea de markdown con toolbar de formato (negrilla, títulos, listas,
 * cita, enlace). Los botones aplican la sintaxis sobre la selección, con
 * toggle si ya está aplicada. Al pegar contenido con formato (Word, Google
 * Docs, web) lo convierte a markdown; Ctrl+Shift+V pega sin formato. Usa
 * execCommand('insertText') —deprecado pero sin reemplazo— porque es la
 * única vía que conserva el undo nativo (Ctrl+Z) y dispara el evento input
 * que mantiene sincronizado el estado de React.
 */
export function MarkdownEditor({ id, value, onChange, labels }) {
  const ref = useRef(null)
  const plainPasteRef = useRef(false)

  const insert = (text, selFrom, selTo) => {
    const el = ref.current
    el.focus()
    let ok = false
    try {
      ok = document.execCommand('insertText', false, text)
    } catch {
      ok = false
    }
    if (!ok) {
      const { selectionStart, selectionEnd } = el
      const next = el.value.slice(0, selectionStart) + text + el.value.slice(selectionEnd)
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value',
      ).set
      setter.call(el, next)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
    if (selFrom != null) el.setSelectionRange(selFrom, selTo ?? selFrom)
  }

  const wrap = marker => {
    const el = ref.current
    const { selectionStart: start, selectionEnd: end, value: v } = el
    const len = marker.length
    const sel = v.slice(start, end)

    if (sel.startsWith(marker) && sel.endsWith(marker) && sel.length >= len * 2) {
      const inner = sel.slice(len, sel.length - len)
      insert(inner, start, start + inner.length)
      return
    }
    if (start >= len && v.slice(start - len, start) === marker && v.slice(end, end + len) === marker) {
      el.setSelectionRange(start - len, end + len)
      insert(sel, start - len, start - len + sel.length)
      return
    }
    const inner = sel || labels.placeholder
    insert(marker + inner + marker, start + len, start + len + inner.length)
  }

  // Aplica fn a las líneas completas que toca la selección.
  const transformLines = fn => {
    const el = ref.current
    const { selectionStart: start, selectionEnd: end, value: v } = el
    const from = v.lastIndexOf('\n', start - 1) + 1
    const nlAt = v.indexOf('\n', end)
    const to = nlAt === -1 ? v.length : nlAt
    const next = fn(v.slice(from, to).split('\n')).join('\n')
    el.setSelectionRange(from, to)
    insert(next, from, from + next.length)
  }

  const heading = prefix =>
    transformLines(rows => {
      const active = rows.every(r => r.startsWith(prefix))
      return rows.map(r => {
        const bare = r.replace(/^#{1,6} /, '')
        return active ? bare : prefix + bare
      })
    })

  const bulletList = () =>
    transformLines(rows => {
      const active = rows.every(r => /^- /.test(r) || r.trim() === '')
      return rows.map(r =>
        r.trim() === '' ? r : active ? r.replace(/^- /, '') : '- ' + r.replace(/^(?:- |\d+\. )/, ''),
      )
    })

  const numberedList = () =>
    transformLines(rows => {
      const active = rows.every(r => /^\d+\. /.test(r) || r.trim() === '')
      let n = 0
      return rows.map(r => {
        if (r.trim() === '') return r
        if (active) return r.replace(/^\d+\. /, '')
        n += 1
        return `${n}. ` + r.replace(/^(?:- |\d+\. )/, '')
      })
    })

  const quote = () =>
    transformLines(rows => {
      const active = rows.every(r => r.startsWith('> ') || r.trim() === '')
      return rows.map(r => (r.trim() === '' ? r : active ? r.replace(/^> /, '') : '> ' + r))
    })

  const link = () => {
    const el = ref.current
    const { selectionStart: start, selectionEnd: end, value: v } = el
    const sel = v.slice(start, end)
    const isUrl = /^https?:\/\//.test(sel)
    const text = isUrl ? labels.placeholder : sel || labels.placeholder
    const url = isUrl ? sel : 'https://'
    // Deja seleccionada la parte que falta por completar (texto o URL).
    const selFrom = isUrl ? start + 1 : start + 1 + text.length + 2
    const selTo = isUrl ? start + 1 + text.length : start + 1 + text.length + 2 + url.length
    insert(`[${text}](${url})`, selFrom, selTo)
  }

  const handleKeyDown = e => {
    if (!(e.ctrlKey || e.metaKey)) return
    const key = e.key.toLowerCase()
    if (key === 'b') {
      e.preventDefault()
      wrap('**')
    } else if (key === 'i') {
      e.preventDefault()
      wrap('_')
    } else if (key === 'v' && e.shiftKey) {
      plainPasteRef.current = true
    }
  }

  const handlePaste = e => {
    if (plainPasteRef.current) {
      plainPasteRef.current = false
      return
    }
    const html = e.clipboardData?.getData('text/html')
    if (!html) return
    const md = htmlToMarkdown(html)
    if (!md) return
    e.preventDefault()
    insert(md)
  }

  const runAction = key => {
    if (key === 'bold') wrap('**')
    else if (key === 'italic') wrap('_')
    else if (key === 'h2') heading('## ')
    else if (key === 'h3') heading('### ')
    else if (key === 'ul') bulletList()
    else if (key === 'ol') numberedList()
    else if (key === 'quote') quote()
    else if (key === 'link') link()
  }

  const actions = [
    { key: 'bold', className: ' admin-md-btn-b', text: 'B' },
    { key: 'italic', className: ' admin-md-btn-i', text: 'I' },
    { key: 'h2', className: '', text: 'H2' },
    { key: 'h3', className: '', text: 'H3' },
    { key: 'ul', className: '', text: labels.ulBtn },
    { key: 'ol', className: '', text: labels.olBtn },
    { key: 'quote', className: '', text: labels.quoteBtn },
    { key: 'link', className: '', text: labels.linkBtn },
  ]

  return (
    <div>
      <div className="admin-md-toolbar" role="toolbar" aria-label={labels.label}>
        {actions.map(a => (
          <button
            key={a.key}
            type="button"
            className={`admin-md-btn${a.className}`}
            title={labels[a.key]}
            aria-label={labels[a.key]}
            onMouseDown={e => e.preventDefault()}
            onClick={() => runAction(a.key)}
          >
            {a.text}
          </button>
        ))}
      </div>
      <textarea
        ref={ref}
        id={id}
        className="admin-textarea admin-textarea-md"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
    </div>
  )
}
