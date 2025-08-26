<template>
  <div>
    <header class="admin-header">
      <nav class="admin-nav">
        <div class=“nav-left”>
          <div class="dropdown">
            <router-link to="/admin/dashboard" class="nav-item">홈</router-link>
          </div>
          <div class="dropdown">
            <router-link to="/admin/users" class="nav-item">회원관리</router-link>
          </div>

          <div class="dropdown">
            <span class="nav-item">쪽지 ▾</span>
            <div class="dropdown-menu">
              <router-link to="/admin/messages/sent" class="dropdown-item">보낸 쪽지 목록</router-link>
              <router-link to="/admin/messages/send" class="dropdown-item">쪽지 보내기</router-link>
              <router-link to="/admin/messages/templates" class="dropdown-item">쪽지 관리</router-link>

            </div>
          </div>
          <div class="dropdown">
            <span class="nav-item">신청내역 ▾</span>
            <div class="dropdown-menu">
              <router-link to="/admin/trade/recharge" class="dropdown-item">충전관리</router-link>
              <router-link to="/admin/trade/withdraw" class="dropdown-item">출금관리</router-link>
            </div>
          </div>
        </div>
        <div class="dropdown">
            <router-link to="/admin/notice" class="nav-item">공지사항</router-link>
        </div>
        <div class="dropdown">
            <router-link to="/admin/inquiry" class="nav-item">1:1문의</router-link>
        </div>
        <div class="nav-right">
          <span class="nav-item logout" @click="logout">로그아웃</span>
        </div>
       
      </nav>
    </header> 

    <main class="admin-main">
      <slot />
    </main>
  </div>
</template>
<script setup>
import axios from '@/axiosAdmin'
import { useRouter } from 'vue-router'
const router = useRouter()

const logout = () => {
  localStorage.removeItem('admin_token')
  router.push('/admin/login') // 로그인 페이지로 이동
}
</script>
<style scoped>
.admin-header {
  background-color: #333;
  color: white;
  padding: 1rem;
}

.admin-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.nav-item {
  color: white;
  text-decoration: none;
}

.dropdown {
  position: relative;
  display: inline-block;
  min-width: 50px;
}
.dropdown .nav-item {
  display: inline-block;
  padding: 0.5rem 1rem;
  white-space: nowrap;
}
.dropdown-menu {
  position: absolute;
  background-color: #444;
  min-width: 100%;
  display: none;
  flex-direction: column;
  top: 100%;
  left: 0;
  z-index: 10;
}

.dropdown:hover .dropdown-menu {
  display: flex;
}

.dropdown-item {
  color: white;
  padding: 8px 12px;
  text-decoration: none;
  white-space: nowrap;
}

.admin-main {
  padding: 1rem;
}
</style>
