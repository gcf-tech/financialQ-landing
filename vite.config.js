import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Copia archivos de /public al dist/ en cada build.
    // Mueve el .htaccess a /public para que Vite lo incluya automáticamente.
    // Ver: https://vite.dev/guide/assets#the-public-directory
    outDir: 'dist',

    rollupOptions: {
      output: {
        // Separar vendor (React, React Router) del código de la app.
        // Mejora el cache del browser: si solo cambia tu código, el vendor
        // bundle (que cambia raramente) no se vuelve a descargar.
        //
        // Solo el runtime que necesita TODA página. Antes la condición era
        // `id.includes('node_modules')`, que arrastraba también react-markdown
        // y su cadena (rehype/unified/micromark, ~90 kB) al bundle eager
        // aunque solo los use el detalle de post y el editor admin — ambos
        // cargados con React.lazy en App.jsx. El límite por carpeta exacta
        // evita que `react-markdown` cuele por el prefijo `react`.
        manualChunks(id) {
          if (/node_modules[/\\](react|react-dom|react-router|react-router-dom|scheduler)[/\\]/.test(id)) {
            return 'vendor'
          }
        },
      },
    },
  },
})
