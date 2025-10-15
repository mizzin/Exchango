<template>
     <AdminLayout>
  <div class="page-header">
    <h2 class="page-title">거래처리 이력</h2>
  </div>

  <!-- 필터 -->
  <div class="card mb-3 p-3">
    <div class="row g-2">
      <div class="col-md-2">
        <select v-model="filters.type" class="form-select">
          <option value="">전체 유형</option>
          <option value="wallet_charge">내 지갑 충전</option>
          <option value="platform_charge">플랫폼 충전</option>
          <option value="wallet_withdraw">내 지갑 출금</option>
          <option value="platform_withdraw">플랫폼 출금</option>
          <option value="platform_to_wallet">플랫폼에서 지갑</option>
          <option value="wallet_to_platform">지갑에서 플랫폼</option>
        </select>
      </div>

      <div class="col-md-2">
        <select v-model="filters.status" class="form-select">
          <option value="">전체 상태</option>
          <option value="pending">대기중</option>
          <option value="completed">승인됨</option>
          <option value="rejected">거절됨</option>
        </select>
      </div>

      <div class="col-md-2">
        <input v-model="filters.username" type="text" class="form-control" placeholder="유저네임" />
      </div>

      <div class="col-md-3">
        <input v-model="filters.startDate" type="date" class="form-control" />
      </div>
      <div class="col-md-3">
        <input v-model="filters.endDate" type="date" class="form-control" />
      </div>
    </div>

    <div class="mt-3 text-end">
      <button @click="fetchHistory" class="btn btn-primary me-2">검색</button>
      <button @click="resetFilters" class="btn btn-secondary">초기화</button>
        <button @click="downloadExcel" class="btn btn-success">엑셀 다운로드</button>

    </div>
  </div>

  <!-- 테이블 -->
  <div class="card">
    <div class="table-responsive">
      <table class="table card-table table-vcenter">
        <thead>
          <tr>
            <th>신청일</th>
            <th>유형</th>
            <th>금액</th>
            <th>통화</th>
            <th>상태</th>
            <th>유저네임</th>
            <th>처리일</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in history" :key="item.id">
            <td>{{ formatDate(item.created_at) }}</td>
            <td>{{ formatType(item.type) }}</td>
            <td>{{ formatAmount(item.amount) }}</td>
            <td>{{ item.currency }}</td>
            <td>
                <span :class="`badge bg-${statusClass(item.status)} text-white`">
                {{ formatStatus(item.status) }}
                </span>
            </td>
            <td>{{ item.user_username }}</td>
            <td>{{ item.status === 'pending' ? '-' : formatDate(item.updated_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  
    <!-- 페이지네이션 -->
    <div v-if="totalPages > 1" class="pagination text-center my-3">
     <!-- 페이지네이션 -->
<ul v-if="totalPages > 1" class="pagination justify-content-center mt-3">
  <li class="page-item" :class="{ disabled: page === 1 }">
    <button class="page-link" @click="changePage(page - 1)">이전</button>
  </li>

  <li
    v-for="p in totalPages"
    :key="p"
    class="page-item"
    :class="{ active: page === p }"
  >
    <button class="page-link" @click="changePage(p)">{{ p }}</button>
  </li>dfdfdf

  <li class="page-item" :class="{ disabled: page === totalPages }">
    <button class="page-link" @click="changePage(page + 1)">다음</button>
  </li>
</ul>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/axiosAdmin'
import AdminLayout from '@/components/AdminLayout.vue'
const history = ref([])
const filters = ref({
  type: '',
  status: '',
  username: '',
  startDate: '',
  endDate: '',
})
const page = ref(1)
const totalPages = ref(1)   // ✅ 추가
const limit = 50   

const downloadExcel = async () => {
  try {
    const params = {
      type: filters.type,
      status: filters.status,
      username: filters.username,
      startDate: filters.startDate,
      endDate: filters.endDate,
    }

    const res = await axios.get('/transactions/requests/export', {
      params,
      responseType: 'blob',
    })

    // ✅ 오늘 날짜 자동 파일명
    const today = new Date().toISOString().slice(0, 10)
    const filename = `거래이력_${today}.xlsx`

    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('❌ 엑셀 다운로드 실패:', err)
    alert('엑셀 파일 다운로드 중 오류가 발생했습니다.')
  }
}
const fetchHistory = async () => {
  const res = await axios.get('/admin/requests', {
    params: {
      ...filters.value,
      page: page.value,
      limit: 50,
    },
  })
  history.value = res.data.data
    totalPages.value = res.data.totalPages || 1   // ✅ 서버 totalPages 받기

}

const resetFilters = () => {
  filters.value = {
    type: '',
    status: '',
    username: '',
    startDate: '',
    endDate: '',
  }
  fetchHistory()
}

const formatDate = (val) => {
  if (!val) return '-'
  return new Date(val).toLocaleString()
}
const formatAmount = (v) => v.toLocaleString()
const formatType = (type) => {
  const map = {
    wallet_charge: '내 지갑 충전',
    platform_charge: '플랫폼 충전',
    wallet_withdraw: '내 지갑 출금',
    platform_withdraw: '플랫폼 출금',
    wallet_to_platform:'지갑에서 플랫폼',
    platform_to_platform:'플랫폼에서 플랫폼',
    transfer: '머니 이동',
    reward: '보상',
    penalty: '차감',
    unknown:'잘못된데이터(개발자에게문의바람)'
  }
  return map[type] || type
}
const formatStatus = (status) => {
  const map = {
    pending: '대기중',
    completed: '승인됨',
    rejected: '거절됨',
  }
  return map[status] || status
}
const statusClass = (status) => {
  switch (status) {
    case 'completed':
      return 'green'
    case 'rejected':
      return 'red'
    case 'cancelled':
      return 'secondary'
    case 'pending':
    default:
      return 'yellow'
  }
}

onMounted(fetchHistory)
</script>
