import { createI18n } from 'vue-i18n'

import en from './locales/en.json'
import ko from './locales/ko.json'
import zh from './locales/zh.json'
import ja from './locales/ja.json'

const i18n = createI18n({
  locale: localStorage.getItem('lang') || 'en',
  fallbackLocale: 'en',
  legacy: false,
  globalInjection: true,
  messages: {
    en,
    ko,
    zh,
    ja
  }
})

export default i18n
