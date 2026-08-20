/**
 * Instrumentos de captura ofrecidos al cierre de un artículo.
 *
 * Existe para que el bloque de cierre pueda cambiar de instrumento sin
 * reescribir el componente: cuando existan la calculadora, el cuestionario y
 * la guía, se añaden entradas aquí y el bloque las pinta igual.
 *
 * TODO(instrumentos): el mapeo arquetipo → instrumento vive en
 * `financial-backend/docs/capture-guide.md` §2 (otro repo: esta landing no
 * tiene carpeta `docs/`). De los cinco arquetipos, hoy solo `decisional`
 * apunta a un instrumento construido —`llamada-exploratoria`, el de abajo—;
 * los otros cuatro mapean a instrumentos que no existen. Mientras siga así,
 * por decisión editorial TODOS los artículos cierran con este; ver §9 de esa
 * misma guía.
 *
 * Límite conocido, no es una decisión de diseño: la landing **no puede** elegir
 * instrumento por arquetipo aunque quisiera. `archetype`, `capture_target` y
 * `capture_exempt` viven en el pipeline de n8n y no están declarados en
 * `CreatePostDto` (`financial-backend`), ni en el modelo de datos, ni los
 * devuelve `GET /landings/posts/:slug`. El dato no llega hasta aquí. Como
 * efecto colateral, un artículo marcado `capture_exempt: true` en el pipeline
 * mostrará el bloque igualmente.
 *
 * Forma de cada entrada:
 *
 *   id       Identificador estable del instrumento. Es el mismo vocabulario
 *            que la columna `capture_target` del pipeline.
 *   labelEs  CLAVE del diccionario español, no el texto. El copy vive en
 *   labelEn  CLAVE del diccionario inglés.        `locales/{es,en}/common.json`
 *            como todo el texto del sitio; aquí solo se dice cuál usar. Hoy
 *            las dos claves coinciden porque los dos diccionarios son espejo,
 *            pero se guardan por separado para que un instrumento futuro pueda
 *            colgar de rutas distintas en cada idioma sin tocar el componente.
 *   href     CLAVE INTERNA de ruta (`shared/config/routes.js`), no una URL:
 *            `useAppPath()` la traduce a `/contacto` en ES y `/contact` en EN.
 *            Poner aquí una URL literal rompería una de las dos.
 *   source   Prefijo del valor de atribución que viaja en el query string. Se
 *            completa con el slug del origen → `post-<slug>`.
 */
export const CAPTURE_INSTRUMENTS = {
  'llamada-exploratoria': {
    id: 'llamada-exploratoria',
    labelEs: 'perspectivas.detail.cta.label',
    labelEn: 'perspectivas.detail.cta.label',
    href: 'contacto',
    source: 'post',
  },
}

/**
 * Instrumento que se ofrece al cierre de un artículo. Constante y no un
 * cálculo por arquetipo por lo dicho arriba: el arquetipo no llega a la
 * landing, y es además el único instrumento construido.
 */
export const POST_CAPTURE_INSTRUMENT = 'llamada-exploratoria'
