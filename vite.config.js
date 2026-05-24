import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  define: {
    // Some libraries (like TonConnect/bn.js) expect Buffer or global to exist.
    'global': 'window',
    'process.env': {},
    // Production kill switch: __DEV_MODE__ is `true` during dev, `false` in production build.
    // The bundler tree-shakes any `if (__DEV_MODE__) { ... }` blocks out of production bundles.
    // Override: set VITE_FORCE_PROD=true to test real Firebase auth/data on localhost dev server.
    __DEV_MODE__: mode === 'production' || process.env.VITE_FORCE_PROD === 'true' ? 'false' : 'true',
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}))
