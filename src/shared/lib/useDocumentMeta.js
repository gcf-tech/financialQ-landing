import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { resolveSeo } from '../config/seo'

/**
 * Mantiene el <head> sincronizado con la ruta activa.
 *
 * El HTML servido ya trae el <head> correcto (lo inyecta scripts/prerender.mjs
 * en build). Este hook solo cubre la navegación SPA posterior, donde el
 * documento no se recarga: sin él, título, canonical y Open Graph se quedarían
 * congelados en los de la primera página visitada.
 *
 * Fuente de los datos: src/shared/config/seo.js
 */

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]:not([hreflang])`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function replaceAlternates(alternates) {
  document.head
    .querySelectorAll('link[rel="alternate"][hreflang]')
    .forEach(el => el.remove())

  for (const { hreflang, href } of alternates) {
    const el = document.createElement('link')
    el.setAttribute('rel', 'alternate')
    el.setAttribute('hreflang', hreflang)
    el.setAttribute('href', href)
    document.head.appendChild(el)
  }
}

export function useDocumentMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const seo = resolveSeo(pathname)

    document.title = seo.title
    document.documentElement.lang = seo.lang

    upsertMeta('name', 'description', seo.description)
    upsertMeta('name', 'robots', seo.noindex ? 'noindex, nofollow' : 'index, follow')

    upsertMeta('property', 'og:title', seo.title)
    upsertMeta('property', 'og:description', seo.description)
    upsertMeta('property', 'og:url', seo.canonical)
    upsertMeta('property', 'og:image', seo.ogImage)
    upsertMeta('property', 'og:locale', seo.lang === 'es' ? 'es_ES' : 'en_US')

    upsertMeta('name', 'twitter:title', seo.title)
    upsertMeta('name', 'twitter:description', seo.description)
    upsertMeta('name', 'twitter:image', seo.ogImage)

    upsertLink('canonical', seo.canonical)
    replaceAlternates(seo.alternates)
  }, [pathname])
}
