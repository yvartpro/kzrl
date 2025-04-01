import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Keeps the app updated
      devOptions: {
        enabled: true, // Enable PWA on localhost
        type: 'module',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,json}'], // Cache these files
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/your-api-url\.com\//, // Cache API responses (change URL)
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 86400, // 1 day
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico)$/, // Cache images
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 2592000, // 30 days
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Kizingwe River Light Bar',
        short_name: 'KRL',
        description: 'Un bar, resto-bar accessible a tous.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
