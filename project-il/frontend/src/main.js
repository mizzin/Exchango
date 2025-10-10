//main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import './assets/style.css'

// 관리자 페이지일 때만 tabler.css 적용
if (window.location.pathname.startsWith('/admin')) {
  import('@tabler/core/dist/css/tabler.min.css')
}
const exp = localStorage.getItem('exp')
if (exp && Date.now() / 1000 > exp) {
  localStorage.clear()
  window.location.href = '/login'
}
const app = createApp(App)
app.use(router)
app.use(i18n)
app.mount('#app')