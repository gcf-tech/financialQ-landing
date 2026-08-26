/**
 * Fuente única de metadatos SEO por ruta.
 *
 * La consumen tres piezas:
 *   1. useDocumentMeta()      → actualiza el <head> en navegación SPA (runtime)
 *   2. scripts/prerender.mjs  → inyecta el <head> real en cada HTML del build
 *   3. public/sitemap.xml     → mismo conjunto de URLs (mantener sincronizado)
 *
 * Regla: las descripciones no superan los 155 caracteres (corte de Google).
 * Verificar con: node scripts/check-seo.mjs
 */

export const SITE_URL = 'https://financialqgroup.com'

/** Idioma por defecto cuando la URL no revela idioma (home, 404, /admin). */
export const DEFAULT_LANG = 'en'

/** Imagen social por defecto. Generada por scripts/gen-images.mjs (1200x630). */
export const OG_IMAGE = `${SITE_URL}/og-image.jpg`

/**
 * Metadatos por página. La clave es el identificador interno usado en
 * ROUTE_SLUGS (src/shared/config/routes.js).
 *
 * `path` es el pathname canónico en cada idioma. Las subpáginas por defecto
 * (`/sobre/firma`, `/enfoque/filosofia`) renderizan exactamente lo mismo que
 * la ruta corta, por eso canonicalizan hacia ella en lugar de tener entrada.
 *
 * `noindex: true` marca una página que EXISTE y se pre-renderiza, pero que
 * todavía no es pública: se sirve con `noindex, nofollow`. No es una propiedad
 * permanente de una página — es un estado por el que pasa mientras su contenido
 * se revisa, y se quita borrando la línea.
 */
