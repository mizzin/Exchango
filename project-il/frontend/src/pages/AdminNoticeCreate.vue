<!-- AdminNoticeCreate.vue -->
<template>
  <AdminLayout>
    <div class="admin-notice-form">
      <h2>Create Notice</h2>

      <input v-model="title" type="text" class="notice-input" placeholder="Title" />

      <select v-model="language" class="notice-input">
        <option value="en">English</option>
        <option value="ko">Korean</option>
        <option value="ja">Japanese</option>
        <option value="zh">Chinese</option>
      </select>

      <label>Content</label>
      <VueEditor v-model="content" :editorToolbar="toolbar" :editorOptions="editorOptions" />

      <button class="submit-btn" @click="submitNotice">Submit</button>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/axiosAdmin'
import AdminLayout from '@/components/AdminLayout.vue'
import { VueEditor } from 'vue3-editor'

const title = ref('')
const language = ref('en')
const content = ref('')
const router = useRouter()

const toolbar = [
  ['bold', 'italic', 'underline', 'strike'],
  [{ header: 1 }, { header: 2 }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  [{ color: [] }, { background: [] }],
  ['link', 'image'],
  ['clean']
]

const editorOptions = {
  placeholder: 'Enter your content...',
}

onMounted(() => {
  const quill = document.querySelector('.ql-editor')?.__quill
  if (!quill) return

onMounted(() => {
  const quill = document.querySelector('.ql-editor')?.__quill
  if (!quill) return

  const toolbar = quill.getModule('toolbar')

  // 🔗 링크 핸들러 (기본 동작 대신 prompt 띄우기)
  toolbar.handlers['link'] = function () {
    const value = prompt('Enter the URL')
    if (value) {
      const range = quill.getSelection()
      if (range) {
        quill.format('link', value)
      }
    }
  }

  // 🖼️ 이미지 핸들러 (Base64 막고 서버 업로드 → URL 삽입)
  toolbar.handlers['image'] = function () {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.click()

    input.onchange = async () => {
      const file = input.files[0]
      if (!file) return

      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await axios.post('/api/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        const url = `${location.origin}${res.data.url}`

        const range = quill.getSelection(true)
        quill.insertEmbed(range.index, 'image', url, 'user')
      } catch (err) {
        alert('이미지 업로드 실패')
      }
    }
  }
})


  // 🖼️ 이미지 핸들러
  quill.getModule('toolbar').addHandler('image', () => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.click()

    input.onchange = async () => {
      const file = input.files[0]
      if (!file) return

      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await axios.post('/api/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        const url = `${location.origin}${res.data.url}`

        const range = quill.getSelection(true)

        // ✅ URL 삽입만
        quill.insertEmbed(range.index, 'image', url, 'user')

        // ✅ Base64 기본 동작 막기
        return false
      } catch (err) {
        alert('이미지 업로드 실패')
      }
    }
  })
}) // ✅ onMounted 닫기

// 📌 공지 등록
const submitNotice = async () => {
  if (!title.value.trim()) return alert('제목을 입력해주세요.')
  if (!content.value.trim()) return alert('내용을 입력해주세요.')

  const payload = {
    title: title.value,
    content: content.value,
    language: language.value
  }

  try {
    const token = localStorage.getItem('admin_token')
    await axios.post('/admin/notices', payload, {
      headers: { Authorization: `Bearer ${token}` }
    })

    alert('공지사항이 등록되었습니다.')
    router.push('/admin/notice')
  } catch (err) {
    console.error('❌ 공지 등록 실패:', err)
    alert('등록 중 오류가 발생했습니다.')
  }
}
</script>


<style scoped>
.notice-input {
  width: 100%;
  margin: 12px 0;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
.submit-btn {
  margin-top: 16px;
  padding: 10px 16px;
  background: #4a6ef6;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
</style>
