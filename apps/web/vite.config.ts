/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:8000'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    // MapLibre 6 loads its worker by a URL relative to its own module; pre-bundling breaks that.
    optimizeDeps: { exclude: ['maplibre-gl'] },
    server: {
      port: 5173,
      // Forward /api/* to Django in development, so no CORS setup is needed locally.
      proxy: { '/api': { target: apiTarget, changeOrigin: true } },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/tests/setup.ts'],
      env: { VITE_MOCK_DELAY_MS: '0', VITE_ENABLE_MOCKS: 'true' },
      exclude: ['e2e/**', 'node_modules/**'],
    },
  }
})
