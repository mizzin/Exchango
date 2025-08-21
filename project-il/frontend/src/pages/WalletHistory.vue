<template>
  <UserLayout>
    <div class="recharge-history">
    <div class="wallet-balance">
      💰 {{ $t('mypage.balance') }}: <strong>{{ userBalance.toLocaleString() }} USD</strong>
    </div>
    <table v-if="paginatedHistory.length">
  <thead>
    <tr>
      <th>신청일</th>
      <th>구분</th>
      <th>신청통화</th>
      <th>신청금액 (USD)</th>
      <th>환산금액</th>
      <th>상태</th>
      <th>승인일</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="item in paginatedHistory" :key="item.id">
      <td>{{ formatDate(item.created_at) }}</td>
      <td>{{ formatType(item.type) }}</td>
      <td>{{ item.currency }}</td>
      <td>{{ formatAmount(item.amount) }} USD</td>
      <td>
        {{ formatAmount(item.krw_amount) }}
        {{ item.currency }}
      </td>
      <td>
        <span :class="'badge status-' + item.status">
          {{ formatStatus(item.status) }}
        </span>
      </td>
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
  </UserLayout>
</template>
 
<script setup>
import UserLayout from '@/components/UserLayout.vue'
import { ref, computed, onMounted } from 'vue'
import axios from '@/axiosUser'
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const history = ref([])
const userBalance = ref(0)
const currentPage = ref(1)
const itemsPerPage = 10

const fetchHistoryAndBalance = async () => {
  const token = localStorage.getItem('user_token')
  try {
    const [res1, res2] = await Promise.all([
      axios.get('/users/me/wallet-history', {
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

const formatAmount = (num) => {
  if (num === null || num === undefined) return '-'
  return Number(num).toLocaleString()
}

const formatType = (type) => {
  switch (type) {
    case 'wallet_charge': return t('history.type_charge')  // 여기!
    case 'wallet_withdraw': return t('history.type_withdraw')  // 여기!
    default: return type
  }
}

onMounted(() => {
  console.log('onmount진입')
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
  max-width: 900px;
  margin: 2rem auto;
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  font-family: 'Pretendard', sans-serif;
  font-size: 14px;
  color: #333;
}

.wallet-balance {
  font-size: 16px;
  margin-bottom: 1rem;
  color: #111;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

thead {
  background-color: #f8f9fa;
}

th, td {
  padding: 0.75rem 1rem;
  text-align: center;
  border-bottom: 1px solid #eee;
}

th {
  font-weight: 600;
  color: #555;
  font-size: 13px;
}

td {
  font-size: 14px;
  color: #333;
}

.badge {
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 13px;
  display: inline-block;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}

.status-approved,
.status-completed {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-rejected {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 1.5rem;
}

.pagination button {
  border: none;
  background: #f0f0f0;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination button.active {
  background: #007bff;
  color: white;
  font-weight: bold;
}

.pagination button:hover:not(.active) {
  background: #e2e6ea;
}

.pagination button:disabled {
  background: #e9ecef;
  cursor: not-allowed;
}


</style>
