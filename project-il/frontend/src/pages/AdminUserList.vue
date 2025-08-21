
<template>
  <AdminLayout>
    <div class="admin-users">
      <h2>회원 목록</h2>
      <div class="row g-2 mb-3">
  <div class="col-sm-2">
    <input v-model="filters.username" class="form-control" placeholder="아이디" />
  </div>
  <div class="col-sm-2">
    <select v-model="filters.status" class="form-select">
      <option value="">전체 상태</option>
      <option value="pending">대기중</option>
      <option value="approved">승인됨</option>
      <option value="blocked">차단됨</option>
    </select>
  </div>
  <div class="col-sm-2">
    <input type="date" v-model="filters.startDate" class="form-control" />
  </div>
  <div class="col-sm-2">
    <input type="date" v-model="filters.endDate" class="form-control" />
  </div>
  <div class="col-sm-2 form-check mt-2">
    <input type="checkbox" v-model="filters.warningOnly" class="form-check-input" id="warnOnly" />
    <label class="form-check-label" for="warnOnly">경고 1회 이상</label>
  </div>

      </div>
      <div class="mb-3">
        <button @click="fetchUsers" class="btn btn-primary me-2">검색</button>
        <button @click="resetFilters" class="btn btn-secondary">초기화</button>
      </div>
      <table class="table table-bordered">
        <thead class="thead-light">
          <tr>
            <th>아이디</th>
            <th>이름</th>
            <th>상태</th>
            <th>가입일</th>
            <th>승인 여부</th>
            <th>상세</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.username }}</td>
            <td>{{ user.real_name || '-' }}</td>
            <td>
              <span :class="['badge', statusColor(user.status)]">{{ user.status }}</span>
            </td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>
              <template v-if="user.status === 'pending'">
                <button class="btn btn-success btn-sm me-1" @click="approve(user.id)">승인</button>
                <button class="btn btn-danger btn-sm" @click="reject(user.id)">거절</button>
              </template>
              <span v-else>{{ formatStatus(user.status) }}</span>
            </td>
            <td>
              <button class="btn btn-outline-primary btn-sm" @click="viewUser(user.id)">상세보기</button>
            </td>
          </tr>
        </tbody>
      </table>

            <!-- 페이지네이션 -->
      <div class="pagination justify-content-center mt-4">
        <button class="btn btn-outline-secondary btn-sm me-1" @click="changePage(currentPage - 1)" :disabled="currentPage === 1">이전</button>
        <button
          v-for="page in visiblePages"
          :key="page"
          class="btn btn-sm me-1"
          :class="currentPage === page ? 'btn-primary' : 'btn-outline-secondary'"
          @click="changePage(page)">
          {{ page }}
        </button>
        <button class="btn btn-outline-secondary btn-sm" @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">다음</button>
      </div>

    </div>
  </AdminLayout>
  </template>
  
<script setup>
  import AdminLayout from '@/components/AdminLayout.vue'
  import { ref, onMounted, reactive  } from 'vue'
  import axios from '@/axiosAdmin'
  import { useRouter } from 'vue-router'

  const router = useRouter()
  const users = ref([])
  const currentPage = ref(1)
  const totalPages = ref(1)
  const visiblePages = ref([])
  const pageSize = 15

  const filters = reactive({
    username: '',
    status: '',
    startDate: '',
    endDate: '',
    warningOnly: false,
    platform: '',
    referral_id: ''
  })
  const statusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-warning text-dark'
    case 'approved':
      return 'bg-success'
    case 'blocked':
    case 'rejected':
      return 'bg-danger'
    default:
      return 'bg-secondary'
  }
}
const formatStatus = (status) => {
  switch (status) {
    case 'pending': return '대기중'
    case 'approved': return '승인됨'
    case 'blocked': return '차단됨'
    case 'rejected': return '거절됨'
    default: return status
  }
}

      const platformOptions = ref([])

      const fetchPlatformOptions = async () => {
        try {
          const res = await axios.get('/platforms?lang=ko')
          platformOptions.value = (res.data.platforms || []).filter(p => p.name)
        } catch (err) {
          console.error('플랫폼 목록 불러오기 실패:', err)
          platformOptions.value = []
        }
      }
 

    const fetchUsers = async () => {
    const token = localStorage.getItem('admin_token')
    try {
      const res = await axios.get('/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          ...filters,
          page: currentPage.value,
          limit: pageSize
        }
      })
      users.value = res.data.users
      totalPages.value = res.data.totalPages
      updateVisiblePages()
    } catch (err) {
      console.error('❌ 사용자 목록 로딩 실패:', err)
    }
  }

  const resetFilters = () => {
    filters.username = ''
    filters.status = ''
    filters.startDate = ''
    filters.endDate = ''
    filters.warningOnly = false
    filters.platform = ''
    filters.referral_id = ''
    fetchUsers()
  }

  const changePage = (page) => {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
    fetchUsers()
  }

  const updateVisiblePages = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage.value - 2)
    let end = Math.min(totalPages.value, start + maxVisible - 1)

    // 앞쪽 페이지 수 부족 시 보정
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    visiblePages.value = pages
  }

  const approve = async (id) => {
    const token = localStorage.getItem('admin_token')
    await axios.patch(`/admin/users/${id}/approve`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    alert('승인 완료')
    fetchUsers()
  }
  const reject = async (id) => {
  const reason = prompt('거절 사유를 입력하세요:')
  if (reason === null || reason.trim() === '') {
    alert('거절 사유를 입력해야 합니다.')
    return
  }

  const token = localStorage.getItem('admin_token')
  try {
    await axios.patch(`/admin/users/${id}/reject`, 
      { reason }, // ✅ body에 사유 포함
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )
    alert('거절 완료')
    fetchUsers()
  } catch (err) {
    alert('거절 실패: ' + (err.response?.data?.message || err.message))
  }
}


  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString()
  
  const viewUser = (id) => {
    router.push(`/admin/users/${id}`) 
  }

 onMounted(() => {
  fetchPlatformOptions()
  fetchUsers()
})
</script>
  
  <style scoped>
  .admin-users{
    max-width: 1024px;
    margin: auto;
    padding: 2rem;
  }

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

  </style>
  