<template>
  <UserLayout>
    <div class="transfer-history">
      <h2 class="page-title">화폐 이력</h2>

      <div v-if="history.length === 0" class="empty-message">
        이력이 없습니다.
      </div>

<div v-else class="history-table-container">
 <table class="history-table">
  <thead>
    <tr>
      <th>신청일</th>
      <th>신청유형</th>
      <th>신청금액</th>
      <th>환산금액</th>
      <th>상태</th>
    </tr>
  </thead>
  <tbody>
    <tr
      v-for="item in history"
      :key="item.id"
      @click="openDetail(item)"
      class="clickable-row"
    >
      <td>{{ formatDate(item.created_at) }}</td>
      <td>{{ formatDirection(item) }}</td>
      <td>{{ formatAmount(item.amount, item.currency) }}</td>
      <td>
        <span v-if="item.expected_amount">
          {{ formatAmount(item.expected_amount, item.currency) }}
        </span>
        <span v-else>-</span>
      </td>
      <td>
        <span :class="'badge status-' + item.status">
          {{ formatStatus(item.status) }}
        </span>
      </td> 
    </tr>
  </tbody>
</table>


</div>


      <!-- 상세 모달 -->
      <div v-if="selected" class="modal-overlay" @click.self="selected = null">
        <div class="modal">
          <h3>상세 정보</h3>
          <ul>
            <li><strong>이력 유형:</strong> {{ formatType(selected.type) }}</li>
            <li><strong>보내는 지:</strong> {{ selected.from_type }} - {{ selected.from_platform_user_id }}</li>
            <li><strong>받는 지:</strong> {{ selected.to_platform_id }} - {{ selected.to_platform_user_id }}</li>
            <li><strong>금액:</strong> {{ formatAmount(selected.amount, selected.currency) }}</li>
            <li v-if="selected.expected_amount"><strong>예상 수령 금액:</strong> {{ formatAmount(selected.expected_amount, selected.currency) }}</li>
            <li v-if="selected.exchange_rate"><strong>환율:</strong> {{ selected.exchange_rate }}</li>
            <li v-if="selected.user_memo"><strong>사용자 메모:</strong> {{ selected.user_memo }}</li>
            <li v-if="selected.admin_note"><strong>관리자 메모:</strong> {{ selected.admin_note }}</li>
            <li><strong>상태:</strong> {{ formatStatus(selected.status) }}</li>
            <li><strong>시작 시간:</strong> {{ formatDate(selected.created_at) }}</li>
            <li><strong>처리 시간:</strong> {{ formatDate(selected.updated_at) }}</li>
          </ul>
          <button @click="selected = null" class="btn-dark">닫기</button>
        </div>
      </div>
    </div>
  </UserLayout>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/axiosUser'
import UserLayout from '@/components/UserLayout.vue'

const history = ref([])
const selected = ref(null)

const fetchHistory = async () => {
  try {
    const res = await axios.get('/api/transactions/wallet/transfer/history')
    history.value = res.data.data
  } catch (err) {
    alert('\uC774\uB825 \uBD88\uB7EC\uC624\uAE30 \uC2E4\uD328')
  }
}

const openDetail = (item) => {
  selected.value = item
}

const formatDate = (str) => new Date(str).toLocaleString()
const formatAmount = (val, currency) => `${Number(val).toLocaleString()} ${currency}`
const formatType = (type) => {
  switch (type) {
    case 'wallet_to_platform': return '지갑 → 플랫폼'
    case 'platform_to_wallet': return '플랫폼 → 지갑'
    case 'platform_to_platform': return '플랫폼 → 플랫폼'
    default: return type
  }
}
const formatDirection = (item) => formatType(item.type)
const formatStatus = (status) => {
  switch (status) {
    case 'pending': return '대기중'
    case 'completed': return '완료'
    case 'rejected': return '거절'
    case 'cancelled': return '취소'
    default: return status
  }
}

onMounted(fetchHistory)
</script>

<style scoped>
.history-table-container {
  overflow-x: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.history-table th,
.history-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  text-align: left;
}

.history-table th {
  background-color: #f8f9fa;
  font-weight: bold;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable-row:hover {
  background-color: #f0f8ff;
}

.transfer-history {
  padding: 20px;
}
.page-title {
  font-size: 20px;
  margin-bottom: 16px;
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.history-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: background 0.2s ease;
}
.history-item:hover {
  background: #f9f9f9;
}
.status-pending { color: orange; }
.status-completed { color: green; }
.status-rejected, .status-cancelled { color: red; }
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  max-width: 480px;
  width: 90%;
}
.modal h3 {
  margin-bottom: 16px;
}
.modal ul {
  list-style: none;
  padding: 0;
}
.modal li {
  margin-bottom: 8px;
  font-size: 14px;
}
.btn-dark {
  margin-top: 16px;
  padding: 8px 16px;
  background: #333;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.btn-dark:hover {
  background: #000;
}
</style>
