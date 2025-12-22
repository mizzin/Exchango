<template>
  <UserLayout>
    <div class="coming-soon-container">
      <h1>{{ $t('resources.title') }}</h1>
      <p>{{ $t('resources.comingSoon') }}</p>
    </div>
  </UserLayout>
</template>

<script setup>
import UserLayout from '@/components/UserLayout.vue'
</script>

<style scoped>
.coming-soon-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  text-align: center;
}
</style>
