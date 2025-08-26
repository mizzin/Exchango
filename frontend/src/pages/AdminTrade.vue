<template>
  <AdminLayout>
    <div class="admin-trade">
      <h2>🔋 충전 신청 내역</h2>

    <div class="filter-bar-row">
      <input v-model="filters.username" placeholder="사용자명 검색" />
      <select v-model="filters.status">
        <option value="">전체 상태</option>
        <option value="pending">대기중</option>
        <option value="completed">승인</option>
        <option value="rejected">거절</option>
      </select>
      <select v-model="filters.currency">
        <option value="">전체 통화</option>
        <option value="KRW">₩ KRW</option>
        <option value="PHP">₱ PHP</option>
        <option value="USDT">₮ USDT</option>
      </select>
    </div>
    <div class="filter-bar-row date-filter-row">
      <div class="date-filter">요청일
        <button class="date-btn" @click="setDateRange('today')" :class="{ active: filters.dateShortcut === 'today' }">오늘</button>
        <button class="date-btn" @click="setDateRange('1w')" :class="{ active: filters.dateShortcut === '1w' }">1주일</button>
        <button class="date-btn" @click="setDateRange('1m')" :class="{ active: filters.dateShortcut === '1m' }">1개월</button>
        <button class="date-btn" @click="setDateRange('3m')" :class="{ active: filters.dateShortcut === '3m' }">3개월</button>

        <input type="date" v-model="filters.startDate" />
        <span>~</span>
        <input type="date" v-model="filters.endDate" />
      </div>

      <div class="button-group">
        <button class="search-button" @click="applyFilter">검색</button>
        <button class="reset-button" @click="resetFilters">초기화</button>
      </div>
    </div>


      <table>
        <thead>
          <tr>
            <th>사용자</th>
            <th>플랫폼</th>
            <th>플랫폼 ID</th>
            <th>$</th>
            <th>통화</th>
            <th>금액</th>
            <th>상태</th>
            <th>요청일</th>
            <th>승인일시</th>
            <th>처리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in transactions" :key="item.id">
            <td>{{ item.username }}</td>
            <td>{{ item.platform_id }}</td>
            <td>{{ item.platform_user_id }}</td>
            <td>{{ item.amount }}</td>
            <td>
              <span class="currency-pill">
                {{ item.currency }}
              </span>
            </td>
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
              <div v-if="item.status === 'pending'">
                <button class="btn-approve" @click="approve(item.id)">승인</button>
                <button class="btn-reject" @click="reject(item.id)">거절</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
       <!-- 📄 페이징 -->
      <div class="pagination">
        <button @click="prevPage" :disabled="page === 1">이전</button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="page === totalPages">다음</button>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/axiosAdmin'
import AdminLayout from '@/components/AdminLayout.vue'
import dayjs from 'dayjs'

const transactions = ref([])
const page = ref(1)
const totalPages = ref(1)

const filters = ref({
  username: '',
  status: '',
  currency: '',
  dateShortcut: '',   // today, 1w, 1m, 3m
  startDate: '',      // YYYY-MM-DD
  endDate: ''
})

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

onMounted(async () => {
  await loadTransactions()
})

const loadTransactions = async () => {
  const token = localStorage.getItem('admin_token')

  const { username, status, currency } = filters.value

  try {
    const res = await axios.get('/admin/trade/recharge', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: page.value,
        username: filters.value.username,
        status: filters.value.status,
        currency: filters.value.currency,
        startDate: filters.value.startDate,
        endDate: filters.value.endDate
      }
    })


    transactions.value = res.data.rows || []
    totalPages.value = Math.ceil(res.data.total / 10) || 1
  } catch (err) {
    console.error('❌ 충전 내역 로딩 실패:', err)
  }
}
const applyFilter = () => {
  page.value = 1
  loadTransactions()
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
  page.value = 1
  loadTransactions()
}
const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadTransactions()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    loadTransactions()
  }
}

const approve = async (id) => {
  const token = localStorage.getItem('admin_token')
  try {
    await axios.patch(`/admin/trade/recharge/${id}/approve`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    await loadTransactions()
    alert('승인 처리 완료')
  } catch (err) {
    console.error('❌ 승인 실패:', err.response?.data || err)
    alert('승인 처리 중 오류 발생')
  }
}

const reject = async (id) => {
  const token = localStorage.getItem('admin_token')
  try {
    await axios.patch(`/admin/trade/recharge/${id}/reject`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    await loadTransactions()
    alert('거절 처리 완료')
  } catch (err) {
    console.error('❌ 거절 실패:', err)
    alert('거절 처리 중 오류 발생')
  }
}

const formatStatus = (status) => {
  switch (status) {
    case 'pending': return '대기 중'
    case 'completed': return '완료'
    case 'cancelled': return '취소됨'
    case 'rejected': return '거절됨'
    default: return status
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleString()
}

</script>

<style scoped>
.button-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.reset-button {
  background-color: #e0e0e0;
  color: #333;
  font-weight: bold;
  border: none;
  height: 38px;
  padding: 0 16px;
  border-radius: 6px;
  cursor: pointer;
}

.reset-button:hover {
  background-color: #c0c0c0;
}

.filter-bar-row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.date-filter-row {
  justify-content: space-between;
  flex-wrap: wrap;
}

.date-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
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

.date-filter button {
  padding: 6px 12px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
  min-width: 52px;
}

.date-filter button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.date-filter input[type="date"] {
  padding: 6px 10px;
  font-size: 13px;
  height: 36px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.search-button {
  background-color: #4a6cf7;
  color: white;
  font-weight: bold;
  border: none;
  height: 38px;
  padding: 0 16px;
  border-radius: 6px;
  cursor: pointer;
}

.search-button:hover {
  background-color: #3a56d8;
}

.pagination {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  align-items: center;
}
.admin-trade {
  max-width: 1024px;
  margin: auto;
  padding: 2rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  font-size: 0.85rem;
}

th, td {
  border: 1px solid #ccc;
  padding: 10px;
  text-align: center;
}

thead {
  background-color: #f0f4ff;
  font-weight: bold;
}

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
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

.cancelled, .rejected {
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
.date-btn {
  background-color: white;
  border: 1px solid #ccc;
  color: #333;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
}
</style>