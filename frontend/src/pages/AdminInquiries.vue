<template><AdminLayout>
    <div class="admin-page">
      <h2>1:1 문의 목록</h2>
      <select v-model="statusFilter" @change="fetchInquiries">
        <option value="">전체</option>
        <option value="pending">미답변</option>
        <option value="answered">답변완료</option>
      </select>
  
      <table class="inquiry-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>사용자</th>
            <th>제목</th>
            <th>상태</th>
            <th>작성일</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in inquiries" :key="item.id" @click="goToDetail(item.id)">
            <td>{{ item.id }}</td>
            <td>{{ item.username }}</td>
            <td>{{ item.title }}</td>
            <td>{{ item.status }}</td>
            <td>{{ formatDate(item.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </AdminLayout></template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import axios from '@/axiosAdmin'
  import { useRouter } from 'vue-router';
  import AdminLayout from '@/components/AdminLayout.vue'
  
  const inquiries = ref([]);
  const statusFilter = ref('');
  const router = useRouter();
   
  const fetchInquiries = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await axios.get(`/admin/inquiries?status=${statusFilter.value}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      inquiries.value = res.data;
    } catch (err) {
      console.error('문의 목록 로딩 실패:', err);
    }
  };
  
  const goToDetail = (id) => {
    router.push(`/admin/inquiries/${id}`);
  };
  
  const formatDate = (dateStr) => new Date(dateStr).toLocaleString();
  
  onMounted(fetchInquiries);
  </script>
  <style>
.admin-page {
  padding: 30px;
  border-radius: 8px;
  min-height: 100vh;
}

.admin-page h2 {
  font-size: 1.6rem;
  font-weight: bold;
  margin-bottom: 20px;
}

.admin-page select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  background-color: #fff;
  margin-bottom: 20px;
  font-size: 14px;
  outline: none;
}

.inquiry-table {
  width: 100%;
  border-collapse: collapse;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border-radius: 6px;
  overflow: hidden;
}

.inquiry-table th,
.inquiry-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}

.inquiry-table th {
  background-color: #d2e9fb;
  color: #1a1a1a;
}

.inquiry-table tbody tr:hover {
  background-color: #f0f8ff;
  cursor: pointer;
}

.inquiry-table td:nth-child(4) {
  text-transform: capitalize;
  font-weight: 500;
}

</style>