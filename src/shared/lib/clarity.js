/**
 * Microsoft Clarity — carga diferida y fuera de las rutas admin.
 *
 * Por qué no va en el <head> de index.html, que es donde Microsoft pone su
 * snippet: ese archivo es la plantilla de las 21 rutas pre-renderizadas
 * (scripts/prerender.mjs) y se parsea antes que nada. Cargando el tag después
 * del evento `load` no compite con el render inicial ni toca LCP/TBT.
 *
 * Por qué se excluyen las rutas admin: Clarity graba la sesión y registra la
 * URL completa, y /reset-password lleva el token del correo en el query string.
 *
 * LÍMITE CONOCIDO: la API cliente de Clarity no tiene comando para detener la
 * grabación una vez cargada — solo consent/identify/set/event/upgrade (ver
 * https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api).
 * Por eso este guard solo puede decidir en la carga inicial: si alguien entra
 * por una página pública y navega a /admin dentro de la misma sesión SPA,
 * Clarity ya está corriendo. Para ese caso las páginas admin llevan
 * `data-clarity-mask="true"`, que impide que su contenido se suba.
 */

const PROJECT_ID = 'xxra4aytiu'

// Prefijos que no se graban. Deben coincidir con las rutas admin de App.jsx.
const EXCLUDED = ['/admin', '/reset-password']

function isExcluded(pathname) {
  return EXCLUDED.some(base => pathname === base || pathname.startsWith(`${base}/`))
}

/**
 * Equivalente al snippet oficial, escrito legible: deja la cola de comandos
 * lista (para que un clarity('event', …) disparado antes de que baje el script
 * no se pierda) e inserta el tag async.
 */
function inject() {
  window.clarity = window.clarity || function () {
    (window.clarity.q = window.clarity.q || []).push(arguments)
  }

  const tag = document.createElement('script')
  tag.async = true
  tag.src = `https://www.clarity.ms/tag/${PROJECT_ID}`
  document.head.appendChild(tag)
}

/** Se llama una vez desde main.jsx. */
export function initClarity() {
  // El build SSR (entry-server.jsx) no pasa por main.jsx, pero el guard evita
  // sorpresas si algún día esto se importa desde un módulo compartido.
  if (typeof window === 'undefined') return

  if (isExcluded(window.location.pathname)) return

  if (document.readyState === 'complete') inject()
  else window.addEventListener('load', inject, { once: true })
}
