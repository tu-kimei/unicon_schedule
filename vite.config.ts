import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: false, // Keep origin to preserve cookies
        secure: false,
        ws: true,
        cookieDomainRewrite: 'localhost',
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
            console.log('Cookies:', req.headers.cookie);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: false,
        secure: false,
        cookieDomainRewrite: 'localhost',
      },
      '/operations': {
        target: 'http://localhost:3001',
        changeOrigin: false,
        secure: false,
        cookieDomainRewrite: 'localhost',
      },
    },
  },
})
