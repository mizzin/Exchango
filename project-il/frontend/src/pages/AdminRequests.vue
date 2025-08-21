       <!--AdminRequests 전체 신청 내역 페이지 -->
<template>
    <AdminLayout>
  <div class="admin-requests">
    <!-- ✅ 필터바 -->
    <div class="filter-bar">
      <div class="card mb-3">
            <div class="card-body">
                <form class="row g-2">
                <!-- 거래유형 -->
<div class="col-md-2">
  <select class="form-select" v-model="filters.type">
    <option value="">전체 유형</option>
    <option value="recharge">외부 충전</option>
    <option value="withdraw">외부 출금</option>
    <option value="wallet_charge">지갑 충전</option>
    <option value="wallet_withdraw">지갑 출금</option>
    <option value="wallet_transfer">머니 이동</option>
  </select>
</div>

<!-- 상태 -->
<div class="col-md-2">
  <select class="form-select" v-model="filters.status">
    <option value="">전체 상태</option>
    <option value="pending">대기중</option>
    <option value="approved">승인됨</option>
    <option value="rejected">거절됨</option>
  </select>
</div>

<!-- 유저명 -->
<div class="col-md-2">
  <input type="text" class="form-control" v-model="filters.username" placeholder="유저명" />
</div>

<!-- 날짜 -->
<div class="col-md-2">
  <input type="date" class="form-control" v-model="filters.startDate" />
</div>
<div class="col-md-2">
  <input type="date" class="form-control" v-model="filters.endDate" />
</div>

<!-- 버튼 -->
<div class="col-md-2 d-flex gap-2">
  <button type="button" class="btn btn-primary w-50" @click="fetchRequests">검색</button>
  <button type="button" class="btn btn-secondary w-50" @click="resetFilters">초기화</button>
</div>

                </form>
            </div>
        </div>
    </div>

    <!-- ✅ 신청내역 테이블 -->
    <div class="card">
        <div class="card-body table-responsive">
            <table class="table table-vcenter">
            <thead>
                <tr>
                <th>신청일</th>
                <th>유형</th>
                <th>유저</th>
                <th>신청금액</th>
                <th>환산금액</th>
                <th>상태</th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="item in requests"
                    :key="item.id"
                    @click="openDetail(item)"
                    class="cursor-pointer"
                    >
                <td>{{ formatDate(item.created_at) }}</td>
                <td>
                {{ formatType(item) }}
                <div v-if="item.type === 'wallet_transfer'" class="text-muted small">
                    {{ directionLabel(item) }}
                </div>
                </td>
                <td>{{ item.user_username  }}</td>
                <td>{{ formatAmount(item.amount, item.currency) }}</td>
                <td>
                    <span v-if="item.expected_amount">
                    → {{ formatAmount(item.expected_amount) }}
                    </span>
                </td>
                <td>
                    <span :class="'badge bg-' + statusColor(item.status)">
                    {{ formatStatus(item.status) }}
                    </span>
                </td>

                </tr>
            </tbody>
            </table>
        </div>
    </div>
     <!-- ✅ 페이지-->
    <div class="card-footer d-flex align-items-center">
    <p class="m-0 text-muted">
        총 {{ total }}건 중 {{ (page - 1) * limit + 1 }}–{{ Math.min(page * limit, total) }} 표시
    </p>
    <ul class="pagination m-0 ms-auto">
        <li class="page-item" :class="{ disabled: page === 1 }">
        <a class="page-link" href="#" @click.prevent="changePage(page - 1)">이전</a>
        </li>
        <li
        v-for="n in totalPages"
        :key="n"
        class="page-item"
        :class="{ active: n === page }"
        >
        <a class="page-link" href="#" @click.prevent="changePage(n)">{{ n }}</a>
        </li>
        <li class="page-item" :class="{ disabled: page === totalPages }">
        <a class="page-link" href="#" @click.prevent="changePage(page + 1)">다음</a>
        </li>
    </ul>
    </div>


    <!-- ✅ 상세 모달 (선택) -->
    <div v-if="selectedRequest" class="modal-backdrop fade show"></div>
    <div
    v-if="selectedRequest"
    class="modal d-block"
    tabindex="-1"
    role="dialog"
    >
    <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
        <div class="modal-header">
            <h5 class="modal-title">신청 상세 보기</h5>
            <button type="button" class="btn-close" @click="closeDetail"></button>
        </div>
        <div class="modal-body">
            <p><strong>신청일:</strong> {{ formatDate(selectedRequest.created_at) }}</p>
            <p><strong>거래 유형:</strong> {{ formatType(selectedRequest) }}</p>
            <p><strong>유저명:</strong> {{ selectedRequest.username }}</p>
            <p><strong>금액:</strong> {{ formatAmount(selectedRequest.amount, selectedRequest.currency) }}</p>
            <p v-if="selectedRequest.expected_amount"><strong>환산금액:</strong> {{ formatAmount(selectedRequest.expected_amount) }}</p>
            <p><strong>상태:</strong> {{ formatStatus(selectedRequest.status) }}</p>
            <p v-if="selectedRequest.user_memo"><strong>신청 메모:</strong> {{ selectedRequest.user_memo }}</p>
            <p v-if="selectedRequest.type === 'wallet_transfer'">
            <strong>이동 방향:</strong> {{ directionLabel(selectedRequest) }}
            </p>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeDetail">닫기</button>
            <button
                type="button"
                class="btn btn-primary"
                @click="goToHandler(selectedRequest)"
            >
                처리하러 가기
            </button>
            </div>
        </div>
    </div>
    </div>

  </div>
  </AdminLayout>
