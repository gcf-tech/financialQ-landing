import { useRef, useState } from 'react'
import { Footer } from '../../../widgets/footer/Footer'
import { useScrollReveal } from '../../../shared/lib/useScrollReveal'
import { useTranslation } from '../../../shared/config/locales/i18nContext'
import { useAppNavigate, useAppPath } from '../../../shared/lib/useAppNavigate'
import { project, formatAmount } from './lib/projection'
import { ProjectionChart } from './ui/ProjectionChart'
import { ProjectionTable } from './ui/ProjectionTable'
import assumptions from './assumptions.json'
import './ui/riskBudget.css'

/**
 * Simulador de presupuesto de riesgo.
 *
 * **La página no enseña ninguna cifra hasta que alguien calcula.** Los campos
 * arrancan vacíos y el resumen, el gráfico y la tabla no existen hasta que hay
 * un resultado. Sembrar los campos con valores de ejemplo llenaba la página de
 * filas de números que nadie había pedido, y eso se lee como una maqueta.
 *
 * Las etiquetas de los campos son preguntas, no rótulos, y el resultado abre
 * con tres cifras grandes antes del detalle: la página tiene que funcionar como
 * una calculadora que alguien usa por su cuenta, no como una ficha de producto.
 *
 * La consecuencia hay que tenerla presente al tocar esto: **el HTML que produce
 * el prerenderizado sale sin resumen, sin gráfico y sin tabla**, porque en Node
 * nadie pulsa el botón. Un cliente que no ejecuta JavaScript recibe el
 * formulario, los supuestos y el cierre — contenido real, pero no la
 * proyección. Es una decisión tomada a sabiendas, no un descuido.
 *
 * Los módulos de `lib/` siguen siendo ESM plano, deterministas y sin reloj. Ya
 * no lo exige ninguna auditoría, pero mantiene el cálculo separado de la
 * interfaz y no cuesta nada.
 */

/** Campos vacíos. La frecuencia necesita un valor: un `select` no tiene «nada». */
const EMPTY_FORM = {
  initial: '',
  contribution: '',
  frequency: assumptions.defaults.frequency,
  years: '',
  annualRatePct: '',
}

