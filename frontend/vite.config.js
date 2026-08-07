import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: false,
    // Bind to localhost and ensure HMR connects to the same origin/port
    host: 'localhost',
    hmr: {
      host: 'localhost',
      protocol: 'ws',
      port: 5174,
      // Ensure the injected client uses this port (helps when proxies or cache cause mismatches)
      clientPort: 5174,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