export const PAGES = {
  inicio: {
    path: { en: '/', es: '/' },
    title: {
      en: 'FinancialQ Group — Institutional Wealth Management',
      es: 'FinancialQ Group — Gestión Patrimonial Institucional',
    },
    description: {
      en: 'Institutional wealth management under a fiduciary standard: mandate-driven portfolios, explicit risk budgeting and regime-aware allocation.',
      es: 'Gestión patrimonial institucional con estándar fiduciario: carteras por mandato, presupuesto de riesgo explícito y asignación por régimen de mercado.',
    },
  },

  sobre: {
    path: { en: '/about', es: '/sobre' },
    title: {
      en: 'The Firm — FinancialQ Group',
      es: 'La Firma — FinancialQ Group',
    },
    description: {
      en: 'A U.S. SEC-registered, fee-only fiduciary advisor. How FinancialQ Group is structured and why the mandate comes before the product.',
      es: 'Asesor fiduciario registrado ante la SEC y remunerado solo por honorarios. Cómo se estructura FinancialQ Group y por qué el mandato precede al producto.',
    },
  },

  mision: {
    path: { en: '/about/mission', es: '/sobre/mision' },
    title: {
      en: 'Mission and Vision — FinancialQ Group',
      es: 'Misión y Visión — FinancialQ Group',
    },
    description: {
      en: "The firm's purpose: preserving and compounding family capital across generations with institutional discipline and full transparency.",
      es: 'El propósito de la firma: preservar y capitalizar el patrimonio familiar entre generaciones con disciplina institucional y transparencia total.',
    },
  },

  governance: {
    path: { en: '/about/governance', es: '/sobre/governance' },
    title: {
      en: 'Fiduciary Governance — FinancialQ Group',
      es: 'Gobernanza Fiduciaria — FinancialQ Group',
    },
    description: {
      en: 'Fee-only compensation, conflict-of-interest policy and the controls behind every recommendation. What the fiduciary standard means in practice.',
      es: 'Remuneración solo por honorarios, política de conflictos de interés y los controles detrás de cada recomendación. El estándar fiduciario en la práctica.',
    },
  },

  enfoque: {
    path: { en: '/approach', es: '/enfoque' },
    title: {
      en: 'Investment Philosophy — FinancialQ Group',
      es: 'Filosofía de Inversión — FinancialQ Group',
    },
    description: {
      en: 'Portfolios designed by mandate, not by product. The investment philosophy that governs every allocation decision at FinancialQ Group.',
      es: 'Carteras diseñadas por mandato, no por producto. La filosofía de inversión que gobierna cada decisión de asignación en FinancialQ Group.',
    },
  },

  framework: {
    path: { en: '/approach/framework', es: '/enfoque/framework' },
    title: {
      en: 'Methodological Framework — FinancialQ Group',
      es: 'Marco Metodológico — FinancialQ Group',
    },
    description: {
      en: 'The pillars that structure portfolio construction: mandate design, regime-aware allocation, explicit risk budget and long-term capitalization.',
      es: 'Los pilares que estructuran la construcción de carteras: diseño por mandato, asignación por régimen, presupuesto de riesgo y capitalización a largo plazo.',
    },
  },

  proceso: {
    path: { en: '/approach/process', es: '/enfoque/proceso' },
    title: {
      en: 'Investment Process — FinancialQ Group',
      es: 'Proceso de Inversión — FinancialQ Group',
    },
    description: {
      en: 'From mandate definition to ongoing supervision: the repeatable process behind every FinancialQ Group portfolio, step by step.',
      es: 'De la definición del mandato a la supervisión continua: el proceso repetible detrás de cada cartera de FinancialQ Group, paso a paso.',
    },
  },

  riesgo: {
    path: { en: '/approach/risk', es: '/enfoque/riesgo' },
    title: {
      en: 'Risk Philosophy — FinancialQ Group',
      es: 'Filosofía de Riesgo — FinancialQ Group',
    },
    description: {
      en: 'Risk is budgeted, not avoided. How FinancialQ Group measures, allocates and monitors risk across every mandate it manages.',
      es: 'El riesgo se presupuesta, no se evita. Cómo FinancialQ Group mide, asigna y supervisa el riesgo en cada mandato que gestiona.',
    },
  },

  presupuesto: {
    path: { en: '/approach/risk-budget', es: '/enfoque/risk-budget' },
    // La ruta existe, se pre-renderiza y está enlazada en el menú, pero no se
    // anuncia a los buscadores. Anunciarla es una decisión aparte de tenerla
    // construida, y todavía no se ha tomado.
    //
    // Quitar esta línea es lo único que hace falta para volverla pública — y
    // hace algo más: la auditoría del build pasa a EXIGIR sus dos URLs en el
    // sitemap, así que hay que añadirlas en el mismo cambio o se queda en rojo.
    noindex: true,
    title: {
      en: 'Risk Budget Simulator — FinancialQ Group',
      es: 'Simulador de Presupuesto de Riesgo — FinancialQ Group',
    },
    description: {
      en: 'Project a contribution schedule over a horizon and a rate of return you supply. An illustrative tool: not a forecast and not a recommendation.',
      es: 'Proyección de aportes periódicos sobre un horizonte y una rentabilidad que introduce el lector. Herramienta ilustrativa: ni previsión ni recomendación.',
    },
  },

  clientes: {
    path: { en: '/clients', es: '/clientes' },
    title: {
      en: 'Clients We Serve — FinancialQ Group',
      es: 'Clientes que Atendemos — FinancialQ Group',
    },
    description: {
      en: 'High-income professionals, cross-border entrepreneurs, international investors and founders after a liquidity event. Minimum $2M investable assets.',
      es: 'Profesionales de altos ingresos, empresarios transfronterizos, inversionistas internacionales y fundadores tras un evento de liquidez. Mínimo $2M.',
    },
  },

  perspectivas: {
    path: { en: '/perspectives', es: '/perspectivas' },
    title: {
      en: 'Perspectives — FinancialQ Group',
      es: 'Perspectivas — FinancialQ Group',
    },
    description: {
      en: 'Market commentary and research on liquidity, credit spreads, asset allocation and risk, written for long-term capital allocators.',
      es: 'Análisis de mercado sobre liquidez, spreads de crédito, asignación de activos y riesgo, escrito para asignadores de capital a largo plazo.',
    },
  },

  contacto: {
    path: { en: '/contact', es: '/contacto' },
    title: {
      en: 'Contact — FinancialQ Group',
      es: 'Contacto — FinancialQ Group',
    },
    description: {
      en: 'Start a confidential, no-obligation conversation. Offices at 14 Wall Street, New York. Response within 24 business hours.',
      es: 'Inicie una conversación confidencial y sin compromiso. Oficinas en 14 Wall Street, Nueva York. Respuesta en 24 horas hábiles.',
    },
  },
}

/**
 * Rutas que renderizan el mismo contenido que su sección padre.
 * Se canonicalizan hacia la ruta corta para no generar contenido duplicado.
 * Ver AboutUsPage.jsx:24 y OurApproachPage.jsx:25 (sub por defecto).
 */
const CANONICAL_ALIASES = {
  '/about/firm': 'sobre',
  '/sobre/firma': 'sobre',
  '/approach/philosophy': 'enfoque',
  '/enfoque/filosofia': 'enfoque',
}

/** Rutas privadas: se sirven con noindex. */
const NOINDEX_PREFIXES = ['/admin', '/reset-password']

