import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// Path aliases mirror the folder structure, so an import says which layer it
// crosses. `@features/qa/hooks` reads as a boundary; `../../../qa/hooks` does
// not, and it survives a file move.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@ds': fileURLToPath(new URL('./src/design-system', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@api': fileURLToPath(new URL('./src/api', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // The dev server proxies /api so the browser sees one origin and there is
    // no CORS preflight in development. VITE_API_BASE_URL is for deployed
    // builds where the API is on its own host.
    proxy: {
      '/api': {
        // 127.0.0.1, not localhost: Node may resolve localhost to ::1 while
        // uvicorn binds the IPv4 loopback, and the proxy then dials nothing.
        target: process.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    // axe-core runs over every route in BOTH themes. The dark palette is a
    // separate set of contrast pairs, so a light-only pass proves half of it.
    globals: true,
  },
})
