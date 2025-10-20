<template>
  <AdminLayout>
    <div class="admin-user-detail">
      <h2>👤 사용자 상세 정보</h2>
      <div v-if="user">
        <div class="readonly-section">
          <h3>🔒 기본 정보(수정불가능)</h3>
          <p>보안 및 데이터 관리를 위해 수정이 불가능합니다.</p>
          <p><strong>아이디(사용자 계정 고유 식별자입니다.):</strong> {{ user.username }}</p>
          <p><strong>이메일(인증 및 알림에 사용):</strong> {{ user.email || '-' }}</p>
          <p><strong>상태(시스템에서 자동으로 관리되는 상태값):</strong> {{ user.status }}</p>
          <p><strong>가입일(이력 관리 목적상 수정할 수 없음):</strong> {{ formatDate(user.created_at) }}</p>
          <p><strong>지갑 주소:</strong> {{ user.wallet_address || '-' }}</p>
          <p><strong>페소타입:</strong> {{ user.peso_account_type  || '-' }}</p>
          <p><strong>페소 주소:</strong> {{ user.peso_account   || '-' }}</p>
          <p><strong>경고 횟수:</strong> {{ user.warning_count }}</p>

        </div>
        <div class="editable-section">
          <h3>📝 수정 가능 정보</h3>
          <p>아래 항목은 관리자가 직접 수정할 수 있습니다.<br>
          단, 한 번 수정하면 이전 값으로 되돌릴 수 없습니다. 반드시 확인 후 신중하게 변경해주세요.</p>
          <label>이름
            <input v-model="editable.real_name" type="text" />
          </label>
          <label>전화번호
            <input v-model="editable.phone" type="text" />
          </label>
          <label>추천인
            <input v-model="editable.referral_id" type="text" />
          </label>
          <label>은행명
            <input v-model="editable.bank_name" type="text" />
          </label>
          <label>계좌번호
            <input v-model="editable.bank_account" type="text" />
          </label>
          <button @click="submitEdit">💾 저장</button>
        </div>
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
<button @click="showPasswordResetModal = true" class="btn-reset-password">
  🔐 비밀번호 초기화
</button>
        <Modal v-if="showPasswordResetModal" @close="showPasswordResetModal = true">
          <h3>비밀번호 초기화</h3>
          <input
            v-model="newPassword"
            type="text"
            placeholder="임시 비밀번호 입력"
            style="width: 100%; margin-bottom: 1rem;"
          />
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button @click="submitResetPassword" class="btn-submit">확인</button>
            <button @click="showPasswordResetModal = false" class="btn-cancel">취소</button>
          </div>
        </Modal>
        <hr />
            <h3>등록된 플랫폼</h3>
            <p>그 플랫폼 삭제 원하시는 경우 개발자에게 요청하세요~</p>
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
              <option v-for="p in platformOptions" :key="p.platform_id" :value="p.platform_id">
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
import Modal from '@/components/Modal.vue'

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
//0701
const showPasswordResetModal = ref(false);
const submitResetPassword = async () => {
  try {
    if (!user.value) throw new Error('user.value 없음');
    if (!user.value.id) throw new Error('user.id 없음');
    if (!newPassword.value) throw new Error('비밀번호 입력 필요');

    const id = user.value.id;
    console.log('🔧 비밀번호 초기화 요청 대상 ID:', id);

    const path = `/admin/users/${id}/password`;
    console.log('📡 요청 경로:', path);

    await axios.patch(path, {
      newPassword: newPassword.value,
    });

    alert(`임시 비밀번호가 저장되었습니다: ${newPassword.value}`);
    showPasswordResetModal.value = false;
  } catch (err) {
    console.error('비밀번호 초기화 실패:', err);
    alert(err.message || '비밀번호 초기화 실패');
  }
};
//0701
const editable = reactive({
  real_name: '',
  phone: '',
  referral_id: '',
  bank_name: '',
  bank_account: ''
})
//0701
const fetchUser = async () => {
  const token = localStorage.getItem('admin_token')
  try {
    const res = await axios.get(`/admin/users/${route.params.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    user.value = res.data.user
    adminNote.value = res.data.user.admin_note || ''

    // 🧩 추가: editable 필드 복사
    editable.real_name = user.value.real_name || ''
    editable.phone = user.value.phone || ''
    editable.referral_id = user.value.referral_id || ''
    editable.bank_name = user.value.bank_name || ''
    editable.bank_account = user.value.bank_account || ''
  } catch (err) {
    console.error('❌ 사용자 상세 조회 실패:', err)
  }
}
//0701
const submitEdit = async () => {
  const token = localStorage.getItem('admin_token')
  try {
    await axios.patch(`/admin/users/${route.params.id}`, editable, {
      headers: { Authorization: `Bearer ${token}` }
    })
    alert('수정이 완료되었습니다.')
    fetchUser()
  } catch (err) {
    console.error('❌ 사용자 정보 수정 실패:', err)
    alert('수정 실패')
  }
}

const newPassword = ref('');

const fetchPlatformOptions = async () => {
  try {
    const lang = localStorage.getItem('lang') || 'ko'
    const res = await axios.get('/platforms?lang=ko')
        console.log("📥 플랫폼 옵션 API 응답:", res.data)

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
        console.log("📤 보내는 데이터:", {
      platform_id: newPlatform.platform_id,
      platform_user_id: newPlatform.platform_user_id
    })
    const res = await axios.post(
      `/admin/users/${route.params.id}/platforms`,
       {
        platform_id: newPlatform.platform_id,
        platform_user_id: newPlatform.platform_user_id
      },
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
.readonly-section {
  background: #f1f1f1;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.editable-section {
  background: #fff;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.editable-section label {
  display: block;
  margin-bottom: 1rem;
}
.editable-section input {
  width: 100%;
  padding: 6px;
  margin-top: 4px;
}

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
.note {
  font-size: 12px;
  color: #cc3300;
  margin-top: 10px;
}
.platform-add-row input,
.platform-add-row select {
  padding: 5px;
  font-size: 0.9rem;
}
.btn-reset-password {
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #bbb;
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: 500;
  margin-top: 1rem;
  cursor: pointer;
}

.small-note {
  font-size: 0.75rem;
  color: #cc3300;
  margin-top: 6px;
}

</style>