/**
 * Base de las rutas de artículo. Sale de PAGES.perspectivas para que no haya
 * dos sitios donde cambiar el slug de la sección.
 */
const POST_BASE = PAGES.perspectivas.path

/** '/perspectives/liquidity-drives-markets' para (slug, 'en'). */
export function postPath(slug, lang) {
  return `${POST_BASE[lang]}/${slug}`
}

/**
 * Las dos URLs de un artículo. El slug es uno solo y compartido por los dos
 * idiomas (columna `slug` de landing_posts en financial-backend): un post es
 * una fila bilingüe, no un recurso por idioma.
 */
export function postRoutes(slug) {
  return [postPath(slug, 'en'), postPath(slug, 'es')]
}

/** '/perspectivas/foo' → { slug: 'foo', lang: 'es' }. null si no es artículo. */
function parsePostPath(path) {
  for (const lang of ['en', 'es']) {
    const prefix = POST_BASE[lang] + '/'
    if (path.startsWith(prefix)) {
      const slug = path.slice(prefix.length)
      // Un solo segmento: /perspectivas/a/b no es un artículo.
      if (slug && !slug.includes('/')) return { slug, lang }
    }
  }
  return null
}

/**
 * Recorta sin partir palabras. Google corta la description en 155 caracteres,
 * y check-seo.mjs lo verifica ruta por ruta.
 */
function clamp(text, max = 155) {
  const flat = String(text || '').replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  const cut = flat.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:—–-]$/, '') + '…'
}

/**
 * La portada, siempre como URL absoluta: og:image relativa no la resuelve
 * ningún scraper. Las portadas llegan en dos formas — absoluta las que sirve
 * el backend desde la base (/landings/posts/image/:id) y relativa a la raíz
 * las antiguas, que viven en Hostinger (/posts-img/…). Si no hay portada, la
 * imagen social genérica.
 */