</template>
<script setup>
import AdminLayout from '@/components/AdminLayout.vue'
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'

import axios from '@/axiosAdmin'

const requests = ref([])
const selectedRequest = ref(null)
const total = ref(0)
const page = ref(1)
const limit = 15
const router = useRouter()

const filters = ref({
  type: '',
  status: 'pending',
  username: '',
  startDate: '',
  endDate: ''
})
const resetFilters = () => {
  filters.value = {
    type: '',
    status: '',
    username: '',
    startDate: '',
    endDate: ''
  }
  fetchRequests()
}

const formatType = (item) => {
  const map = {
    recharge: '외부 플랫폼 충전',
    withdraw: '외부 플랫폼 출금',
    wallet_charge: '지갑 충전',
    wallet_withdraw: '지갑 출금',
    wallet_transfer: '머니 이동'
  }
  return map[item.type] || item.type
}
const formatAmount = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return '-'
  const symbol = {
    USD: '$',
    KRW: '₩',
    PHP: '₱',
    USDT: '₮'
  }
  return `${symbol[currency] || ''} ${Number(amount).toLocaleString()}`
}
const formatStatus = (status) => {
  const map = {
    pending: '대기중',
    approved: '승인됨',
    rejected: '거절됨'
  }
  return map[status] || status
}
const statusColor = (status) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    default: return 'secondary'
  }
}
const formatDate = (datetime) => {
  const date = new Date(datetime)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).replace(/\./g, '.')
}
const directionLabel = (item) => {
  const from = item.from_type === 'wallet'
    ? '사이트 지갑'
    : `외부 (${item.from_platform_id})`

  const to = item.to_platform_id
    ? `외부 (${item.to_platform_id})`
    : '사이트 지갑'

  return `${from} → ${to}`
}

const goToHandler = (item) => {
  const normalizedType = item.type === 'platform_to_platform' ? 'transfer' : item.type

  const map = {
    wallet_charge: '/admin/trade/wallet-charge',
    platform_charge: '/admin/trade/recharge',
    wallet_withdraw: '/admin/trade/wallet-withdraw',
    platform_withdraw: '/admin/trade/withdraw',
    transfer: '/admin/trade/wallet-transfer',
  }

  const target = map[normalizedType] || '/admin/dashboard'
  router.push(target)
}


const fetchRequests = async () => {
  try {
    const res = await axios.get('/admin/requests', {
      params: {
        ...filters.value,
        page: page.value,
        limit
      }
    })


    requests.value = res.data.data
    total.value = res.data.total
  } catch (err) {
    console.error('❌ 요청 실패:', err)
  }
}

const changePage = (newPage) => {
  page.value = newPage
  fetchRequests()
}
const totalPages = computed(() => {
  if (!total.value || total.value < 1) return 1
  return Math.ceil(total.value / limit)
})

const fetchWithResetPage = () => {
  page.value = 1
  fetchRequests()
}

const openDetail = (request) => {
  selectedRequest.value = request
}

const closeDetail = () => {
  selectedRequest.value = null
}

onMounted(() => {
  fetchRequests()
})
</script>
<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
