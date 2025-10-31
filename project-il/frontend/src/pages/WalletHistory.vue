<template>
  <UserLayout>
    <div class="recharge-history">
      <h2>{{ $t('history.wallet.title') }}</h2>
      <p>{{ $t('history.wallet.description') }}</p>

     <table v-if="paginatedHistory.length">
  <thead>
    <tr>
      <th>{{ $t('history.wallet.date') }}</th>
      <th>{{ $t('history.wallet.type') }}</th>
      <th>{{ $t('history.wallet.currency') }}</th>
      <th>{{ $t('history.wallet.amountUsd') }}</th>
      <th>{{ $t('history.wallet.convertedAmount') }}</th>
      <th>{{ $t('history.wallet.totalAmount') }}</th>

      <th>{{ $t('history.wallet.status') }}</th>
      <th>{{ $t('history.wallet.approvedAt') }}</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="item in paginatedHistory" :key="item.id">
     <td :data-label="$t('history.wallet.date')">{{ formatDate(item.created_at) }}</td>
<td :data-label="$t('history.wallet.type')">{{ formatType(item.type) }}</td>
<td :data-label="$t('history.wallet.currency')">{{ item.currency }}</td>
<td :data-label="$t('history.wallet.amountUsd')">{{ formatAmount(item.amount) }} USD</td>
<td :data-label="$t('history.wallet.convertedAmount')">
  {{ formatAmount(item.krw_amount) }} {{ item.currency }}
</td>
<td :data-label="$t('history.wallet.totalAmount')">
{{ formatAmount(parseFloat(item.amount) + parseFloat(item.bonus_amount || 0)) }} USD
</td>



<td :data-label="$t('history.wallet.status')">
  <span :class="'badge status-' + item.status">
    {{ formatStatus(item.status) }}
  </span>
</td>
<td :data-label="$t('history.wallet.approvedAt')">
  <span v-if="item.status === 'completed'">{{ formatDate(item.updated_at) }}</span>
</td>

    </tr>
  </tbody>
</table>


      <div v-else style="text-align: center; padding: 2rem; color: #777;">
        {{ $t('history.wallet.noHistory') }}
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
import dayjs from 'dayjs'


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


    history.value = res1.data.transactions || []
    userBalance.value = res2.data.balance || 0
  } catch (err) {
    console.error('❌ Failed to load recharge history or wallet balance:', err)
  }
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY.MM.DD HH:mm:ss')
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


const formatStatus = (status) => {
  switch (status) {
    case 'pending': return 'pending'
    case 'completed': return 'completed'
    case 'rejected': return 'rejected'
    default: return status
  }
}
onMounted(async () => {
  await axios.get('/users/info')
})

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
@media (max-width: 768px) {
  /* 💡 테이블 형태 해제 */
  table, thead, tbody, th, td, tr {
    display: block;
  }

  thead {
    display: none; /* 제목행 숨김 */
  }

  tbody tr {
    background: #fff;
    border: 1px solid #eee;
    border-radius: 10px;
    margin-bottom: 1rem;
    padding: 0.9rem 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }

  td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0;
    border: none;
    font-size: 13px;
  }

  /* 각 셀 왼쪽에 헤더명 표시 */
  td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #555;
  }

  /* 상태 뱃지 */
  .badge {
    font-size: 12px;
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
  }

  /* 날짜나 긴 문자열은 줄바꿈 없이 유지 */
  td span, td {
    word-break: keep-all;
  }

  /* 전체 영역 여백 정리 */
  .recharge-history {
    padding: 1rem;
    box-shadow: none;
  }

  /* 페이징 버튼 */
  .pagination {
    margin-top: 1rem;
    gap: 4px;
    flex-wrap: wrap;
  }
}


</style>
