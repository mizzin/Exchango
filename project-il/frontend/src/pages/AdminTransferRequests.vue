       <!--머니 이동 처리-->

<template>
  <AdminLayout>
    <div class="page-body">
      <div class="container-xl">
        <h2 class="page-title mb-2">🔁 머니 이동 처리</h2>
        <p class="text-muted mb-4">
          ① 지갑 → 외부 플랫폼 ② 외부 → 외부 ③ 외부 → 지갑 신청 목록 (승인/거절)
          !머니이동은 페소 없음. 원화와 usd 단위만 있음.
        </p>
        <div class="card">
          <div class="table-responsive">
            <table class="table table-bordered table-hover">
<thead class="thead-light">
  <tr>
    <th>신청자</th>
    <th>신청금액</th>
    <th>이동방식</th>
    <th>출발 플랫폼</th>
    <th>출플폼 ID</th>
    <th>도착 플랫폼</th>
    <th>도플폼 ID</th>
    
    <th>환산금액(충전원함)</th>
    
    <th>상태</th>
    <th>처리자</th>
    <th>신청일</th>
    <th>처리</th>
    <th>상세</th>
  </tr>
</thead>
<tbody>
  <tr v-for="item in requests" :key="item.id">
    <td>{{ item.username }}</td>
    <td>{{ item.amount.toLocaleString() }} {{ item.currency }}</td>
    <td>{{ formatType(item) }}</td>
    <td>{{ item.from_platform_id || '-' }}</td>
    <td>{{ item.from_platform_user_id || '-' }}</td>
    <td>{{ item.to_platform_id || '-' }}</td>
    <td>{{ item.to_platform_user_id || '-' }}</td>
    
    
    <td>{{ item.expected_amount ? item.expected_amount.toLocaleString() : '-' }}</td>
    
    <td>
      <span :class="['badge', statusClass(item.status)]">
        {{ formatStatus(item.status) }}
      </span>
    </td>
 <td>{{ item.confirmed_by_admin || '-' }}</td>  
 <td>{{ formatDate(item.created_at)}}</td>
    <td>
      <template v-if="item.status === 'pending'">
     <button class="btn btn-success btn-sm" @click="approve(item.id)" :disabled="item.status !== 'pending'">승인</button>
<button class="btn btn-danger btn-sm" @click="reject(item.id)" :disabled="item.status !== 'pending'">거절</button>

      </template>
      <span v-else class="text-muted">-</span>
    </td>
    <td>
  <button class="btn btn-outline-primary btn-sm" @click="selected = item">상세</button>
</td>
  </tr>
</tbody>
            </table>
          </div>
        </div>
        <!-- 페이지네이션 -->
        <ul v-if="totalPages > 1" class="pagination justify-content-center mt-3">
          <li class="page-item" :class="{ disabled: page === 1 }">
            <button class="page-link" @click="changePage(page - 1)">이전</button>
          </li>

          <li v-for="p in totalPages" :key="p" class="page-item" :class="{ active: page === p }">
            <button class="page-link" @click="changePage(p)">{{ p }}</button>
          </li>

          <li class="page-item" :class="{ disabled: page === totalPages }">
            <button class="page-link" @click="changePage(page + 1)">다음</button>
          </li>
        </ul>

      </div>
      
      <div v-if="selected" class="modal-overlay" @click.self="selected = null">
  <div class="my-modal">
    <h3>📄 상세 정보</h3>
    <ul>
      <li><strong>이동방식:</strong> {{ formatType(selected) }}</li>
      <li><strong>금액:</strong> {{ selected.amount }} {{ selected.currency }}</li>
      <li><strong>환산금액:</strong> {{ selected.expected_amount || '-' }}</li>
      <li><strong>환율:</strong> {{ selected.exchange_rate || '-' }}</li>
      <li><strong>출발:</strong> {{ selected.from_type }} / {{ selected.from_platform_id || '-' }}</li>
      <li><strong>도착:</strong> {{ selected.to_platform_id || '-' }} / {{ selected.to_platform_id || '-' }}</li>
      <li><strong>메모:</strong> {{ selected.user_memo || '-' }}</li>
      <li><strong>처리자:</strong> {{ selected.confirmed_by_admin || '-' }}</li>
      <li><strong>처리메모:</strong> {{ selected.admin_note || '-' }}</li>
           <hr />
<hr />
<li><strong>💳 사용자 출금정보</strong></li>
<li><strong>예금주:</strong> {{ selected.user_realname || '-' }}</li>
<li><strong>은행명:</strong> {{ selected.user_bank_name || '-' }}</li>
<li><strong>계좌번호:</strong> {{ selected.user_bank_account || '-' }}</li>
<li><strong>지갑주소:</strong> {{ selected.user_wallet_address || '-' }}</li>

    </ul>
    <button class="btn btn-dark w-100 mt-3" @click="selected = null">닫기</button>
  </div>
</div>
 
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/axiosAdmin'
import AdminLayout from '@/components/AdminLayout.vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

const requests = ref([])
const selected = ref(null)
const page = ref(1)
const totalPages = ref(1)
const limit = 15

const fetchRequests = async () => {
  const res = await axios.get('/admin/wallet/transfer', {
    params: { page: page.value, limit }
    
  })


  requests.value = res.data.data
  totalPages.value = res.data.totalPages

}

const fetchHistory = async () => {
  const res = await axios.get('/user/wallet/move-history', {
    params: {
      page: currentPage.value,
      limit: 15,
      status: selectedStatus.value,
    },
    headers: { Authorization: `Bearer ${token}` },
  })
  history.value = res.data.data
  totalPages.value = res.data.totalPages
}

const changePage = (p) => {
  if (p < 1 || p > totalPages.value) return
  page.value = p
  fetchRequests()
}

const formatType = (item) => {
  if (item.from_type === 'wallet' && item.to_platform_id) return '지갑 → 외부'
  if (item.from_type === 'platform' && (!item.to_platform_id || item.to_platform_id === 'wallet')) return '외부 → 지갑'
  if (item.from_type === 'platform' && item.to_platform_id && item.to_platform_id !== 'wallet') return '외부 → 외부'
  return '기타'
}

const formatStatus = (status) => {
  if (status === 'pending') return '대기중'
  if (status === 'completed') return '승인됨'
  if (status === 'rejected') return '거절됨'
  return status
}

const statusClass = (status) => {
  switch (status) {
    case 'pending': return 'bg-warning text-dark'
    case 'completed': return 'bg-success'
    case 'rejected': return 'bg-danger'
    default: return 'bg-secondary'
  }
}

const formatDate = (str) => {
  if (!str) return '-'
  return dayjs.utc(str).add(8, 'hour').format('YYYY.MM.DD HH:mm:ss')
}

const approve = async (id) => {
  if (!confirm('정말 승인하시겠습니까?')) return
  await axios.patch(`/admin/wallet/transfer/${id}/approve`)
  fetchRequests()
}

const reject = async (id) => {
  const reason = prompt('거절 사유를 입력하세요')
  if (!reason) return
  await axios.patch(`/admin/wallet/transfer/${id}/reject`, { reason })
  fetchRequests()
}

onMounted(fetchRequests)
</script>

<style scoped>
.admin-transfer-list {
  max-width: 1024px;
  margin: auto;
  padding: 2rem;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999
}
  .my-modal {
    display: block;  
  background: white;
  padding: 24px;
  width: 90%;
  max-width: 480px;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}
</style>
