<template>
  <UserLayout>
    <div class="how-to-play">

      <div class="image-gallery">
        <div v-for="n in 8" :key="n" class="image-card">
          <img :src="getImagePath(n)" :alt="`Step ${n}`" />
        </div>
      </div>
    </div>
  </UserLayout>
</template>

<script setup>
import UserLayout from '@/components/UserLayout.vue'
import { useI18n } from 'vue-i18n'
const { locale } = useI18n()
// Vite 경로 인식용

const getImagePath = (n) => {
  const lang = locale.value === 'ko' ? 'ko' : 'en'
  return new URL(`../assets/img/${lang}/${n}.png`, import.meta.url).href
}
</script>

<style scoped>
.how-to-play {
  max-width: 900px;
  margin: 2rem auto;
  text-align: center;
  padding: 0 1rem;
}
.desc {
  margin-bottom: 1.5rem;
  font-size: 1rem;
  color: #666;
}
.image-gallery {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem; /* 이미지 간 간격 */
}

.image-card img {
  width: 100%;
  max-width: 420px; /* PC에서도 이미지가 너무 커지지 않게 */
  border-radius: 12px;
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}

.image-card img:hover {
  transform: scale(1.02);
}
</style>