export function RiskBudgetPage() {
  useScrollReveal()
  const { t } = useTranslation()
  const href = useAppPath()
  const go = useAppNavigate()
  const tr = t.enfoque.riskBudget

  const resultsRef = useRef(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(false)

  const set = field => event =>
    setForm(prev => ({ ...prev, [field]: event.target.value }))

  const onSubmit = event => {
    event.preventDefault()

    const projection = project(
      {
        initial: form.initial,
        contribution: form.contribution,
        periodsPerYear: assumptions.periodsPerYear[form.frequency],
        years: form.years,
        annualRatePct: form.annualRatePct,
      },
      { spread: assumptions.dispersion.spread },
    )

    // Sin capital inicial y sin aportes no hay nada que proyectar: la tabla
    // saldría con veinte filas de ceros, que es peor que no salir.
    if (projection.input.initial === 0 && projection.input.contribution === 0) {
      setError(true)
      setResult(null)
      return
    }

    setError(false)
    setResult(projection)

    // Se lleva el resultado a la vista. En un móvil el formulario ocupa toda la
    // pantalla y el resumen nace por debajo del pliegue: sin esto, pulsar el
    // botón parece no hacer nada. Se espera al siguiente fotograma porque en
    // este punto React todavía no ha pintado el bloque. El desplazamiento suave
    // y el margen de anclaje —que descuenta las dos barras fijas— son de CSS.
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ block: 'start' })
    })
  }

  // Se mira el valor ya saneado y no el del formulario: un campo vacío y un
  // cero significan lo mismo para el cálculo, y tienen que significar lo mismo
  // para el aviso.
  const isBaseline = result?.input.annualRatePct === 0

  const [h1, h2, h3] = tr.hero.headline
  const contactSearch = '?source=risk-budget'

  // Patrón de navegación interna del repo: ancla real y click interceptado.
  const onContactClick = event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    go('contacto', null, contactSearch)
  }

  // Ojo con `step`: en un campo numérico no es solo el salto de las flechas,
  // es una restricción de validación. Con un salto de 100 el navegador rechaza
  // un aporte de 750 y bloquea el envío sin que la página pueda decir por qué.
  // Por eso los tres campos de importe y tasa van con `any` y solo el horizonte
  // lleva salto entero, que ahí sí es un requisito real.
  const limits = assumptions.limits

  return (
    <div>
      <section className="s-rbg">
        <div className="rbg-hero">
          <div className="wrap">
            <span className="eyebrow reveal">{tr.hero.eyebrow}</span>
            <h1 className="rbg-hero-headline reveal d1">
              {h1}<br />
              {h2}<br />
              <em>{h3}</em>
            </h1>
            <p className="rbg-hero-body reveal d2">{tr.hero.body}</p>
          </div>
        </div>

        {/* Nada dentro del panel lleva `reveal`: esa clase arranca en opacity:0
            y solo la revierten el JS del scroll o el @media (scripting: none). */}
        <div className="rbg-panel" data-rbg="panel">
          <div className="wrap">
            {/* Ningún control lleva `name`, y no es descuido. Sin JavaScript el
                botón envía el formulario, y un envío por GET pondría en la URL
                —y con ella en el historial y en la cabecera Referer— las cifras
                que haya tecleado quien la use. Un formulario solo serializa los
                controles con `name`, así que sin ellos no se filtra ninguna. */}
            <form className="rbg-form" onSubmit={onSubmit}>
              <fieldset className="rbg-inputs">
                <legend className="rbg-inputs-legend">{tr.inputs.legend}</legend>

                <div className="rbg-field">
                  <label htmlFor="rbg-initial">{tr.inputs.initial.label}</label>
                  <input
                    id="rbg-initial"
                    className="tnum"
                    type="number"
                    inputMode="decimal"
                    value={form.initial}
                    onChange={set('initial')}
                    min={limits.initial.min}
                    max={limits.initial.max}
                    step={limits.initial.step}
                  />
                  <p className="rbg-hint">{tr.inputs.initial.hint}</p>
                </div>

                <div className="rbg-field">
                  <label htmlFor="rbg-years">
                    {tr.inputs.years.label} <span className="rbg-unit">{tr.inputs.years.unit}</span>
                  </label>
                  <input
                    id="rbg-years"
                    className="tnum"
                    type="number"
                    inputMode="numeric"
                    required
                    value={form.years}
                    onChange={set('years')}
                    min={limits.years.min}
                    max={limits.years.max}
                    step={limits.years.step}
                  />
                  <p className="rbg-hint">{tr.inputs.years.hint}</p>
                </div>

                {/* El único campo con tratamiento propio: es un supuesto de quien
                    usa la herramienta, no una cifra de la firma. Se deja
                    opcional a propósito — vacío equivale a cero, que es la línea
                    base de solo aportes. */}
                <div className="rbg-field rbg-field-rate">
                  <label htmlFor="rbg-rate">
                    {tr.inputs.rate.label} <span className="rbg-unit">{tr.inputs.rate.unit}</span>
                  </label>
                  <input
                    id="rbg-rate"
                    className="tnum"
                    type="number"
                    inputMode="decimal"
                    value={form.annualRatePct}
                    onChange={set('annualRatePct')}
                    min={limits.annualRatePct.min}
                    max={limits.annualRatePct.max}
                    step={limits.annualRatePct.step}
                  />
                  <p className="rbg-hint">{tr.inputs.rate.hint}</p>
                </div>

                <div className="rbg-field">
                  <label htmlFor="rbg-contribution">{tr.inputs.contribution.label}</label>
                  <input
                    id="rbg-contribution"
                    className="tnum"
                    type="number"
                    inputMode="decimal"
                    value={form.contribution}
                    onChange={set('contribution')}
                    min={limits.contribution.min}
                    max={limits.contribution.max}
                    step={limits.contribution.step}
                  />
                  <p className="rbg-hint">{tr.inputs.contribution.hint}</p>
                </div>

                <div className="rbg-field">
                  <label htmlFor="rbg-frequency">{tr.inputs.frequency.label}</label>
                  <select id="rbg-frequency" value={form.frequency} onChange={set('frequency')}>
                    {Object.keys(assumptions.periodsPerYear).map(key => (
                      <option key={key} value={key}>{tr.inputs.frequency.options[key]}</option>
                    ))}
                  </select>
                </div>
              </fieldset>

              <div className="rbg-actions">
                <button type="submit" className="btn-solid rbg-calc">
                  {tr.actions.calculate}
                </button>
                {error && (
                  <p className="rbg-error" role="alert">{tr.errors.amount}</p>
                )}
              </div>
            </form>

            {/* El resultado se anuncia cuando aparece: quien navega con lector de
                pantalla pulsa el botón y el foco no se mueve, así que sin esto no
                habría forma de saber que abajo hay una tabla nueva. */}
            <div className="rbg-results" ref={resultsRef} aria-live="polite">
              {result && (
                <>
                  {/* Lo primero que se ve al calcular: las tres cifras que
                      resumen el resultado. Suman exactamente —aportado más
                      interés es el saldo—, porque el interés se deriva de las
                      otras dos ya redondeadas en `lib/projection.js`. */}
                  <div className="rbg-summary" data-rbg="summary">
                    <p className="rbg-summary-title">{tr.summary.title}</p>
                    <dl className="rbg-summary-grid">
                      <div className="rbg-summary-item rbg-summary-lead">
                        <dt>{tr.summary.balance}</dt>
                        <dd className="tnum">{formatAmount(result.totals.total, assumptions.format)}</dd>
                      </div>
                      <div className="rbg-summary-item">
                        <dt>{tr.summary.contributed}</dt>
                        <dd className="tnum">{formatAmount(result.totals.paidIn, assumptions.format)}</dd>
                      </div>
                      <div className="rbg-summary-item">
                        <dt>{tr.summary.interest}</dt>
                        <dd className="tnum">{formatAmount(result.totals.growth, assumptions.format)}</dd>
                      </div>
                    </dl>
                  </div>

                  {isBaseline && (
                    <div className="rbg-baseline" data-rbg="baseline" role="note">
                      <p className="rbg-baseline-title">{tr.baseline.title}</p>
                      <p className="rbg-baseline-body">{tr.baseline.body}</p>
                      <p className="rbg-baseline-cta">{tr.baseline.cta}</p>
                    </div>
                  )}

                  <div className="rbg-chart-wrap">
                    <ProjectionChart
                      projection={result}
                      format={assumptions.format}
                      labels={tr.chart}
                      tip={tr.tooltip}
                    />
                    <ul className="rbg-legend">
                      <li className="rbg-legend-total">{tr.chart.series.total}</li>
                      <li className="rbg-legend-paid">{tr.chart.series.paidIn}</li>
                      <li className="rbg-legend-band">{tr.chart.series.band}</li>
                    </ul>
                    <p className="rbg-axes">
                      <span>{tr.chart.axisX}</span>
                      <span>{tr.chart.axisY}</span>
                    </p>
                  </div>

                  <ProjectionTable
                    rows={result.rows.slice(1)}
                    totals={result.totals}
                    format={assumptions.format}
                    labels={tr.table}
                  />
                </>
              )}
            </div>

            <div className="rbg-assumptions">
              <h2 className="rbg-block-title">{tr.assumptions.title}</h2>
              <ul>
                {tr.assumptions.items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>

            {/*
              Aquí iba un bloque de advertencias con seis puntos —naturaleza
              ilustrativa del cálculo, carácter hipotético de los resultados,
              que la herramienta no selecciona ni favorece inversiones, que
              otras no consideradas pueden ser comparables, y que nada de esto
              es asesoramiento personalizado—. Se retiró por decisión editorial.

              El borrador redactado no se perdió: está archivado en
              `notes/copy-brief-risk-budget.md`, con el mapeo de qué punto
              cubría cada casilla. Reponerlo es devolver las claves al
              diccionario y este `<ol>`, que las pintaba con un `.map()`.

              El bloque de supuestos de arriba se queda: describe cómo calcula
              la herramienta, no es materia de cumplimiento.
            */}
            <div className="rbg-closing">
              <h2 className="rbg-closing-title">{tr.closing.title}</h2>
              <p className="rbg-closing-body">{tr.closing.body}</p>
              {/* Anclas reales con las clases del botón compartido, no el
                  componente `Button`: ese renderiza un <div> o un <button>, y
                  aquí hacen falta enlaces que un rastreador pueda seguir y que
                  funcionen sin JS. */}
              <div className="rbg-closing-actions">
                {/* Este enlace NO intercepta el click, al contrario que el resto
                    de la navegación interna: lleva ancla, y la navegación por
                    router hace scroll al principio de la página de destino, que
                    es lo contrario de lo que pide un ancla. */}
                <a className="btn-ghost" href={href('perspectivas', null, '#newsletter')}>
                  {tr.closing.newsletter}
                </a>
                {/* Solo viaja el origen. Ninguna cifra introducida por quien usa
                    el simulador entra en la URL. */}
                <a
                  className="btn-solid"
                  href={href('contacto', null, contactSearch)}
                  onClick={onContactClick}
                >
                  {tr.closing.contact}
                </a>
              </div>
            </div>

            <p className="rbg-version" data-rbg="version">
              {tr.version.label} {assumptions.version}
            </p>
          </div>
        </div>
      </section>

      <Footer variant="mini" />
    </div>
  )
}
