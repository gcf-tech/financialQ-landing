import { Button } from '../../../shared/ui/button/Button'

/**
 * Tarjeta de un post en la parrilla de Perspectives.
 *
 * Extraída tal cual del `.map()` que vivía en `PerspectivesPage.jsx`, para que
 * el panel admin y el listado público sean **la misma representación** del
 * mismo recurso en vez de dos (antes: tarjetas sin sesión, filas de tabla con
 * sesión). No es un componente nuevo con el mismo aspecto: es el de siempre,
 * movido de sitio.
 *
 * **Sin `badges`, `adminActions` ni `emptyCover` el árbol que emite es idéntico
 * —mismos elementos, mismo orden, mismas clases— al que había antes de la
 * extracción.** Es lo que permite reutilizarla sin tocar la rama sin sesión ni
 * el HTML prerenderizado.
 *
 * El post llega ya normalizado (`title`, `excerpt`, `image`…) y no como la fila
 * cruda de la API: las dos listas que la usan devuelven formas distintas —la
 * pública anida `i18n.es`/`i18n.en`, la admin trae `titleEs`/`bodyEs` planos—
 * y traducir eso es trabajo del que la llama, no de la tarjeta.
 *
 * @param {{
 *   title: string,
 *   excerpt: string,
 *   image: string|null,
 *   date: string,
 *   read: string,
 *   href: string|null,
 *   tags: Array<{id: string, nameEs: string, nameEn: string, color: string}>,
 *   lang: 'es'|'en',
 *   readLabel: string,
 *   originalLabel: string,
 *   onRead: () => void,
 *   className?: string,
 *   badges?: React.ReactNode,
 *   adminActions?: React.ReactNode,
 *   emptyCover?: boolean,
 * }} props
 */
export function PostCard({
  title,
  excerpt,
  image,
  date,
  read,
  href,
  tags,
  lang,
  readLabel,
  originalLabel,
  onRead,
  className,
  badges,
  adminActions,
  emptyCover = false,
}) {
  return (
    <article
      className={
        className
          ? `persp-single-article ${className}`
          : 'persp-single-article'
      }
    >
      {badges && <div className="persp-card-badges">{badges}</div>}

      {image ? (
        // Sin width/height: la portada llega del backend y no conocemos su
        // tamaño intrínseco. El hueco ya lo reserva `aspect-ratio: 16/9` en
        // perspectivesPage.css, así que no hay CLS.
        <img
          src={image}
          alt={title}
          className="persp-single-article-img"
          loading="lazy"
          decoding="async"
        />
      ) : (
        // Un borrador sin portada deja el hueco vacío en vez de encoger la
        // tarjeta y descuadrar la parrilla: se ve incompleto, no roto. Es el
        // mismo recuadro `--ivory-pale` que ya se ve mientras la imagen carga,
        // no un asset de relleno inventado.
        //
        // Solo en el panel: en público la tarjeta sigue sin pintar nada cuando
        // no hay imagen, que es como se comporta hoy.
        emptyCover && (
          <div
            className="persp-single-article-img persp-single-article-img-empty"
            aria-hidden="true"
          />
        )
      )}

      <div className="persp-article-tags">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="persp-article-type"
            style={{ color: tag.color }}
          >
            {lang === 'es' ? tag.nameEs : tag.nameEn}
          </span>
        ))}
      </div>
      <div className="persp-single-article-title">{title}</div>
      <p className="persp-single-article-excerpt">{excerpt}</p>
      <div className="persp-article-footer">
        <span className="persp-article-date">{date}</span>
        <span className="persp-article-read">{read}</span>
      </div>
      <div className="persp-single-article-cta">
        <Button
          variant="ghost"
          onClick={onRead}
          style={{
            color: 'var(--black)',
            borderColor: 'var(--border)',
            borderWidth: 'thin',
            backgroundColor: 'transparent',
          }}
        >
          {readLabel}
          <svg viewBox="0 0 12 12" style={{ fill: 'var(--black)' }}><path d="M1 6h10M6 1l5 5-5 5" /></svg>
        </Button>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="persp-single-article-original"
          >
            {originalLabel} ↗
          </a>
        )}
      </div>

      {adminActions && (
        <div className="persp-card-actions">{adminActions}</div>
      )}
    </article>
  )
}
