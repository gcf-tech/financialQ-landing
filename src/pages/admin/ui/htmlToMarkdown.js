/**
 * Convierte el HTML del portapapeles (Word, Google Docs, páginas web) al
 * subconjunto de markdown que renderizan los posts (react-markdown sin GFM):
 * negrilla, cursiva, títulos, listas, citas, enlaces y código. Lo demás
 * degrada a texto plano. Sin dependencias: DOMParser + recorrido recursivo.
 */

const SKIP = new Set([
  'STYLE', 'SCRIPT', 'META', 'TITLE', 'NOSCRIPT', 'TEMPLATE',
  'IMG', 'SVG', 'BUTTON', 'INPUT', 'SELECT', 'IFRAME',
])
const BLOCKS = new Set([
  'P', 'DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN',
  'ASIDE', 'FIGURE', 'FIGCAPTION', 'ADDRESS', 'DL', 'DT', 'DD',
])
const INDENT = '    '

export function htmlToMarkdown(html) {
  const body = new DOMParser().parseFromString(html, 'text/html').body
  return renderChildren(body, 0)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    // Word no usa <ul>: sus viñetas llegan como párrafos que empiezan con "·".
    .replace(/^[·•]\s*/gm, '- ')
    // Compactar ítems consecutivos que quedaron como párrafos separados.
    .replace(/^(- .*)\n\n(?=- )/gm, '$1\n')
    .replace(/^(\d+\. .*)\n\n(?=\d+\. )/gm, '$1\n')
    .trim()
}

// Google Docs envuelve todo en <b style="font-weight:normal">: el estilo
// inline manda sobre la etiqueta.
function isBold(el) {
  const w = el.style.fontWeight
  if (w) return w === 'bold' || w === 'bolder' || parseInt(w, 10) >= 600
  return el.tagName === 'B' || el.tagName === 'STRONG'
}

function isItalic(el) {
  const s = el.style.fontStyle
  if (s) return s === 'italic' || s === 'oblique'
  return el.tagName === 'I' || el.tagName === 'EM'
}

// Mueve los espacios fuera del marcador: "** hola **" no es markdown válido.
function wrapInline(text, marker) {
  const [, lead, core, tail] = text.match(/^(\s*)([\s\S]*?)(\s*)$/)
  return core ? lead + marker + core + marker + tail : text
}

function styled(el, depth) {
  let out = renderChildren(el, depth)
  if (isItalic(el)) out = wrapInline(out, '_')
  if (isBold(el)) out = wrapInline(out, '**')
  return out
}

function renderChildren(el, depth) {
  let out = ''
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) out += node.nodeValue.replace(/\s+/g, ' ')
    else if (node.nodeType === Node.ELEMENT_NODE) out += renderElement(node, depth)
  }
  return out
}

function renderList(el, depth) {
  const ordered = el.tagName === 'OL'
  const indent = INDENT.repeat(depth)
  const items = []
  let n = 0
  for (const li of el.children) {
    if (li.tagName !== 'LI') continue
    n += 1
    const marker = ordered ? `${n}. ` : '- '
    const content = styled(li, depth + 1).trim().replace(/\n{2,}/g, '\n')
    items.push(indent + marker + content)
  }
  return `\n\n${items.join('\n')}\n\n`
}

function renderElement(el, depth) {
  const tag = el.tagName
  if (SKIP.has(tag)) return ''
  const hx = /^H([1-6])$/.exec(tag)
  if (hx) return `\n\n${'#'.repeat(Number(hx[1]))} ${styled(el, depth).trim()}\n\n`

  switch (tag) {
    case 'BR':
      return '\n'
    case 'HR':
      return '\n\n---\n\n'
    case 'UL':
    case 'OL':
      return renderList(el, depth)
    case 'LI':
      return `\n${styled(el, depth).trim()}\n`
    case 'BLOCKQUOTE': {
      const inner = renderChildren(el, depth).trim().replace(/\n{2,}/g, '\n')
      return `\n\n${inner.split('\n').map(line => '> ' + line.trim()).join('\n')}\n\n`
    }
    case 'A': {
      const href = el.getAttribute('href') || ''
      const text = styled(el, depth).trim()
      if (!/^https?:\/\//.test(href) || !text) return text
      return `[${text}](${href})`
    }
    case 'PRE':
      return `\n\n\`\`\`\n${el.textContent.replace(/\n+$/, '')}\n\`\`\`\n\n`
    case 'CODE':
      return `\`${el.textContent}\``
    case 'TABLE': {
      const rows = [...el.querySelectorAll('tr')].map(tr =>
        [...tr.children]
          .map(cell => styled(cell, depth).trim().replace(/\n+/g, ' '))
          .join(' | '),
      )
      return `\n\n${rows.join('\n')}\n\n`
    }
    default:
      if (BLOCKS.has(tag)) return `\n\n${styled(el, depth).trim()}\n\n`
      return styled(el, depth)
  }
}
