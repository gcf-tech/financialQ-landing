/**
 * Geometría del gráfico del simulador: convierte las filas de `projection.js`
 * en las cadenas exactas que van a los atributos `points` del SVG.
 *
 * Está separado del componente por el mismo motivo por el que el formateo vive
 * en `projection.js`: la aritmética de la escala y de los vértices se puede
 * ejercitar sola, desde Node, sin montar un navegador. Dentro del JSX solo
 * sería observable mirando el dibujo.
 *
 * Rigen las mismas tres restricciones que en `projection.js`: ESM plano sin
 * JSX ni CSS, determinista y sin reloj, y sin importar `assumptions.json`.
 */

/**
 * Lienzo en unidades de `viewBox`, no en píxeles: el SVG se estira con su
 * contenedor y estas cifras solo fijan proporciones y el sitio de los ejes.
 * El margen izquierdo es el mayor porque ahí van las cifras del eje vertical.
 */
export const CANVAS = {
  width: 720,
  height: 320,
  padTop: 12,
  padRight: 12,
  padBottom: 32,
  padLeft: 64,
}

/**
 * Dos decimales fijos. Sin esto, una coordenada podría salir con 17 dígitos
 * significativos y la comparación del verificador dependería del último bit de
 * una división. Con esto la cadena es estable y además el SVG pesa menos.
 */
function round2(value) {
  return Math.round(value * 100) / 100
}

/**
 * Techo "redondo" del eje vertical: 1, 2, 2.5 o 5 por la potencia de diez que
 * toque.
 *
 * La potencia se busca multiplicando enteros y NO con `Math.log10`. La
 * especificación no obliga a que `Math.log10` esté correctamente redondeada, y
 * en una potencia exacta de diez un error de un ulp hace que `Math.floor` caiga
 * un escalón: la escala entera del eje cambiaría según la máquina, que es justo
 * el fallo intermitente que este módulo existe para no tener.
 */
export function niceMax(value) {
  if (!Number.isFinite(value) || value <= 0) return 1

  let pow = 1
  while (pow * 10 <= value) pow *= 10

  const norm = value / pow
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10

  return step * pow
}

/**
 * Escala del gráfico a partir de la proyección.
 *
 * El techo mira las tres curvas —saldo, aportado y borde alto de la banda—
 * porque con una tasa alta la banda supera al saldo y se saldría del lienzo.
 *
 * @param {{rows: Array, band: Array}} projection salida de `project()`
 */
export function geometry({ rows, band }) {
  const peak = Math.max(
    0,
    ...rows.map(r => r.total),
    ...rows.map(r => r.paidIn),
    ...band.map(b => b.high),
  )

  const max = niceMax(peak)
  const years = rows.length > 1 ? rows[rows.length - 1].year : 1

  const plotWidth = CANVAS.width - CANVAS.padLeft - CANVAS.padRight
  const plotHeight = CANVAS.height - CANVAS.padTop - CANVAS.padBottom

  return {
    ...CANVAS,
    max,
    years,
    plotWidth,
    plotHeight,
    xOf: year => round2(CANVAS.padLeft + (year / years) * plotWidth),
    yOf: value => round2(CANVAS.padTop + plotHeight - (value / max) * plotHeight),
  }
}

/**
 * Vértices de una serie, del año 0 al último. Un punto por fila, así que el
 * verificador puede exigir que el número de vértices sea el número de filas.
 *
 * @param {Array} rows filas de `project()`
 * @param {'total'|'paidIn'} key
 */
export function seriesPoints(rows, key, geo) {
  return rows.map(row => `${geo.xOf(row.year)},${geo.yOf(row[key])}`).join(' ')
}

/**
 * Contorno cerrado de la banda de dispersión: el borde bajo de izquierda a
 * derecha y el alto de vuelta. Dos vértices por año.
 *
 * Con tasa 0 los dos bordes coinciden con el saldo, el polígono tiene área cero
 * y no se ve nada — que es lo correcto: sin rendimiento no hay incertidumbre
 * sobre el rendimiento que dibujar.
 */
export function bandPoints(band, geo) {
  const low = band.map(b => `${geo.xOf(b.year)},${geo.yOf(b.low)}`)
  const high = band.map(b => `${geo.xOf(b.year)},${geo.yOf(b.high)}`).reverse()

  return [...low, ...high].join(' ')
}

/**
 * Líneas horizontales de la retícula, de 0 al techo. Devuelve el valor —para
 * rotularlo— y la coordenada.
 */
export function gridLines(geo, steps = 4) {
  const out = []
  for (let i = 0; i <= steps; i++) {
    const value = (geo.max / steps) * i
    out.push({ value, y: geo.yOf(value) })
  }
  return out
}

/**
 * Años que se rotulan en el eje horizontal. Rotularlos todos amontona el eje en
 * un horizonte largo, así que se toma uno de cada `paso`, siempre incluyendo el
 * primero y el último para que el eje no mienta sobre dónde empieza y acaba.
 */
export function yearTicks(geo, maxTicks = 6) {
  const step = Math.max(1, Math.ceil(geo.years / maxTicks))
  const out = []

  for (let year = 0; year <= geo.years; year += step) out.push(year)
  if (out[out.length - 1] !== geo.years) out.push(geo.years)

  return out.map(year => ({ year, x: geo.xOf(year) }))
}
