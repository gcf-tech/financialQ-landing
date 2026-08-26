import { useState } from 'react'
import { geometry, seriesPoints, bandPoints, gridLines, yearTicks } from '../lib/chart'
import { formatAmount } from '../lib/projection'

/**
 * Gráfico de la proyección: eje X en años, eje Y en importe, con una tarjeta
 * que muestra las cifras del año sobre el que está el puntero.
 *
 * SVG escrito a mano y no una librería de gráficos. Una librería entraría en el
 * paquete inicial de TODAS las rutas —este panel se importa de forma estática—
 * y ninguna de las que servirían aquí pesa menos que las pocas decenas de
 * líneas de `<polyline>` y `<polygon>` que hacen falta.
 *
 * Toda la geometría sale de `lib/chart.js`. Calcular una coordenada aquí dentro
 * la dejaría fuera del único sitio donde se puede comprobar sin mirar el dibujo.
 *
 * Orden de pintado: la banda va PRIMERO. En SVG no hay z-index, manda el orden
 * del documento, y la banda tiene que quedar por debajo de las dos series.
 *
 * La tarjeta se coloca en porcentajes sobre el `viewBox` y no en píxeles: el
 * SVG se estira con su contenedor conservando la proporción, así que un tanto
 * por ciento del lienzo es el mismo punto a cualquier tamaño. Convertir a
 * píxeles obligaría a medir el DOM y a repetirlo en cada redimensionado.
 */
export function ProjectionChart({ projection, format, labels, tip }) {
  const [active, setActive] = useState(null)

  const geo = geometry(projection)
  const grid = gridLines(geo)
  const ticks = yearTicks(geo)
  const rows = projection.rows

  const plotRight = geo.width - geo.padRight
  const plotBottom = geo.height - geo.padBottom
  const slot = (plotRight - geo.padLeft) / Math.max(1, geo.years)

  const row = active === null ? null : rows[active]

  const onKeyDown = event => {
    const step = { ArrowRight: 1, ArrowLeft: -1, Home: -rows.length, End: rows.length }[event.key]
    if (step === undefined) return
    event.preventDefault()
    setActive(prev => {
      const next = (prev === null ? 0 : prev) + step
      return Math.min(rows.length - 1, Math.max(0, next))
    })
  }

  return (
    <div className="rbg-chart-box">
      <svg
        className="rbg-chart"
        data-rbg="chart"
        role="img"
        aria-label={labels.ariaLabel}
        viewBox={`0 0 ${geo.width} ${geo.height}`}
        preserveAspectRatio="xMidYMid meet"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
      >
        <title>{labels.title}</title>
        <desc>{labels.desc}</desc>

        <g className="rbg-grid" aria-hidden="true">
          {grid.map(line => (
            <line key={line.value} x1={geo.padLeft} y1={line.y} x2={plotRight} y2={line.y} />
          ))}
        </g>

        <g className="rbg-axis" aria-hidden="true">
          {grid.map(line => (
            <text key={line.value} x={geo.padLeft - 8} y={line.y + 4} textAnchor="end">
              {formatAmount(line.value, format)}
            </text>
          ))}
          {ticks.map(tick => (
            <text key={tick.year} x={tick.x} y={plotBottom + 20} textAnchor="middle">
              {tick.year}
            </text>
          ))}
        </g>

        {/* Debajo de las dos series. Con la tasa a 0 sus dos bordes coinciden,
            el polígono tiene área cero y no se ve. */}
        <polygon
          className="rbg-band"
          data-rbg-band="dispersion"
          points={bandPoints(projection.band, geo)}
        />

        <polyline
          className="rbg-serie rbg-serie-paid"
          data-rbg-series="paid-in"
          points={seriesPoints(rows, 'paidIn', geo)}
        />
        <polyline
          className="rbg-serie rbg-serie-total"
          data-rbg-series="total"
          points={seriesPoints(rows, 'total', geo)}
        />

        {row && (
          <g className="rbg-marker" aria-hidden="true">
            <line x1={geo.xOf(row.year)} y1={geo.padTop} x2={geo.xOf(row.year)} y2={plotBottom} />
            <circle className="rbg-dot-paid" cx={geo.xOf(row.year)} cy={geo.yOf(row.paidIn)} r="5" />
            <circle className="rbg-dot-total" cx={geo.xOf(row.year)} cy={geo.yOf(row.total)} r="5" />
          </g>
        )}

        {/* Franjas invisibles, una por año: dan al puntero un blanco cómodo en
            lugar de obligar a acertar sobre una línea de dos unidades de grosor.
            `pointer-events` las mantiene sensibles aun siendo transparentes. */}
        <g className="rbg-hit" data-rbg="hit-areas">
          {rows.map((r, i) => (
            <rect
              key={r.year}
              x={geo.xOf(r.year) - slot / 2}
              y={geo.padTop}
              width={slot}
              height={plotBottom - geo.padTop}
              onPointerEnter={() => setActive(i)}
              onPointerDown={() => setActive(i)}
            />
          ))}
        </g>
      </svg>

      {row && (
        <div
          className="rbg-tip"
          data-rbg="tooltip"
          data-side={
            geo.xOf(row.year) / geo.width > 0.72 ? 'left'
              : geo.xOf(row.year) / geo.width < 0.2 ? 'right' : 'center'
          }
          style={{
            left: `${(geo.xOf(row.year) / geo.width) * 100}%`,
            top: `${(geo.yOf(row.total) / geo.height) * 100}%`,
          }}
        >
          <p className="rbg-tip-year">{tip.year} {row.year}</p>
          <dl className="rbg-tip-list">
            <div>
              <dt>{tip.balance}</dt>
              <dd className="tnum rbg-tip-strong">{formatAmount(row.total, format)}</dd>
            </div>
            <div>
              <dt>{tip.principal}</dt>
              <dd className="tnum">{formatAmount(row.paidIn, format)}</dd>
            </div>
            <div>
              <dt>{tip.interest}</dt>
              <dd className="tnum">{formatAmount(row.growth, format)}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}
