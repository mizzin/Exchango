<template>
  <AdminLayout>
    <div class="admin-notice-form">
      <h2>Edit Notice</h2>

      <input v-model="title" type="text" class="notice-input" />
      <select v-model="language" class="notice-input">
        <option value="en">English</option>
        <option value="ko">Korean</option>
        <option value="ja">Japanese</option>
        <option value="zh">Chinese</option>
      </select>

      <label>Content</label>
      <VueEditor v-model="content" :editorToolbar="toolbar" :editorOptions="editorOptions" />

      <button class="submit-btn" @click="updateNotice">Save</button>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/axiosAdmin'
import AdminLayout from '@/components/AdminLayout.vue'
import { VueEditor } from 'vue3-editor'

const route = useRoute()
const router = useRouter()
const id = route.params.id

const title = ref('')
const language = ref('en')
const content = ref('')

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
  placeholder: 'Edit your content here...'
}

// ✅ 기존 공지 불러오기
onMounted(async () => {
  const token = localStorage.getItem('admin_token')

  try {
    const res = await axios.get(`/admin/notices/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const notice = res.data.notice
    title.value = notice.title
    language.value = notice.language
    content.value = notice.content || ''
  } catch (err) {
    console.error('❌ 공지 로딩 실패:', err)
  }

  // 이미지 업로드 핸들러 등록
  setTimeout(() => {
    const quill = document.querySelector('.ql-editor')?.__quill
    if (!quill) return

    quill.getModule('toolbar').addHandler('image', () => {
      const input = document.createElement('input')
      input.setAttribute('type', 'file')
      input.setAttribute('accept', 'image/*')
      input.click()

      input.onchange = async () => {
        const file = input.files[0]
        const formData = new FormData()
        formData.append('file', file)

        try {
          const res = await axios.post('/api/upload/image', formData)
          const url = `${location.origin}${res.data.url}`
          const range = quill.getSelection()
          quill.insertEmbed(range.index, 'image', url)
        } catch (err) {
          alert('이미지 업로드 실패')
        }
      }
    })
  }, 500)
})

const updateNotice = async () => {
  if (!title.value.trim()) return alert('제목을 입력해주세요.')
  if (!content.value.trim()) return alert('내용을 입력해주세요.')

  const payload = {
    title: title.value,
    content: content.value,
    language: language.value
  }

  // 150KB 제한 체크
  const size = new Blob([JSON.stringify(payload)]).size
  const maxSize = 150 * 1024 // 150KB

  if (size > maxSize) {
    alert(`공지사항 크기가 너무 큽니다. 최대 ${maxSize / 1024}KB 이하로 작성해주세요. 현재 크기: ${(size / 1024).toFixed(2)}KB`)
    return
  }

  try {
    const token = localStorage.getItem('admin_token')
    await axios.put(
      `/admin/notices/${id}`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    alert('수정 완료!')
    router.push('/admin/notice')
  } catch (err) {
    console.error('❌ 수정 실패:', err)
    alert('공지 수정 실패')
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
.editor-wrapper {
  margin: 16px 0;
}
</style>
