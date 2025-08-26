
<template>
  <AdminLayout>
    <div class="admin-users">
      <h2>회원 목록</h2>
      <div class="filter-row">
        <input v-model="filters.username" placeholder="아이디" />

        <select v-model="filters.status">
          <option value="">전체 상태</option>
          <option value="pending">대기중</option>
          <option value="approved">승인됨</option>
          <option value="blocked">차단됨</option>
        </select>

        <input type="date" v-model="filters.startDate" />
        ~
        <input type="date" v-model="filters.endDate" />

        <label class="checkbox-label">
          <input type="checkbox" v-model="filters.warningOnly" />
          경고 1회 이상
        </label>
        </div>
        <div class="filter-row">
        

        <input v-model="filters.referral_id" placeholder="추천인 ID" />

        <button @click="fetchUsers">검색</button>
        <button @click="resetFilters">초기화</button>
      </div>
      <table>
        <thead>
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
            <td>{{ user.status || '-' }}</td>
            <td>{{ user.created_at ? formatDate(user.created_at) : '-' }}</td>
            <td>
              <template v-if="user.status === 'pending'">
                <button class="btn-approve" @click="approve(user.id)">승인</button>
                <button class="btn-reject" @click="reject(user.id)">거절</button>
              </template>
              <span v-else-if="user.status === 'approved'">승인됨</span>
              <span v-else-if="user.status === 'rejected'">거절됨</span>
              <span v-else>처리완료</span>
            </td>
            <td>
              <button @click="viewUser(user.id)">상세보기</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 페이지네이션 -->
      <div class="pagination" v-if="totalPages > 1">
        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">이전</button>
        <span v-for="page in visiblePages" :key="page">
          <button :class="{ active: currentPage === page }" @click="changePage(page)">{{ page }}</button>
        </span>
        <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">다음</button>
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
  table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  font-size: 0.85rem;
  }
  th, td {
    border: 1px solid #ccc;
    padding: 0.2rem;
    text-align: center;
  }
 thead {
  background-color: #f0f4ff;
  font-weight: bold;
 }
 tbody tr:hover {
  background-color: #eef3ff; 
  transition: background-color 0.2s ease;
}
  .pagination {
  margin-top: 20px;
  text-align: center;
}
.pagination button {
  margin: 0 5px;
  padding: 5px 10px;
}
.pagination .active {
  font-weight: bold;
  background-color: #007bff;
  color: white;
  border: none;
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
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}
.date-filter-row {
  justify-content: space-between;
  flex-wrap: wrap;
}

.filter-row input:not([type="checkbox"]),
.filter-row select {
  height: 36px;
  padding: 6px 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  min-width: 140px;
  max-width: 200px;
}


.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.btn-search,
.btn-reset {
  padding: 6px 12px;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-search {
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 4px;
}

.btn-reset {
  background-color: #f2f2f2;
  border: 1px solid #ccc;
  border-radius: 4px;
}

  </style>
  