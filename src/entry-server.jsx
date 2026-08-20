import { prerenderToNodeStream } from 'react-dom/static'
import { Writable } from 'node:stream'
import { Buffer } from 'node:buffer'
import { StaticRouter } from 'react-router-dom'
import { I18nProvider } from './shared/config/locales/i18nContext'
import './index.css'
import App from './App.jsx'

/**
 * Entrada del build SSR. NO se envía al navegador: la usa
 * scripts/prerender.mjs para generar el HTML estático de cada ruta.
 *
 * Sin StrictMode a propósito — en el render de servidor solo duplicaría
 * trabajo, y el doble render de StrictMode únicamente aporta en el cliente.
 *
 * Por qué `prerenderToNodeStream` (react-dom/static) y no las otras dos:
 *
 *  · `renderToString` **no soporta Suspense**, y `PostDetailPage` entra por
 *    `React.lazy` dentro del `<Suspense>` de App.jsx. Abortaba el subárbol y
 *    las rutas de artículo salían en blanco. Lo decía el propio React en el
 *    markup que emitía: «please switch to "renderToPipeableStream"».
 *
 *  · `renderToPipeableStream` sí resuelve el Suspense, pero es una API de
 *    *streaming*: el contenido del boundary no va en su sitio, sino en un
 *    `<div hidden id="S:0">` al final del documento, con un `<template>` de
 *    marca y un script que lo mueve al montar. Eso está bien para servir por
 *    HTTP, pero aquí es justo lo contrario de lo que se busca: el rastreador
 *    que no ejecuta JS —que es TODO el motivo de este prerender— se encontraba
 *    el `<main>` con un comentario dentro y el contenido escondido. Se probó,
 *    se vio en el HTML generado y se descartó por eso.
 *
 *  · `prerenderToNodeStream` está hecha para generación estática: espera a que
 *    todo resuelva y devuelve el HTML **completo y en orden**, con el contenido
 *    del Suspense en su sitio y sin scripts de reconstrucción.
 *
 * `Buffer` se importa de node:buffer en vez de usar el global porque el ESLint
 * del repo solo declara los globals del navegador (eslint.config.js).
 *
 * @param {string} url pathname a renderizar, e.g. '/approach/risk'
 * @returns {Promise<string>} markup del contenido de <div id="root">
 */
export async function render(url) {
  const { prelude } = await prerenderToNodeStream(
    <StaticRouter location={url}>
      <I18nProvider>
        <App />
      </I18nProvider>
    </StaticRouter>,
    {
      // En un build, cualquier error de render es un error de build: se
      // propaga en vez de degradar a un HTML a medias.
      onError(error) {
        throw error
      },
    },
  )

  return await new Promise((resolve, reject) => {
    const chunks = []
    const sink = new Writable({
      write(chunk, _encoding, done) {
        chunks.push(chunk)
        done()
      },
    })

    // Concatenar los Buffer y decodificar UNA vez al final: un carácter UTF-8
    // puede quedar partido entre dos chunks, y decodificarlos uno a uno lo
    // rompería (los títulos llevan acentos y comillas tipográficas).
    sink.on('finish', () => resolve(Buffer.concat(chunks).toString('utf8')))
    prelude.on('error', reject)
    prelude.pipe(sink)
  })
}
