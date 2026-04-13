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
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },
})
