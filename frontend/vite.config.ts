import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'simple-peer': 'simple-peer/simplepeer.min.js',
    }
  },
  optimizeDeps: {
    include: ['simple-peer']
  },
  // SPA için gerekli
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  }
}) 