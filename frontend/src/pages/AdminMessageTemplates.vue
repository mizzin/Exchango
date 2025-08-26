<template>
  <AdminLayout>
    <h2>💬 충전 쪽지 템플릿 관리</h2>
    <p class="desc">사용자 충전 신청 시 자동으로 전송되는 쪽지를 설정할 수 있습니다.</p>

    <div v-for="template in templates" :key="template.template_key" class="template-box">
      <label><strong>{{ template.label }}</strong></label>
      <textarea v-model="template.content" class="template-textarea" />
    </div>

    <button class="submit-btn btn-md" @click="saveTemplates">💾 저장</button>
  </AdminLayout>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/axiosAdmin'
import AdminLayout from '@/components/AdminLayout.vue'
import '@/assets/style.css' 

const token = localStorage.getItem('admin_token')
const templates = ref([])

onMounted(async () => {
  try {
    const res = await axios.get('/admin/message-templates', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    templates.value = res.data.templates
  } catch (err) {
    console.error('❌ 템플릿 불러오기 실패:', err)
  }
})

const saveTemplates = async () => {
  try {
    await axios.post('/admin/message-templates', {
      templates: templates.value
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    alert('저장되었습니다!')
  } catch (err) {
    console.error('❌ 템플릿 저장 실패:', err)
    alert('저장 실패')
  }
}
</script>
