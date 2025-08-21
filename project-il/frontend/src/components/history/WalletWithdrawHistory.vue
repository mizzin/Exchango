<template>
  <div class="recharge-history">
    <div class="wallet-balance">
      💰 {{ $t('wallet.currentBalance') }}: <strong>{{ userBalance.toLocaleString() }} USD</strong>
    </div>

    <table v-if="paginatedHistory.length">
      <thead>
        <tr>
          <th>{{ $t('history.currency') }}</th>
          <th>{{ $t('history.amount') }}</th>
          <th>{{ $t('history.usdAmount') }}</th>
          <th>{{ $t('history.status') }}</th>
          <th>{{ $t('history.requestDate') }}</th>
          <th>{{ $t('history.approveDate') }}</th>
          <th>{{ $t('history.adminComment') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in paginatedHistory" :key="item.id">
          <td>{{ item.currency }}</td>
          <td>{{ item.amount?.toLocaleString() }}</td>
          <td>{{ item.usd_amount?.toLocaleString() }}</td>
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

    <div v-else style="text-align: center; padding: 2rem; color: #777;">
      {{ $t('history.noRechargeHistory') }}
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
import { ref, computed, onMounted } from 'vue'
import axios from '@/axiosUser'

const history = ref([])
const userBalance = ref(0)
const currentPage = ref(1)
const itemsPerPage = 10

const fetchHistoryAndBalance = async () => {
  const token = localStorage.getItem('user_token')
  try {
    const [res1, res2] = await Promise.all([
      axios.get('/users/me/wallet-withdraw', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])

    console.log('🔄 충전 이력 데이터:', res1.data)
    console.log('💰 유저 잔액 데이터:', res2.data)

    history.value = res1.data.transactions || []
    userBalance.value = res2.data.balance || 0
  } catch (err) {
    console.error('❌ 충전 이력 또는 잔액 불러오기 실패:', err)
  }
}


onMounted(() => {
  fetchHistoryAndBalance()
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

const formatDate = (str) => new Date(str).toLocaleString()

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
.recharge-history {
  margin-top: 1rem;
}

.wallet-balance {
  text-align: right;
  font-weight: bold;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: #2563eb;
}

.recharge-history table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.recharge-history th,
.recharge-history td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}

.recharge-history thead {
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
