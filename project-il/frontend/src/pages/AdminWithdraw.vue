<template>
  <AdminLayout>
    <div class="admin-trade">
       <h2>외부 플랫폼 출금 신청</h2>
       <p>외부 플랫폼에서 바로 출금신청 목록 (승인/거절)</p>


      <!-- 필터 영역 -->
      <div class="filter-bar-row">
        <input v-model="filters.username" placeholder="사용자명 검색" />
        <select v-model="filters.status">
          <option value="">전체 상태</option>
          <option value="pending">대기 중</option>
          <option value="completed">완료</option>
          <option value="rejected">거절됨</option>
        </select>
        <select v-model="filters.currency">
          <option value="">전체 통화</option>
          <option value="KRW">₩ KRW</option>
          <option value="PHP">₱ PHP</option>
          <option value="USDT">₮ USDT</option>
        </select>
        </div>
        <div class="filter-bar-row"> 요청일
        <button class="date-btn" @click="setDateRange('today')" :class="{ active: filters.dateShortcut === 'today' }">오늘</button>
        <button class="date-btn" @click="setDateRange('1w')" :class="{ active: filters.dateShortcut === '1w' }">1주일</button>
        <button class="date-btn" @click="setDateRange('1m')" :class="{ active: filters.dateShortcut === '1m' }">1개월</button>
        <button class="date-btn" @click="setDateRange('3m')" :class="{ active: filters.dateShortcut === '3m' }">3개월</button>

        <input type="date" v-model="filters.startDate" />
        <span>~</span>
        <input type="date" v-model="filters.endDate" />

        <button class="btn-submit" @click="applyFilters">검색</button>
        <button class="btn-reset" @click="resetFilters">초기화</button>
      </div>

      <!-- 테이블 -->
      <table v-if="paginatedWithdrawals.length">
        <thead>
          <tr>
            <th>사용자</th>
            <th>플랫폼</th>
            <th>플랫폼 ID</th>
            <th>$</th>
            <th>통화</th>
            <th>환산 금액</th>
            <th>상태</th>
            <th>요청일</th>
            <th>승인일시</th>
            <th>처리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in paginatedWithdrawals" :key="item.id">
            <td>{{ item.username }}</td>
            <td>{{ item.platform_id }}</td>
            <td>{{ item.platform_user_id }}</td>
            <td>{{ item.amount }}</td>
            <td><span class="currency-pill">{{ item.currency }}</span></td>
            <td>{{ item.krw_amount?.toLocaleString() }}</td>
            <td>
              <span :class="['badge', item.status]">
                {{ formatStatus(item.status) }}
              </span>
            </td>
            <td>{{ formatDate(item.created_at) }}</td>
            <td v-if="item.status === 'completed'">{{ formatDate(item.updated_at) }}</td>
            <td v-else>-</td>
            <td>
              <div v-if="item.status === 'pending'" class="action-buttons">
                <button class="btn-approve" @click="approve(item.id)">승인</button>
                <button class="btn-reject" @click="reject(item.id)">거절</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-else style="text-align:center; padding: 2rem; color: #777;">출금 요청 내역이 없습니다.</p>

      <!-- 페이지네이션 -->
      <div class="pagination" v-if="totalPages > 1">
        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">이전</button>
        <span v-for="page in visiblePages" :key="page">
          <button :class="{ active: currentPage === page }" @click="changePage(page)">{{ page }}</button>
        </span>
        <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">다음</button>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from '@/axiosAdmin'
import AdminLayout from '@/components/AdminLayout.vue'
import dayjs from 'dayjs'

const withdrawals = ref([])
const filters = ref({
  username: '',
  status: '',
  currency: '',
  dateShortcut: '',
  startDate: '',
  endDate: ''
})
const currentPage = ref(1)
const itemsPerPage = 10

const paginatedWithdrawals = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return withdrawals.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(withdrawals.value.length / itemsPerPage))

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

onMounted(async () => {
  await fetchWithdrawals()
})

