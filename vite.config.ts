import { defineConfig } from 'vite'
import { wasp } from 'wasp/client/vite'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [wasp()],
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  server: {
    open: true,
    allowedHosts: ['.ngrok-free.app'],
    proxy: {
      '/auth': 'http://localhost:3001',
      '/operations': 'http://localhost:3001',
      '/api': 'http://localhost:3001',
    },
  },
})
