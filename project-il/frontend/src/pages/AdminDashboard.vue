<template>
  <AdminLayout>
    <div class="dashboard">
      <h2>관리자 대시보드</h2>

      <div class="stats">
        <div class="card">
          <h3>총 승인된 사용자 수<br/> (test/admin 계정 제외)</h3>
          <p>{{ totalUsers }}</p>
        </div>
        <div class="card">
          <h3>오늘 신규 가입자 수</h3>
          <p>{{ pendingUsers }}</p>
        </div>
        <div class="card">
          <h3>가입 대기자 수</h3>
          <p>{{ todayUsers }}</p>
        </div>
      <div class="card">
          <h3>대기 중 충전 신청 수 (내지갑 + 이동 둘 다 포함)</h3>
          <p>{{ pendingRecharge  }}</p>
        </div>
        <div class="card">
          <h3>대기 중 출금 신청 수</h3>
          <p>{{ pendingWithdraw  }}</p>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/AdminLayout.vue'
import { ref, onMounted } from 'vue'
import axios from '@/axiosAdmin'
import '@/assets/style.css' 

const totalUsers = ref(0)
const pendingUsers = ref(0)
const todayUsers = ref(0)
const pendingRecharge = ref(0)
const pendingWithdraw = ref(0)

const fetchStats = async () => {
  const token = localStorage.getItem('admin_token')
  try {
    const res = await axios.get('/admin/summary', {
      headers: { Authorization: `Bearer ${token}` }
    })
    totalUsers.value = res.data.totalUsers
    pendingUsers.value = res.data.pendingUsers
    todayUsers.value = res.data.todayUsers
     pendingRecharge.value = res.data.pendingRecharge
    pendingWithdraw.value = res.data.pendingWithdraw
  } catch (err) {
    console.error('통계 로딩 실패:', err)
  }
}

onMounted(fetchStats)
</script>

<style scoped>
.dashboard {
  text-align: center;
  margin-top: 40px;
}
.stats {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}
.card {
  background: #f0f4ff;
  padding: 20px;
  border-radius: 10px;
  min-width: 120px;
}
.card h3 {
  margin-bottom: 8px;
}
.links a {
  margin: 0 10px;
}
</style>