const fetchWithdrawals = async () => {
  const token = localStorage.getItem('admin_token')
  try {
    const res = await axios.get('/admin/trade/withdraw', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        username: filters.value.username,
        status: filters.value.status,
        currency: filters.value.currency,
        startDate: filters.value.startDate,
        endDate: filters.value.endDate
      }
    })
    withdrawals.value = res.data.transactions || []
    currentPage.value = 1
  } catch (err) {
    console.error('출금 내역 로딩 실패:', err)
  }
}

const applyFilters = () => {
  fetchWithdrawals()
}

const resetFilters = () => {
  filters.value = {
    username: '',
    status: '',
    currency: '',
    dateShortcut: '',
    startDate: '',
    endDate: ''
  }
  fetchWithdrawals()
}

const setDateRange = (range) => {
  const today = dayjs()
  filters.value.dateShortcut = range

  switch (range) {
    case 'today':
      filters.value.startDate = today.format('YYYY-MM-DD')
      filters.value.endDate = today.format('YYYY-MM-DD')
      break
    case '1w':
      filters.value.startDate = today.subtract(7, 'day').format('YYYY-MM-DD')
      filters.value.endDate = today.format('YYYY-MM-DD')
      break
    case '1m':
      filters.value.startDate = today.subtract(1, 'month').format('YYYY-MM-DD')
      filters.value.endDate = today.format('YYYY-MM-DD')
      break
    case '3m':
      filters.value.startDate = today.subtract(3, 'month').format('YYYY-MM-DD')
      filters.value.endDate = today.format('YYYY-MM-DD')
      break
  }
}

const formatStatus = (status) => {
  switch (status) {
    case 'pending': return '대기 중'
    case 'completed': return '완료'
    case 'rejected': return '거절됨'
    default: return status
  }
}

const formatDate = (str) => {
  return new Date(str).toLocaleString()
}

const approve = async (id) => {
  const token = localStorage.getItem('admin_token')
  try {
    await axios.patch(`/admin/trade/withdraw/${id}/approve`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    await fetchWithdrawals()
    alert('승인 완료')
  } catch (err) {
    console.error('승인 실패:', err)
    alert('승인 처리 중 오류 발생')
  }
}

const reject = async (id) => {
  const token = localStorage.getItem('admin_token')
  try {
    await axios.patch(`/admin/trade/withdraw/${id}/reject`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    await fetchWithdrawals()
    alert('거절 완료')
  } catch (err) {
    console.error('거절 실패:', err)
    alert('거절 처리 중 오류 발생')
  }
}
</script>


<style scoped>
.admin-trade {
  max-width: 1024px;
  margin: auto;
  padding: 2rem;
}

.filter-bar-row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.filter-bar-row input,
.filter-bar-row select {
  height: 36px;
  padding: 6px 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  width: auto !important;  
  min-width: 140px;
  max-width: 200px;
}


.button-group {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
}

.btn-submit {
  background-color: #4a6cf7;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  font-weight: bold;
}
.date-btn {
  background-color: white;
  border: 1px solid #ccc;
  color: #333;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
}

.date-btn.active {
  background-color: #4a6cf7;
  color: white;
  border-color: #4a6cf7;
}
.btn-reset {
  background-color: #eee;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
}

.admin-trade table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  font-size: 0.85rem;
}

.admin-trade th,
.admin-trade td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: center;
}

.admin-trade thead {
  background-color: #f0f4ff;
  font-weight: bold;
}

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
  display: inline-block;
}
.pending {
  background-color: #ffe58f;
  color: #ad8b00;
}
.completed {
  background-color: #b7eb8f;
  color: #389e0d;
}
.rejected {
  background-color: #ffa39e;
  color: #cf1322;
}

.btn-approve,
.btn-reject {
  margin: 2px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-approve {
  background: #4a6cf7;
  color: white;
}

.btn-approve:hover {
  background: #3a56d8;
}

.btn-reject {
  background: #f44336;
  color: white;
}

.btn-reject:hover {
  background: #c62828;
}

.currency-pill {
  background: #eef3ff;
  border: 1px solid #ccd5ff;
  color: #1a237e;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  display: inline-block;
}
</style>