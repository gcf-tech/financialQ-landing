/**
 * Datos que el build inyecta en el render de Node, y solo ahí.
 *
 * Por qué existe: las páginas de Perspectives piden sus datos al backend en un
 * `useEffect`, y en `renderToPipeableStream` los efectos no corren. Sin una
 * semilla, el HTML estático del listado sale con "Cargando artículos…" y cero
 * artículos — que es justo el agujero que documentaba PRERENDER-TODO.md §1.
 *
 * Cómo: `scripts/prerender.mjs` escribe `globalThis.__PRERENDER__` antes de
 * renderizar cada ruta, y las páginas lo usan ÚNICAMENTE como valor inicial de
 * `useState`. En el navegador el global no existe, así que esto devuelve `{}` y
 * todo se comporta exactamente igual que antes: manda el fetch del efecto.
 * Por eso la navegación SPA no cambia y no hace falta hidratar.
 *
 * Contrato (lo escribe scripts/prerender.mjs, lo leen las dos páginas):
 *   { posts: Array<Post>, post: Post|null }
 *
 * @returns {{posts?: Array<object>, post?: object|null}}
 */
export function prerenderData() {
  const data = globalThis.__PRERENDER__
  return data && typeof data === 'object' ? data : {}
}
