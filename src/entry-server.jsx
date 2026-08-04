import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { I18nProvider } from './shared/config/locales/i18nContext'
import './index.css'
import App from './App.jsx'

/**
 * Entrada del build SSR. NO se envía al navegador: la usa
 * scripts/prerender.mjs para generar el HTML estático de cada ruta.
 *
 * Sin StrictMode a propósito — en renderToString solo duplicaría trabajo, y
 * el doble render de StrictMode únicamente aporta en el cliente.
 *
 * @param {string} url pathname a renderizar, e.g. '/approach/risk'
 * @returns {string} markup del contenido de <div id="root">
 */
export function render(url) {
  return renderToString(
    <StaticRouter location={url}>
      <I18nProvider>
        <App />
      </I18nProvider>
    </StaticRouter>
  )
}
