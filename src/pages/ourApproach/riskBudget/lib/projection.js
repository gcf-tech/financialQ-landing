/**
 * Núcleo numérico del simulador de presupuesto de riesgo: proyecta un capital
 * inicial más aportes periódicos y produce las filas de la tabla y las series
 * del gráfico.
 *
 * Este módulo calcula Y formatea, a propósito: así hay un único camino por el
 * que un número llega a la pantalla. Un segundo archivo de formateo abriría el
 * segundo camino, y entonces dos cifras iguales podrían escribirse distinto sin
 * que nada lo delatara.
 *
 * Tres restricciones que se mantienen aunque ya no las exija ningún script:
 *
 *  · **ESM plano, sin JSX y sin importar CSS.** Permite ejercitar el cálculo
 *    desde Node sin navegador ni empaquetador, que es la única forma barata de
 *    probarlo en un repositorio sin marco de pruebas. Un `import './algo.css'`
 *    aquí lo rompería: Node no sabe leer CSS.
 *
 *  · **Determinista y sin reloj.** Cero `Date`, `Date.now()` y `Math.random()`.
 *    Las mismas entradas dan las mismas cifras en cualquier ejecución, y eso es
 *    lo que permite comparar dos corridas sin interpretar diferencias.
 *
 *  · **No importa `assumptions.json`.** Los supuestos entran por parámetro, así
 *    que el módulo no depende de cómo trate cada entorno los atributos de
 *    importación de JSON (Node exige `with { type: 'json' }`; Vite no).
 */

// ---------------------------------------------------------------------------
// Saneado de entrada
// ---------------------------------------------------------------------------

/**
 * Número finito y no negativo, o 0.
 *
 * La entrada viene de campos de formulario, donde «vacío» es `''` y «medio
 * escrito» puede ser `'-'` o `'1e'`. Devolver 0 en vez de `NaN` es lo que
 * mantiene la tabla poblada mientras alguien teclea, en lugar de llenarla de
 * `NaN` en cada pulsación.
 */
