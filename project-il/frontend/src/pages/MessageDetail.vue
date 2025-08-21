
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from '@/axiosUser'

const route = useRoute()
const message = ref(null)
const token = localStorage.getItem('token')

onMounted(async () => {
  const res = await axios.get(`/users/messages/${route.params.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  message.value = res.data
})
</script>

<template>
  <div v-if="message">
    <h2>{{ message.subject }}</h2>
    <p>{{ message.content }}</p>
    <small>{{ new Date(message.created_at).toLocaleString() }}</small>
  </div>
</template>
