<template>
  <AdminLayout>
    <div class="admin-page">
      <h2>문의 상세</h2>
      <p><strong>제목:</strong> {{ inquiry.title }}</p>
      <p><strong>작성자:</strong> {{ inquiry.username }}</p>
      <p><strong>내용:</strong><br /><span v-html="inquiry.content"></span></p>
  
      <div v-if="inquiry.status === 'pending'">
        <textarea v-model="answer" placeholder="답변 입력..." rows="5"></textarea>
        <button @click="submitAnswer">답변 등록</button>
      </div>
  
      <div v-else>
        <h3>답변</h3>
        <p>{{ inquiry.answer }}</p>
      </div>
      <button class="back-btn" @click="goToList">목록으로</button>
    </div>
    </AdminLayout>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import axios from '@/axiosAdmin'
import AdminLayout from '@/components/AdminLayout.vue'
  
  const route = useRoute();
  const router = useRouter();
  const inquiry = ref({});
  const answer = ref('');
  
  const fetchDetail = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await axios.get(`/admin/inquiries/${route.params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      inquiry.value = res.data;
    } catch (err) {
      console.error('문의 상세 로딩 실패:', err);
    }
  };
  
  const submitAnswer = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.patch(`/admin/inquiries/${route.params.id}/answer`, {
        admin_id: 1, // 임시: 서버에서 토큰으로 파싱하는 게 이상적
        answer: answer.value
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('답변이 등록되었습니다.');
      router.push('/admin/inquiry');
    } catch (err) {
      console.error('답변 등록 실패:', err);
    }
  };
  const goToList = () => {
  router.push('/admin/inquiry');
};
  onMounted(fetchDetail);
  </script>
  <style>
.admin-page {
  padding: 30px;
  border-radius: 8px;
  font-family: 'Segoe UI', sans-serif;
  color: #1a1a1a;
}

.admin-page h2 {
  font-size: 1.6rem;
  font-weight: bold;
  margin-bottom: 20px;
  color: #003366;
}

.admin-page p {
  margin: 12px 0;
  font-size: 15px;
  line-height: 1.5;
}

.admin-page strong {
  display: inline-block;
  min-width: 80px;
  color: #333;
}

textarea {
  width: 100%;
  padding: 12px;
  font-size: 14px;
  border-radius: 6px;
  border: 1px solid #ccc;
  resize: vertical;
  margin-top: 10px;
  margin-bottom: 16px;
  background-color: #fff;
}

button {
  background-color: #007BFF;
  color: white;
  font-size: 14px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

button:hover {
  background-color: #0056b3;
}

.admin-page h3 {
  margin-top: 30px;
  font-size: 1.2rem;
  color: #004080;
}
.back-btn{
  margin-top: 30px;
  background-color: #353535;
}
</style>