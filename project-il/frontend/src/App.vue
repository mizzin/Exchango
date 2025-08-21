<template>
  <!-- 🔑 key 붙이기 -->
  <router-view :key="$route.fullPath" />
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { onMounted } from 'vue'

const { locale } = useI18n()

onMounted(() => {
  const savedLang = localStorage.getItem('lang')
  if (!savedLang) {
    localStorage.setItem('lang', 'en')       // ✅ 최초 진입 시 영어 고정
    locale.value = 'en'
  }
})
</script>
