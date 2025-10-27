<template>
  <AdminLayout>
    <div class="admin-events">
      <h2 class="mb-4">이벤트 관리</h2>
<p>이벤트 등록 후 해당 신청내역에 버튼이 생성됩니다. 이벤트에 해당되는 회원은 생성된 버튼을 클릭하시면 보너스율이 적용됩니다. <br/> (!! 이벤트 생성 후 test1234 계정으로 테스트 부탁드립니다. 개인계정으로 테스트 하지마세요!!)</p>

      <!-- ✅ 이벤트 등록 폼 -->
      <form @submit.prevent="createEvent" class="card p-4 mb-5">
        <h5 class="mb-3">새 이벤트 등록</h5><p>이벤트가 중복 날짜에 2개 생성될 수는 없숨니돠.</p>
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">이벤트명</label>
            <input v-model="newEvent.event_name" type="text" class="form-control" required />
          </div>

          <div class="col-md-3">
            <label class="form-label">시작일</label>
            <input v-model="newEvent.start_date" type="date" class="form-control" required />
          </div>

          <div class="col-md-3">
            <label class="form-label">종료일 (시작일보다 이전으로 클릭하지 마세요.)</label>
            <input v-model="newEvent.end_date" type="date" class="form-control" required />
          </div>

          <div class="col-md-2">
            <label class="form-label">보너스율(%)</label>
            <input v-model.number="newEvent.bonus_rate" type="number" step="0.01" class="form-control" required />
          </div>

          <div class="col-md-3">
            <label class="form-label">대상유형</label>
            <select v-model="newEvent.target_type" class="form-select" required>
              <option disabled value="">선택</option>
              <option value="first_charge">첫충전</option>
              <option value="all_charge">모든충전</option>
              
              <option value="custom">기타</option>
            </select>
          </div>
        </div>

        <div class="mt-4">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? '등록 중...' : '등록하기' }}
          </button>
        </div>
      </form>

      <!-- ✅ 이벤트 목록 -->
      <div class="card p-4">
        <h5 class="mb-3">이벤트 목록</h5>

        <table class="table table-striped align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>이벤트명</th>
              <th>기간</th>
              <th>보너스율</th>
              <th>유형</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in events" :key="e.id">
              <td>{{ e.id }}</td>
              <td>{{ e.event_name }}</td>
              <td>{{ e.start_date }} ~ {{ e.end_date }}</td>
              <td>{{ e.bonus_rate }}%</td>
              <td>{{ getTypeLabel(e.target_type) }}</td>
              <td>
                <span
                  class="badge"
                  :class="e.is_active ? 'bg-success' : 'bg-secondary'"
                >
                  {{ e.is_active ? '활성' : '비활성' }}
                </span>
              </td>
              <td>
                <button
                  class="btn btn-sm btn-outline-primary me-2"
                  @click="toggleEvent(e.id)"
                >
                  {{ e.is_active ? '비활성화' : '활성화' }}
                </button>
                <button
                  class="btn btn-sm btn-outline-danger"
                  @click="deleteEvent(e.id)"
                >
                  삭제
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axiosAdmin from '@/axiosAdmin'
import Swal from 'sweetalert2'
import AdminLayout from '@/components/AdminLayout.vue'

const events = ref([])
const newEvent = ref({
  event_name: '',
  start_date: '',
  end_date: '',
  bonus_rate: '',
  target_type: '',
})
const loading = ref(false)

const fetchEvents = async () => {
  try {
    const res = await axiosAdmin.get('/admin/events')
    events.value = res.data
  } catch (err) {
    console.error('❌ 이벤트 목록 불러오기 실패:', err)
  }
}

const getTypeLabel = (type) =>{
    const map ={
        first_charge: '첫 충전',
        all_charge: '모든 충전',
        withdraw: '출금',
        custom: '기타',
    }
    return map[type] || type
}

const createEvent = async () => {
  if (loading.value) return
  loading.value = true

  // 🔹 날짜 유효성 체크
  if (newEvent.value.end_date < newEvent.value.start_date) {
    Swal.fire('오류', '종료일은 시작일 이후여야 합니다.', 'warning')
    loading.value = false
    return
  }

  try {
    // 🔹 기존 이벤트 중 활성화된(is_active=1) 이벤트만 가져오기
    const res = await axiosAdmin.get('/admin/events')
    const existingEvents = res.data || []

    const isOverlap = existingEvents.some(ev => {
      if (!ev.is_active) return false // 비활성 이벤트는 무시
      const newStart = new Date(newEvent.value.start_date)
      const newEnd = new Date(newEvent.value.end_date)
      const evStart = new Date(ev.start_date)
      const evEnd = new Date(ev.end_date)
      return newStart <= evEnd && newEnd >= evStart
    })

    if (isOverlap) {
      Swal.fire('⚠️ 중복 기간 감지', '이미 같은 기간의 활성 이벤트가 존재합니다.', 'warning')
      loading.value = false
      return
    }

    // 🔹 등록
    await axiosAdmin.post('/admin/events', newEvent.value)
    Swal.fire('완료', '이벤트가 등록되었습니다.', 'success')
    await fetchEvents()
    newEvent.value = { event_name: '', start_date: '', end_date: '', bonus_rate: '', target_type: '' }
  } catch (err) {
    console.error('❌ 이벤트 등록 실패:', err)
    Swal.fire('오류', '이벤트 등록 중 오류가 발생했습니다.', 'error')
  } finally {
    loading.value = false
  }
}


const toggleEvent = async (id) => {
  try {
    await axiosAdmin.patch(`/admin/events/${id}/toggle`)
    Swal.fire('완료', '상태가 변경되었습니다.', 'success')
    fetchEvents()
  } catch (err) {
    console.error('❌ 상태 변경 실패:', err)
  }
}

const deleteEvent = async (id) => {
  Swal.fire({
    title: '삭제하시겠습니까?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '삭제',
    cancelButtonText: '취소',
  }).then(async (res) => {
    if (res.isConfirmed) {
      try {
        await axiosAdmin.delete(`/admin/events/${id}`)
        Swal.fire('삭제 완료', '', 'success')
        fetchEvents()
      } catch (err) {
        console.error('❌ 이벤트 삭제 실패:', err)
        Swal.fire('오류', '삭제 중 오류가 발생했습니다.', 'error')
      }
    }
  })
}

onMounted(fetchEvents)
</script>

<style scoped>
.admin-events .table th,
.admin-events .table td {
  vertical-align: middle;
}
</style>
