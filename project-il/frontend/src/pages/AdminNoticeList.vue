<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/axiosAdmin'
import AdminLayout from '@/components/AdminLayout.vue'
import '@/assets/style.css'

const router = useRouter()
const notices = ref([])

const currentPage = ref(1)
const perPage = 15
const totalPages = ref(1)

const fetchNotices = async () => {

  const token = localStorage.getItem('admin_token')
  if (!token) {
    alert('로그인이 필요합니다.')
    router.push('/admin/login')
    return
  }

  // ✅ 토큰 만료 체크
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

  // ✅ 서버 페이징 요청
  try {
    const res = await axios.get('/admin/notices', {
      
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: currentPage.value,
        limit: perPage
      }
    })
    notices.value = res.data.notices
      console.log('📢 서버 응답:', res.data)
    totalPages.value = res.data.totalPages
    console.log('📢 totalPages 값:', totalPages.value)
  } catch (err) {
    console.error('❌ 공지 불러오기 실패:', err)
  }
}

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchNotices()
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
          <tr v-if="notices.length === 0">
            <td colspan="5" style="text-align: center; padding: 20px;">등록된 공지사항이 없습니다.</td>
          </tr>
          <tr v-else v-for="notice in notices" :key="notice.id">
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

      <!-- 페이지네이션 -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="changePage(currentPage - 1)" 
          :disabled="currentPage === 1"
        >
          이전
        </button>
        <button 
          v-for="page in totalPages" 
          :key="page" 
          @click="changePage(page)"
          :class="{ active: page === currentPage }"
        >
          {{ page }}
        </button>
        <button 
          @click="changePage(currentPage + 1)" 
          :disabled="currentPage === totalPages"
        >
          다음
        </button>
      </div>
    </div>
  </AdminLayout>
</template>


<style scoped>

  .pagination {
  margin-top: 20px;
  text-align: center;
}
.pagination button {
  margin: 0 5px;
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #011257;
  cursor: pointer;
  transition: all 0.2s ease;
}
.pagination button:hover {
  background: #011257;
}
.pagination button.active {
  font-weight: bold;
  background-color: #4a6cf7;
  color: #fff;
  border: none;
}
.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

  .pagination {
  margin-top: 20px;
  text-align: center;
}

.pagination .active {
  font-weight: bold;
  background-color: #007bff;
  color: white;
  border: none;
}
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

</style>
