<template>
  <AdminLayout>
    <div class="admin-user-detail">
      <h2>👤 사용자 상세 정보</h2>
      <div v-if="user">
        <p><strong>아이디:</strong> {{ user.username }}</p>
        <p><strong>이름:</strong> {{ user.real_name || '-' }}</p>
        <p><strong>전화번호:</strong> {{ user.phone || '-' }}</p>
        <p><strong>추천인:</strong> {{ user.referral_id || '-' }}</p>
        <p><strong>상태:</strong> {{ user.status }}</p>
        <p><strong>가입일:</strong> {{ formatDate(user.created_at) }}</p>
        <p><strong>경고 횟수:</strong> {{ user.warning_count }}</p>
        <p><strong>은행명:</strong> {{ user.bank_name || '-' }}</p>
        <p><strong>계좌번호:</strong> {{ user.bank_account || '-' }}</p>
        <div v-if="user.platforms && user.platforms.length">
            <strong>플랫폼 정보:</strong>
            <ul>
                <li v-for="(p, i) in user.platforms" :key="i">
                {{ p.platform_name }} - {{ p.platform_user_id }}
                </li>
            </ul>
        </div>
        <p><strong>관리자 메모:</strong></p>
        <textarea v-model="adminNote" rows="4" style="width: 100%"></textarea>
        <button @click="saveNote" class="btn-save">메모 저장</button>
        <hr />
            <h3>등록된 플랫폼</h3>
            <table class="platform-table" v-if="platforms.length > 0">
                <thead>
                    <tr>
                    <th>플랫폼 이름</th>
                    <th>플랫폼 아이디</th>
                    <th>수정</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="p in platforms" :key="p.id">
                    <td>{{ p.platform_name }}</td>
                    <td>
                        <template v-if="editingId === p.id">
                            <input
                            v-model="editedPlatformIds[p.id]"
                            style="min-width: 140px; color: #000;"
                            />
                        </template>
                        <template v-else>
                            <span>{{ p.platform_user_id }}</span>
                        </template>
                        </td>

                        <td>
                        <template  v-if="editingId === p.id">
                            <button @click="updatePlatformId(p.id)">저장</button>
                            <button @click="editingId = null">취소</button>
                        </template>
                        <template v-else>
                            <button @click="startEdit(p.id, p.platform_user_id)">수정</button>
                        </template>
                        </td>
                    </tr>
                </tbody>
            </table>
            <p v-else>등록된 플랫폼이 없습니다.</p>
        <h4>➕ 플랫폼 추가</h4>
        <div class="platform-add-row">
            <select v-model="newPlatform.platform_id">
              <option value="">플랫폼 선택</option>
              <option v-for="p in platformOptions" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>

            <input v-model="newPlatform.platform_user_id" placeholder="플랫폼 아이디 입력" />
            <button @click="addPlatform">추가</button>
        </div>

        <hr />
        <div style="margin-top: 1rem;">
        <button class="btn-block" @click="blockUser">🚫 차단</button>
        <button class="btn-warning" @click="warnUser">⚠️ 경고 부여</button>
        <button class="btn-unblock" v-if="user.status === 'blocked'" @click="unblockUser">🔓 차단 해제</button>
        <button class="back-btn" @click="goToList">목록으로</button>
        </div>
      </div>
      <div v-else>Loading...</div>
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/AdminLayout.vue'
import { onMounted, ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/axiosAdmin'
import '@/assets/style.css';

const router = useRouter()
const route = useRoute()
const user = ref(null)
const adminNote = ref('')
const platforms = ref([])
const editedPlatformIds = reactive({})
const editingId = ref(null) // 현재 수정 중인 플랫폼의 id


const newPlatform = reactive({
  platform_id: '',
  platform_user_id: ''
})
const platformOptions = ref([])

const fetchPlatformOptions = async () => {
  try {
    const lang = localStorage.getItem('lang') || 'ko'
    const res = await axios.get('/platforms?lang=ko')
     platformOptions.value = res.data
  } catch (err) {
    console.error('플랫폼 목록 로딩 실패:', err)
  }
}
console.log(platformOptions.value);
const fetchPlatforms = async () => {
  const token = localStorage.getItem('admin_token')
  try {
    const res = await axios.get(`/admin/users/${route.params.id}/platforms`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    platforms.value = res.data.platforms
  } catch (err) {
    console.error('❌ 플랫폼 목록 로딩 실패:', err)
  }
}
const startEdit = (id, currentValue) => {
  editedPlatformIds[id] = currentValue
  editingId.value = id
}
const updatePlatformId = async (platformId) => {
  const token = localStorage.getItem('admin_token')
  const newId = editedPlatformIds[platformId]
  if (!newId) return alert('플랫폼 아이디를 입력해주세요.')

  try {
    const res = await axios.patch(
      `/admin/users/${route.params.id}/platforms/${platformId}`,
      { platform_user_id: newId },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    alert(res.data.message)
    fetchPlatforms()
  } catch (err) {
    console.error('❌ 수정 실패:', err)
    alert(err.response?.data?.message || '수정 실패')
  }
}

const fetchUser = async () => {
  const token = localStorage.getItem('admin_token')
  try {
    const res = await axios.get(`/admin/users/${route.params.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    user.value = res.data.user 
    adminNote.value = res.data.user.admin_note || '' 
    console.log(user.value)
  } catch (err) {
    console.error('❌ 사용자 상세 조회 실패:', err)
  }
}

const saveNote = async () => {
  const token = localStorage.getItem('admin_token')
  try {
    await axios.patch(`/admin/users/${route.params.id}/note`, {
      note: adminNote.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    alert('메모가 저장되었습니다.')
  } catch (err) {
    console.error('❌ 메모 저장 실패:', err)
    alert('메모 저장 실패')
  }
}
const addPlatform = async () => {
  const token = localStorage.getItem('admin_token')
  try {
    const res = await axios.post(
      `/admin/users/${route.params.id}/platforms`,
      { ...newPlatform },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    alert(res.data.message)
    fetchPlatforms()
    newPlatform.platform_name = ''
    newPlatform.platform_user_id = ''
  } catch (err) {
    console.error('❌ 플랫폼 추가 실패:', err)
    alert(err.response?.data?.message || '추가 실패')
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? '-' : date.toLocaleDateString()
}

const blockUser = async () => {
  const token = localStorage.getItem('admin_token')
  try {
    await axios.patch(`/admin/users/${route.params.id}/block`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    alert('사용자가 차단되었습니다.')
    fetchUser()
  } catch (err) {
    console.error('❌ 차단 실패:', err)
  }
}
const unblockUser = async () => {
  const token = localStorage.getItem('admin_token')
  try {
    await axios.patch(`/admin/users/${route.params.id}/unblock`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    alert('차단이 해제되었습니다.')
    fetchUser()
  } catch (err) {
    console.error('❌ 차단 해제 실패:', err)
    alert('차단 해제 실패')
  }
}

const warnUser = async () => {
  const token = localStorage.getItem('admin_token')
  try {
    await axios.patch(`/admin/users/${route.params.id}/warning`, {
      reason: '관리자 수동 경고',     
      severity: 1                    
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
 
    alert('경고가 부여되었습니다.')
    fetchUser()
  } catch (err) {
    console.error('❌ 경고 실패:', err)
    alert('경고 실패')
  }
}
const goToList = () => {
  router.push('/admin/users');
};
onMounted(() => {
  fetchUser()
  fetchPlatforms()
  fetchPlatformOptions()
})
</script>

<style scoped>
.admin-user-detail {
  max-width: 800px;
  margin: auto;
  padding: 2rem;
  background: #f9f9f9;
  border-radius: 10px;
}
p {
  margin-bottom: 0.5rem;
}
.btn-block {
  background-color: #dc3545;
  color: white;
}
.btn-unblock {
  background-color: #198754;
  color: white;
}
button{
      margin-right: 10px;
}
.platform-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.platform-table th,
.platform-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: center;
  font-size: 0.9rem;
}

.platform-add-row {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}
.platform-add-row input,
.platform-add-row select {
  padding: 5px;
  font-size: 0.9rem;
}

</style>
