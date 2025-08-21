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
          <option value="transfer">머니 이동</option>
        </select>
      </div>

      <div class="col-md-2">
        <select v-model="filters.status" class="form-select">
          <option value="">전체 상태</option>
          <option value="pending">대기중</option>
          <option value="approved">승인됨</option>
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

const fetchHistory = async () => {
  const res = await axios.get('/admin/requests', {
    params: {
      ...filters.value,
      page: page.value,
      limit: 50,
    },
  })
  history.value = res.data.data
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
    approved: '승인됨',
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
