import './Button.css'

/**
 * @param {{
 *   variant?: 'solid'|'ghost'|'ivory',
 *   as?: 'button',
 *   onClick?: Function,
 *   children: React.ReactNode,
 *   style?: object,
 *   className?: string,
 * }} props
 *
 * `as="button"` renderiza un `<button type="button">` real: enfocable con Tab,
 * accionable con Enter/Espacio y expuesto con rol de botón a lectores de
 * pantalla. Acepta además los atributos sueltos que haga falta pasarle
 * (`aria-label`, `disabled`, `title`…).
 *
 * Sin esa prop sigue siendo el `<div onClick>` de siempre. No es descuido: el
 * componente se usa en ~25 sitios que entran en el prerender (`npm run build`
 * genera HTML estático), y en uno de ellos —el enlace de descarga del outlook,
 * `PerspectivesPage.jsx`— va anidado dentro de un `<a>`, donde un `<button>`
 * sería HTML inválido. Cambiar el default es el resto de T-009
 * (`context/TICKETS.md`) y pide su propia verificación visual de todo el sitio;
 * esta prop cierra el caso que motivó el ticket —publicar/despublicar— sin
 * mover una línea del HTML público.
 */
export function Button({
  variant = 'solid',
  as,
  onClick,
  children,
  style,
  className,
  ...rest
}) {
  const base = `btn-${variant}`
  const cls = className ? `${base} ${className}` : base

  if (as === 'button') {
    return (
      <button
        type="button"
        className={cls}
        onClick={onClick}
        style={style}
        {...rest}
      >
        {children}
      </button>
    )
  }

  return (
    <div className={cls} onClick={onClick} style={style}>
      {children}
    </div>
  )
}
