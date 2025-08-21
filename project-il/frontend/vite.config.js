import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
 server: {
  proxy: {
    '/users': 'http://localhost:3000',
     '/api': 'http://localhost:3000',
     '/exchange-rate': 'http://localhost:3000',
  }
}

,
  build: {
    rollupOptions: {
      input: '/index.html'
    }
  },
  preview: {
    headers: {
      'Cache-Control': 'no-cache'
    }
  }
})
