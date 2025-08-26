//main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import Editor from '@tinymce/tinymce-vue'

const app = createApp(App)
app.use(router)
app.use(i18n)
app.component('Editor', Editor)
app.mount('#app')
console.log(import.meta.env) 