function absoluteImage(image) {
  if (!image) return OG_IMAGE
  if (/^https?:\/\//i.test(image)) return image
  return image.startsWith('/') ? SITE_URL + image : OG_IMAGE
}

/**
 * Metadatos de un artículo.
 *
 * Con `article` —el post tal como lo devuelve GET /landings/posts— salen el
 * título y el resumen reales: eso solo lo tiene scripts/prerender.mjs, y es lo
 * que acaba en el HTML servido, que es lo que leen los rastreadores y los
 * scrapers de LinkedIn o X (ninguno ejecuta JS).
 *
 * Sin él —navegación SPA— se cae a los textos de Perspectives. El respaldo no
 * es cosmético: lo importante es que la ruta salga con SU canónica, SU juego de
 * hreflang y sin noindex. Antes de esto `resolveSeo` no reconocía estas rutas,
 * caía en el `?? { key: 'inicio' }` de abajo y useDocumentMeta pisaba en
 * runtime el <head> del prerender con el título de la home y noindex.
 */
function postSeo(slug, lang, article) {
  const page = PAGES.perspectivas
  const content = article?.i18n?.[lang]
  const title = content?.title?.trim()
  const description = clamp(content?.body)

  return {
    lang,
    title: title ? `${title} — FinancialQ Group` : page.title[lang],
    description: description || page.description[lang],
    canonical: SITE_URL + postPath(slug, lang),
    alternates: [
      { hreflang: 'en', href: SITE_URL + postPath(slug, 'en') },
      { hreflang: 'es', href: SITE_URL + postPath(slug, 'es') },
      { hreflang: 'x-default', href: SITE_URL + postPath(slug, DEFAULT_LANG) },
    ],
    noindex: false,
    // La portada del post, no la imagen social genérica: es el motivo por el
    // que un artículo compartido en LinkedIn hoy enseña la tarjeta de la home.
    ogImage: absoluteImage(article?.image),
    ogType: 'article',
  }
}

/** Índice pathname → clave de página, construido una sola vez. */
const PATH_TO_PAGE = {}
for (const [key, page] of Object.entries(PAGES)) {
  for (const lang of ['en', 'es']) {
    PATH_TO_PAGE[page.path[lang]] = { key, lang }
  }
}
// '/' aparece en ambos idiomas; el idioma real de la home lo decide el visitante.
PATH_TO_PAGE['/'] = { key: 'inicio', lang: DEFAULT_LANG }

/** Normaliza un pathname: sin querystring, sin barra final (salvo la raíz). */
function normalize(pathname) {
  const clean = (pathname || '/').split('?')[0].split('#')[0]
  return clean.length > 1 ? clean.replace(/\/+$/, '') : '/'
}

/**
 * Devuelve los metadatos completos de un pathname.
 *
 * @param {string} pathname
 * @param {object} [article] post de GET /landings/posts. Solo lo pasa el
 *   prerender, y solo en rutas de artículo: da el título y el resumen reales.
 * @returns {{
 *   lang: 'en'|'es', title: string, description: string, canonical: string,
 *   alternates: Array<{hreflang: string, href: string}>, noindex: boolean,
 *   ogImage: string, ogType: 'website'|'article'
 * }}
 */
export function resolveSeo(pathname, article) {
  const path = normalize(pathname)

  if (NOINDEX_PREFIXES.some(p => path === p || path.startsWith(p + '/'))) {
    return {
      lang: DEFAULT_LANG,
      title: 'FinancialQ Group',
      description: PAGES.inicio.description[DEFAULT_LANG],
      canonical: SITE_URL + path,
      alternates: [],
      noindex: true,
      ogImage: OG_IMAGE,
      ogType: 'website',
    }
  }

  const post = parsePostPath(path)
  if (post) return postSeo(post.slug, post.lang, article)

  const aliasKey = CANONICAL_ALIASES[path]
  const hit = aliasKey
    ? { key: aliasKey, lang: path.startsWith('/sobre') || path.startsWith('/enfoque') ? 'es' : 'en' }
    : PATH_TO_PAGE[path]

  // Ruta desconocida: App.jsx la resuelve con <Route path="*"> → LandingPage.
  const { key, lang } = hit ?? { key: 'inicio', lang: DEFAULT_LANG }
  const page = PAGES[key]

  const alternates = key === 'inicio'
    ? [{ hreflang: 'x-default', href: SITE_URL + '/' }]
    : [
        { hreflang: 'en', href: SITE_URL + page.path.en },
        { hreflang: 'es', href: SITE_URL + page.path.es },
        { hreflang: 'x-default', href: SITE_URL + page.path[DEFAULT_LANG] },
      ]

  return {
    lang,
    title: page.title[lang],
    description: page.description[lang],
    canonical: SITE_URL + page.path[lang],
    alternates,
    // Dos motivos distintos para lo mismo. El primero es deliberado: una
    // página dada de alta que aún no es pública (ver PAGES). El segundo es el
    // de siempre: una ruta que no reconoce nadie y que React Router resuelve
    // con la home, que no debe indexarse bajo una URL que no le corresponde.
    noindex: page.noindex === true || (!hit && path !== '/'),
    ogImage: OG_IMAGE,
    ogType: 'website',
  }
}

/**
 * Rutas estáticas indexables. Los artículos NO salen de aquí: no se pueden
 * conocer sin preguntarle al backend, y eso lo hace scripts/prerender.mjs en
 * build (ver postRoutes()).
 */
export function allRoutes() {
  const paths = new Set(['/'])
  for (const page of Object.values(PAGES)) {
    paths.add(page.path.en)
    paths.add(page.path.es)
  }
  return [...paths]
}

/**
 * Rutas que existen y se pre-renderizan pero que TODAVÍA no se anuncian: las
 * que su entrada en PAGES marca con `noindex`.
 *
 * Es un estado transitorio, no una categoría. Una ruta está aquí mientras su
 * contenido se revisa, y **sale de aquí borrando la línea `noindex: true` de su
 * entrada en PAGES** — no hay una segunda lista que mantener en paralelo.
 *
 * Que se derive del mismo campo y no de una lista aparte es deliberado. Dos
 * listas diciendo lo mismo acaban discrepando, y el día que discrepen o se
 * anuncia una página que no debía o desaparece del sitemap una que sí. Además
 * la combinación que evitaría —una página con `noindex` listada en el sitemap—
 * es contradictoria de por sí: se le pide a un rastreador que visite una URL
 * para decirle acto seguido que no la indexe.
 *
 * Lo que NO hace: excluirlas del pre-renderizado. El HTML se genera igual, y
 * `scripts/check-seo.mjs` las audita como a cualquier otra. Lo único que cambia
 * es que no se anuncian.
 */
export function unlistedRoutes() {
  const paths = new Set()
  for (const page of Object.values(PAGES)) {
    if (page.noindex !== true) continue
    paths.add(page.path.en)
    paths.add(page.path.es)
  }
  return [...paths]
}

/** Las rutas estáticas que SÍ deben aparecer en public/sitemap.xml. */
export function sitemapRoutes() {
  const unlisted = new Set(unlistedRoutes())
  return allRoutes().filter(route => !unlisted.has(route))
}
