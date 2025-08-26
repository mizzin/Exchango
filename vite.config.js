import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)) // 🔥 여기가 핵심
    }
  }
  ,server: {
    proxy: {
      '/users': 'http://localhost:3000',
    }
  }
})