function positive(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Como `positive`, pero entero y con un mínimo de 1. Para años y periodos. */
function positiveInt(value, fallback = 1) {
  const n = Math.trunc(positive(value))
  return n > 0 ? n : fallback
}

/** Redondeo a unidad monetaria entera. El simulador no muestra centavos. */
function toMoney(value) {
  return Math.round(value)
}

/**
 * Normaliza la entrada cruda del formulario.
 *
 * `annualRatePct` es un porcentaje anual nominal (5 = 5 %), no una fracción, y
 * 0 es un valor legítimo y el estado inicial: significa ausencia de
 * rendimiento, no rendimiento desconocido.
 */
export function normalizeInput(raw) {
  return {
    initial: positive(raw?.initial),
    contribution: positive(raw?.contribution),
    periodsPerYear: positiveInt(raw?.periodsPerYear),
    years: positiveInt(raw?.years),
    annualRatePct: positive(raw?.annualRatePct),
  }
}

// ---------------------------------------------------------------------------
// Proyección
// ---------------------------------------------------------------------------

/**
 * Saldo al cierre de cada año, del año 0 (capital inicial, nada aportado aún)
 * al año N. Devuelve `years + 1` valores.
 *
 * Se itera periodo a periodo en lugar de aplicar la fórmula cerrada de la
 * renta: son 240 iteraciones para el caso típico —coste irrelevante— y a
 * cambio el código dice literalmente cuál es el supuesto, sin el caso especial
 * que la fórmula cerrada necesita cuando la tasa es 0 (división por cero).
 */
function balancesByYear(input, annualRatePct) {
  const periodRate = annualRatePct / 100 / input.periodsPerYear
  const out = [input.initial]
  let balance = input.initial

  for (let year = 1; year <= input.years; year++) {
    for (let period = 0; period < input.periodsPerYear; period++) {
      // El aporte entra al FINAL del periodo (renta ordinaria): no capitaliza
      // dentro del periodo en que se hace. Es el supuesto declarado en
      // assumptions.json como `contributionTiming: "end-of-period"`, y el
      // bloque de supuestos del panel tiene que decirlo con esas palabras.
      balance = balance * (1 + periodRate) + input.contribution
    }
    out.push(balance)
  }

  return out
}

/**
 * Proyección completa.
 *
 * @param {object} raw entrada del formulario, sin sanear
 * @param {object} [options]
 * @param {number} [options.spread] dispersión como fracción RELATIVA de la
 *   tasa: 0.25 proyecta también a tasa × 0.75 y tasa × 1.25. Relativa y no
 *   absoluta por una razón que es requisito, no preferencia: con tasa 0 las
 *   tres proyecciones coinciden y la banda sale de anchura cero, que es lo que
 *   debe ver el estado inicial —no hay rendimiento, luego no hay incertidumbre
 *   sobre el rendimiento—.
 *
 * @returns {{
 *   input: object,
 *   rows: Array<{year:number, principal:number, contributed:number,
 *                paidIn:number, growth:number, total:number}>,
 *   band: Array<{year:number, low:number, high:number}>,
 *   totals: object
 * }}
 */
export function project(raw, options = {}) {
  const input = normalizeInput(raw)
  const spread = Math.min(Math.max(positive(options.spread), 0), 1)

  const base = balancesByYear(input, input.annualRatePct)
  const low = balancesByYear(input, input.annualRatePct * (1 - spread))
  const high = balancesByYear(input, input.annualRatePct * (1 + spread))

  const principal = toMoney(input.initial)

  const rows = base.map((balance, year) => {
    const contributed = toMoney(input.contribution * input.periodsPerYear * year)
    const total = toMoney(balance)
    const paidIn = principal + contributed

    return {
      year,
      principal,
      contributed,
      // Lo puesto: capital inicial más aportes acumulados. Es la segunda serie
      // del gráfico y con tasa 0 coincide exactamente con `total`, que es por
      // lo que el estado inicial dibuja dos líneas superpuestas.
      paidIn,
      // Se DERIVA de las otras cifras ya redondeadas en lugar de redondearse
      // por su cuenta. Redondeando cada columna aparte, la suma de las tres
      // podía separarse del total en una unidad y la tabla mostraría una
      // identidad que no cuadra. Así `principal + contributed + growth` es
      // `total` exactamente, en toda fila, y el verificador puede exigirlo sin
      // margen de tolerancia.
      growth: total - paidIn,
      total,
    }
  })

  const band = base.map((_, year) => ({
    year,
    low: toMoney(low[year]),
    high: toMoney(high[year]),
  }))

  // Estado al cierre del horizonte, no la suma de las columnas: `principal` es
  // constante y `total` es un saldo, sumarlos por columna no significaría nada.
  // El <tfoot> del panel debe rotularse como cierre, no como total.
  return { input, rows, band, totals: rows[rows.length - 1] }
}

// ---------------------------------------------------------------------------
// Formateo
// ---------------------------------------------------------------------------

/**
 * Separadores por defecto. Los reales llegan de `assumptions.json` para que el
 * componente y el verificador no puedan divergir.
 */
export const DEFAULT_FORMAT = { group: ',', decimal: '.' }

/**
 * Agrupa millares. Escrito a mano en lugar de `Intl.NumberFormat` por dos
 * motivos, y el segundo es el que manda:
 *
 *  1. `Intl` inserta según la versión de ICU un espacio normal, uno duro
 *     (U+00A0) o uno fino duro (U+202F). Node y el navegador no siempre traen
 *     la misma, así que el separador es invisible Y variable.
 *  2. El verificador compara cadenas contra el HTML generado. Un separador
 *     que cambia entre la máquina que construye y la que audita produce un
 *     fallo intermitente imposible de leer: dos cifras idénticas en pantalla
 *     que no coinciden byte a byte.
 */
export function formatAmount(value, format = DEFAULT_FORMAT) {
  const n = Math.round(Number(value) || 0)
  const digits = String(Math.abs(n))
  const group = format?.group ?? DEFAULT_FORMAT.group

  let out = ''
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += group
    out += digits[i]
  }

  return (n < 0 ? '-' : '') + out
}

/**
 * Porcentaje con hasta dos decimales y sin ceros de cola: 0 → «0», 5 → «5»,
 * 7.5 → «7.5», 7.25 → «7.25». `toFixed` está especificado por el lenguaje y no
 * depende del idioma, al contrario que `Intl`.
 *
 * El símbolo de porcentaje NO se añade aquí: es texto y vive en los
 * diccionarios como todo lo demás.
 */
export function formatRate(value, format = DEFAULT_FORMAT) {
  const n = positive(value)
  const decimal = format?.decimal ?? DEFAULT_FORMAT.decimal

  // El punto sobrevive al recorte de ceros y frena el reemplazo, así que
  // '10.00' queda en '10' y no en '1'.
  const text = n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')

  return text.replace('.', decimal)
}
