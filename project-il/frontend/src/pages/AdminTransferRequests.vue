       <!--머니 이동 처리-->

<template>
  <AdminLayout>
    <div class="page-body">
      <div class="container-xl">
        <h2 class="page-title mb-2">🔁 머니 이동 처리</h2>
        <p class="text-muted mb-4">
          ① 지갑 → 외부 플랫폼 ② 외부 → 외부 ③ 외부 → 지갑 신청 목록 (승인/거절)
        </p>

        <div class="card">
          <div class="table-responsive">
            <table class="table table-bordered table-hover">
              <thead class="thead-light">
                <tr>
                  <th>신청자</th>
                  <th>금액</th>
                  <th>출발 플랫폼</th>
                  <th>도착 플랫폼</th>
                  <th>상태</th>
                  <th>신청일</th>
                  <th>처리</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in requests" :key="item.id">
                  <td>{{ item.username }}</td>
                  <td>{{ item.amount.toLocaleString() }}</td>
                  <td>{{ item.from_platform_id || '-' }}</td>
                  <td>{{ item.to_platform_id || '-' }}</td>
                  <td>
                    <span :class="['badge', statusClass(item.status)]">
                      {{ formatStatus(item.status) }}
                    </span>
                  </td>
                  <td>{{ formatDate(item.created_at) }}</td>
                  <td>
                    <template v-if="item.status === 'pending'">
                      <button class="btn btn-success btn-sm me-1" @click="approve(item.id)">승인</button>
                      <button class="btn btn-danger btn-sm" @click="reject(item.id)">거절</button>
                    </template>
                    <span v-else class="text-muted">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/axiosAdmin'
import AdminLayout from '@/components/AdminLayout.vue'

const requests = ref([])

const fetchRequests = async () => {
  const res = await axios.get('/admin/wallet/transfer')
  requests.value = res.data.data
}

const formatStatus = (status) => {
  if (status === 'pending') return '대기중'
  if (status === 'approved') return '승인됨'
  if (status === 'rejected') return '거절됨'
  return status
}

const statusClass = (status) => {
  switch (status) {
    case 'pending': return 'bg-warning text-dark'
    case 'approved': return 'bg-success'
    case 'rejected': return 'bg-danger'
    default: return 'bg-secondary'
  }
}

const formatDate = (dateStr) => new Date(dateStr).toLocaleString()


const approve = async (id) => {
  if (!confirm('정말 승인하시겠습니까?')) return
  await axios.patch(`/admin/site-transactions/${id}/approve`)
  fetchRequests()
}

const reject = async (id) => {
  const reason = prompt('거절 사유를 입력하세요')
  if (!reason) return
  await axios.patch(`/admin/site-transactions/${id}/reject`, { reason })
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

</style>
