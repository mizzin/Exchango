<template>
  <AdminLayout>
    <div class="deposit-address-page">
      <h2>입금주소 관리</h2>
<p>해당 주소 변경은 사용자 입금 신청시 페이지 부분에서만 변경됩니다. 쪽지는 쪽지관리에서 설정하십시오.</p>
      <!-- 등록 폼 -->
      <form @submit.prevent="submitAddress" class="form-section">
        <div class="form-group">
          <label>통화</label>
          <select v-model="form.currency">
            <option disabled value="">통화 선택</option>
            <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>입금주소</label>
          <input v-model="form.address" placeholder="지갑주소 입력" />
        </div>

        <button type="submit" class="btn btn-primary">저장</button>
      </form>
<p>[수정]클릭시 상단에서 수정 후 [저장] 클릭하시면 수정된 주소로 저장됩니다.</p>
      <!-- 목록 -->
      <table class="address-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>통화</th>
            <th>주소</th>
            <th>수정</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="addr in addresses" :key="addr.id">
            <td>{{ addr.id }}</td>
            <td>{{ addr.currency }}</td>
            <td>{{ addr.address }}</td>
            <td>
              <button @click="editAddress(addr)" class="btn btn-dark">수정</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axiosAdmin from '@/axiosAdmin'
import AdminLayout from '@/components/AdminLayout.vue'

const addresses = ref([])
const currencies = ['KRW', 'USD', 'PHP', 'USDT']
const form = ref({ id: null, currency: '', address: '' })

// 목록 불러오기
const fetchAddresses = async () => {
  try {
    const res = await axiosAdmin.get('/deposit-addresses')
    addresses.value = res.data
  } catch (err) {
    console.error('❌ 주소 목록 불러오기 실패:', err)
  }
}

// 등록 또는 수정
const submitAddress = async () => {
  if (!form.value.currency || !form.value.address)
    return alert('통화와 주소를 입력해주세요.')

  try {
    if (form.value.id) {
      await axiosAdmin.patch(`/deposit-addresses/${form.value.id}`, {
        currency: form.value.currency,
        address: form.value.address
      })
      alert('주소가 수정되었습니다.')
    } else {
      await axiosAdmin.post('/deposit-addresses', {
        currency: form.value.currency,
        address: form.value.address
      })
      alert('주소가 등록되었습니다.')
    }
    form.value = { id: null, currency: '', address: '' }
    fetchAddresses()
  } catch (err) {
    console.error('❌ 저장 실패:', err)
    alert('저장 중 오류가 발생했습니다.')
  }
}

const editAddress = (addr) => {
  form.value = { ...addr }
}

onMounted(fetchAddresses)
</script>

<style scoped>
.deposit-address-page {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
}

.form-section {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.address-table {
  width: 100%;
  border-collapse: collapse;
}

.address-table th,
.address-table td {
  border: 1px solid #ddd;
  padding: 8px;
}

.address-table th {
  background: #f5f5f5;
}
</style>
