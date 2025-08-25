<template>
     <ConfirmModal ref="confirmModal" />
  <AdminLayout>
 
    <div class="admin-trade"> 
      <h2>지갑 충전</h2>
      <p>사이트 지갑(usd)충전 신청 (승인/거절)</p>


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

      <table class="table">
        <thead>
          <tr>
            <th>사용자</th>
            <th>선택한통화</th>
            <th>받아야하는금액</th>
            <th>입력금액</th>
            
            <th>상태</th>
            <th>요청일</th>
            <th>승인일시</th>
            <th>처리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.id">
            <td>{{ item.username }}</td>
            <td><span class="currency-pill">{{ item.currency }}</span></td>
             <td>{{ Number(item.expected_amount).toLocaleString() }}</td>
            <td>{{ Number(item.amount).toLocaleString() }}</td>
                       

            <td>
              <span :class="['status-badge', item.status]">
                {{ formatStatus(item.status) }} 
              </span>
            </td>
            <td>{{ formatDate(item.created_at) }}</td>
            <td>
              <span v-if="item.status === 'completed'">{{ formatDate(item.updated_at) }}</span>
              <span v-else>-</span>
            </td>
            <td>
              <div v-if="item.status === 'pending'">
                <button class="btn-approve" @click="approve(item.id)">승인</button>
                <button class="btn-reject" @click="reject(item.id)">거절</button>
              </div>
              <div v-else>—</div>
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
import { ref, computed, onMounted, watch } from 'vue'
import axios from '@/axiosAdmin'
import AdminLayout from '@/components/AdminLayout.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const confirmModal = ref(null)


// 데이터 변수
const list = ref([])
const page = ref(1)
const limit = 20
const total = ref(0)
const totalPages = computed(() => Math.ceil(total.value / limit))

// 필터 상태
const filters = ref({
  username: '',
  status: '',
  currency: '',
  startDate: '',
  endDate: '',
  dateShortcut: ''
})

// 필터 적용
const applyFilter = () => {
  page.value = 1
  fetchList()
}

// 필터 초기화
const resetFilters = () => {
  filters.value = {
    username: '',
    status: '',
    currency: '',
    startDate: '',
    endDate: '',
    dateShortcut: ''
  }
  page.value = 1
  fetchList()
}

// 날짜 범위 설정
const setDateRange = (range) => {
  const today = new Date()
  let start = new Date()

  if (range === 'today') {
    // 오늘
  } else if (range === '1w') {
    start.setDate(today.getDate() - 7)
  } else if (range === '1m') {
    start.setMonth(today.getMonth() - 1)
  } else if (range === '3m') {
    start.setMonth(today.getMonth() - 3)
  }

  filters.value.dateShortcut = range
  filters.value.startDate = start.toISOString().substring(0, 10)
  filters.value.endDate = today.toISOString().substring(0, 10)
  fetchList()
}

// 리스트 조회
const fetchList = async () => {
  try {
    const res = await axios.get('/admin/transactions/wallet-charge', {
      params: {
        page: page.value, 
        limit,
        username: filters.value.username,
        status: filters.value.status,
        currency: filters.value.currency,
        startDate: filters.value.startDate,
        endDate: filters.value.endDate
      }
    })

    list.value = res.data.data || []
    total.value = res.data.total || 0

  } catch (e) {
    console.error('❌ 충전 내역 로딩 실패:', e)
  }
}

// 상태 텍스트 변환
const formatStatus = (status) => {
  switch (status) {
    case 'pending': return '대기중'
    case 'completed': return '승인'
    case 'rejected': return '거절'
    default: return status
  }
}

// 날짜 형식 변환
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString()
}

// 페이지 이동
const prevPage = () => {
  if (page.value > 1) {
    page.value--
    fetchList()
  }
}
const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    fetchList()
  }
}

// 승인/거절 처리
const approve = async (id) => {
  if (!confirm('정말 승인하시겠습니까?')) return
  await axios.patch(`/admin/transactions/wallet-charge/${id}/approve`)
  alert('승인 완료')
  fetchList()
}

const reject = async (id) => {
  const reason = await confirmModal.value.open('충전거절 사유 입력', '해당 요청을 거절하시겠습니까?')

  if (!reason || reason.trim() === '') {
    alert('거절 사유를 입력해야 합니다.')
    return
  }

  try {
    await axios.patch(`/admin/transactions/wallet-charge/${id}/reject`, { reason })
    alert('거절 완료')
    fetchList()
  } catch (err) {
    alert('거절 실패: ' + (err.response?.data?.message || err.message))
  }
}

onMounted(fetchList)
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