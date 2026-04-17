import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'AeroOps Ground Operations',
        short_name: 'AeroOps',
        description: 'Airport Ground Operations Management System',
        theme_color: '#4f46e5',
        background_color: '#0f1117',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https?.*\/api\/dashboard/,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-dashboard', expiration: { maxAgeSeconds: 60 } }
          }
        ]
      }
    })
  ],
  // Prefer TypeScript sources when both JS and TS variants exist.
  resolve: {
    alias: { '@': '/src' },
    extensions: ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs', '.json']
  },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true }
    }
  }
})
