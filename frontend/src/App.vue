<template>
  <!-- 🔑 key 붙이기 -->
  <router-view :key="$route.fullPath" />
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { onMounted } from 'vue'

const { locale } = useI18n()
console.log('✅ BASE_URL:', import.meta.env.VITE_API_BASE_URL)
onMounted(() => {
  const savedLang = localStorage.getItem('lang')
  if (!savedLang) {
    localStorage.setItem('lang', 'en')
    locale.value = 'en'
  }
})
</script>
