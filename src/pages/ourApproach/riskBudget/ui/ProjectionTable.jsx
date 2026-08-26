import { formatAmount } from '../lib/projection'

/**
 * Tabla de la proyección, año a año.
 *
 * Tres decisiones que no son de estilo:
 *
 *  · **Ni la tabla ni su contenedor llevan `reveal`.** Esa clase arranca en
 *    `opacity: 0` y solo la revierte el JS del scroll, que se dispara al entrar
 *    en pantalla. La tabla aparece cuando alguien calcula, normalmente ya
 *    dentro del viewport: se quedaría invisible esperando un desplazamiento que
 *    nadie va a hacer.
 *
 *  · **El marcado es idéntico en todos los tamaños de pantalla.** En móvil la
 *    tabla se desplaza en horizontal dentro de su contenedor; no se colapsa a
 *    tarjetas ni se ocultan columnas condicionalmente. Renderizar distinto
 *    según el ancho rompería el determinismo del prerender: en Node no hay
 *    viewport, así que el HTML estático saldría siempre con una variante y la
 *    otra solo aparecería tras montar React.
 *
 *  · **El contenedor de scroll es enfocable** (`tabIndex`) y se anuncia como
 *    región con nombre. Un área que desplaza y no recibe foco es contenido
 *    inalcanzable para quien navega con teclado.
 *
 * Las cifras las formatea `lib/projection.js`, no este componente: un segundo
 * camino para pintar un número acabaría escribiendo dos cifras iguales de
 * formas distintas sin que nada lo delatara.
 */
export function ProjectionTable({ rows, totals, format, labels }) {
  const columns = ['year', 'principal', 'contributed', 'growth', 'total']

  return (
    <div
      className="rbg-scroll"
      data-rbg="table-scroll"
      role="region"
      tabIndex={0}
      aria-label={labels.scrollLabel}
    >
      <table className="rbg-table" data-rbg="table">
        <caption className="rbg-caption">
          {labels.caption} <span className="rbg-unit">{labels.unit}</span>
        </caption>

        <thead>
          <tr>
            {columns.map(key => (
              <th key={key} scope="col">{labels.columns[key]}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map(row => (
            <tr key={row.year}>
              <th scope="row" className="tnum">{row.year}</th>
              <td className="tnum">{formatAmount(row.principal, format)}</td>
              <td className="tnum">{formatAmount(row.contributed, format)}</td>
              <td className="tnum">{formatAmount(row.growth, format)}</td>
              <td className="tnum rbg-strong">{formatAmount(row.total, format)}</td>
            </tr>
          ))}
        </tbody>

        {/* Estado al cierre del horizonte, no la suma de las columnas: el
            capital inicial es constante y el total es un saldo, sumarlos por
            columna no significaría nada. Por eso el rótulo dice «al cierre». */}
        <tfoot>
          <tr>
            <th scope="row">{labels.closing}</th>
            <td className="tnum">{formatAmount(totals.principal, format)}</td>
            <td className="tnum">{formatAmount(totals.contributed, format)}</td>
            <td className="tnum">{formatAmount(totals.growth, format)}</td>
            <td className="tnum rbg-strong">{formatAmount(totals.total, format)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
