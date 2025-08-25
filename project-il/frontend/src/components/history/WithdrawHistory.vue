<template>
  <div class="withdraw-history">
    <table v-if="paginatedHistory.length">
      <thead>
         <tr>
          <th>{{ $t('history.platform') }}</th>
          <th>{{ $t('history.platformId') }}</th>
          <th>{{ $t('history.inputAmount') }}</th>
          <th>{{ $t('history.currency') }}</th>
          <th>{{ $t('history.expected_amount') }}</th>
          <th>{{ $t('history.status') }}</th>
          <th>{{ $t('history.requestDate') }}</th>
          <th>{{ $t('history.approveDate') }}</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="item in paginatedHistory" :key="item.id">
            <td>{{ getPlatformName(item.platform_id) }}</td>
            <td>{{ item.platform_user_id }}</td>
            <td>{{ item.amount }}</td>
            <td>{{ item.currency }}</td>
               <td>{{ item.expected_amount }}</td>
            <td>{{ formatStatus(item.status) }}</td>
            <td>{{ formatDate(item.created_at) }}</td>
            <td>
            <span v-if="item.status === 'completed'">
                {{ formatDate(item.updated_at) }}
            </span>
            </td>
        </tr>
        </tbody>
    </table>
     <div v-else style="text-align:center; padding: 2rem; color: #777;">
        {{ $t('histoy.wiHistory') }}
    </div>
    <div class="pagination" v-if="totalPages > 1">
      <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">&lt;</button>

      <button
        v-for="page in visiblePages"
        :key="page"
        @click="changePage(page)"
        :class="{ active: currentPage === page }"
      >
        {{ page }}
      </button>

      <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">&gt;</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from '@/axiosUser'
import '@/assets/style.css'
import dayjs from 'dayjs'

const history = ref([]) 
const currentPage = ref(1)
const itemsPerPage = 10
const platformOptions = ref([])

const fetchPlatformOptions = async () => {
  const lang = localStorage.getItem('lang') || 'ko'
  try {
    const res = await axios.get(`/platforms?lang=${lang}`)
    platformOptions.value = res.data // ex) [{ id: '001', name: 'A플랫폼' }, ...]
  } catch (err) {
    console.error('플랫폼 목록 불러오기 실패:', err)
  }
}
const getPlatformName = (id) => {
  const found = platformOptions.value.find(p => p.id === id)
  return found ? found.name : id
}

onMounted(async () => {
  await fetchPlatformOptions()
  const token = localStorage.getItem('user_token')
  try {
    const res = await axios.get('/users/me/withdraws', {
      headers: { Authorization: `Bearer ${token}` }
    })
    history.value = res.data.transactions || []

  } catch (err) {
    console.error('출금 이력 불러오기 실패:', err)
  }
})

const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return history.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => {
  return Math.ceil(history.value.length / itemsPerPage)
})

const visiblePages = computed(() => {
  const maxVisible = 10
  const pages = []
  const start = Math.floor((currentPage.value - 1) / maxVisible) * maxVisible + 1
  const end = Math.min(start + maxVisible - 1, totalPages.value)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY.MM.DD HH:mm:ss')
}

const formatStatus = (status) => {
  switch (status) {
    case 'pending': return 'pending'
    case 'completed': return 'completed'
    case 'rejected': return 'rejected'
    default: return status
  }
}
</script>

<style scoped>
.withdraw-history table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.withdraw-history th,
.withdraw-history td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}

.withdraw-history thead {
  background-color: #f6f8ff;
}
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.pagination button {
  padding: 6px 12px;
  border: 1px solid #ccc;
  background-color: #fff;
  color: #2563eb;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.pagination button:hover:not(:disabled) {
  background-color: #e8f0ff;
  border-color: #2563eb;
  color: #4a6cf7;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.pagination button.active {
  background-color: #2563eb;
  color: #fff;
  border-color: #2563eb;
  font-weight: bold;
}

</style>