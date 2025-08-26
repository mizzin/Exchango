<template>
  <AdminLayout>
    <div class="notice-list">
      <div class="notice-header">
        <h2>Notice List</h2>
        <button class="create-btn" @click="goToCreate">새 글 등록하기</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Language</th>
            <th>Title</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedNotices.length === 0">
            <td colspan="5" style="text-align: center; padding: 20px;">등록된 공지사항이 없습니다.</td>
          </tr>
          <tr v-else v-for="notice in paginatedNotices" :key="notice.id">
            <td>{{ notice.id }}</td>
            <td>{{ notice.language }}</td>
            <td>{{ notice.title }}</td>
            <td>{{ formatDate(notice.created_at) }}</td>
            <td>
              <button @click="editNotice(notice.id)">Edit</button>
              <button @click="deleteNotice(notice.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="totalPages > 1" class="pagination">
        <button 
          v-for="page in totalPages" 
          :key="page" 
          @click="changePage(page)"
          :class="{ active: page === currentPage }"
        >
          {{ page }}
        </button>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/axiosAdmin'
import AdminLayout from '@/components/AdminLayout.vue'
import '@/assets/style.css'

const router = useRouter()
const notices = ref([])

const currentPage = ref(1)
const perPage = 20

const paginatedNotices = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return notices.value.slice(start, start + perPage)
})

const totalPages = computed(() => Math.ceil(notices.value.length / perPage))

const changePage = (page) => {
  currentPage.value = page
}

const fetchNotices = async () => {
  const token = localStorage.getItem('admin_token')
  if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]))
  //console.log('📦 토큰 payload:', payload)
}
  if (!token) {
    alert('로그인이 필요합니다.')
    router.push('/admin/login')
    return
  }

  // ✅ JWT 만료 확인
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp * 1000 < Date.now()) {
      alert('세션이 만료되었습니다. 다시 로그인해주세요.')
      localStorage.removeItem('admin_token')
      router.push('/admin/login')
      return
    }
  } catch (e) {
    console.error('토큰 파싱 오류:', e)
    router.push('/admin/login')
    return
  }

  // ✅ 여기에 도달하면 유효한 토큰 → axios 실행
  try {
    const res = await axios.get('/admin/notices', {
      headers: { Authorization: `Bearer ${token}` }
    })
    notices.value = res.data.notices
  } catch (err) {
    console.error('❌ 공지 불러오기 실패:', err)
  }
}

const editNotice = (id) => {
  router.push(`/admin/notices/${id}/edit`)
}

const deleteNotice = async (id) => {
  if (!confirm('정말 삭제하시겠습니까?')) return
  const token = localStorage.getItem('admin_token')

  try {
    await axios.delete(`/admin/notices/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    fetchNotices()
  } catch (err) {
    console.error('❌ 삭제 실패:', err)
  }
}

const goToCreate = () => {
  router.push('/admin/notices/create')
}

const formatDate = (dateStr) => new Date(dateStr).toLocaleString()

onMounted(fetchNotices)
</script>

<style scoped>
.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.create-btn {
  background-color: #4a6ef6;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  padding: 10px;
  border: 1px solid #ccc;
  text-align: left;
}

button {
  margin-right: 6px;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

.pagination button {
  margin: 0 4px;
  padding: 6px 12px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
}

.pagination button.active {
  background: #4a6ef6;
  color: white;
  font-weight: bold;
}
</style>
