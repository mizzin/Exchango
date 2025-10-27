<template>
  <div>
    <!-- 상단 네비게이션 -->
    <header class="navbar navbar-expand-md navbar-dark bg-primary">
      <div class="container-xl">
        <div class="navbar-brand">관리자</div>

        <div class="navbar-nav flex-row gap-3">
          <router-link to="/admin/dashboard" class="nav-link text-white">홈</router-link>
          <router-link to="/admin/users" class="nav-link text-white">회원관리</router-link>

          <!-- 드롭다운: 쪽지 -->
          <div class="nav-item dropdown">
            <a href="#" class="nav-link dropdown-toggle text-white" data-bs-toggle="dropdown">쪽지</a>
            <div class="dropdown-menu">
              <router-link to="/admin/messages/sent" class="dropdown-item">보낸 쪽지 목록</router-link>
              <router-link to="/admin/messages/send" class="dropdown-item">쪽지 보내기</router-link>
              <router-link to="/admin/messages/templates" class="dropdown-item">쪽지 관리</router-link>
            </div>
          </div>

                <!-- 드롭다운: 거래 신청 -->
          <div class="nav-item dropdown">
            <a href="#" class="nav-link dropdown-toggle text-white" data-bs-toggle="dropdown">거래 신청</a>
            <div class="dropdown-menu">
                <!--<router-link to="/admin/trade/recharge" class="dropdown-item">외부 충전 처리</router-link>
              <router-link to="/admin/trade/withdraw" class="dropdown-item">외부 출금 처리</router-link>-->
              <router-link to="/admin/trade/wallet-charge" class="dropdown-item">지갑충전신청처리</router-link>
              <router-link to="/admin/trade/wallet-withdraw" class="dropdown-item">지갑출금신청처리</router-link>
              <router-link to="/admin/trade/wallet-transfer" class="dropdown-item">머니이동신청처리</router-link>
            <router-link to="/admin/history" class="dropdown-item">모든거래처리이력</router-link>

            </div>
          </div>

          <!-- 단독 메뉴: 전체 신청내역 -->
          <router-link to="/admin/requests" class="nav-link text-white">전체 신청내역</router-link>

          <!-- 드롭다운: 관리 -->
          <div class="nav-item dropdown">
            <a href="#" class="nav-link dropdown-toggle text-white" data-bs-toggle="dropdown">관리</a>
            <div class="dropdown-menu">
              <router-link to="/admin/deposit-addresses" class="dropdown-item">입금주소 관리</router-link>
              <router-link to="/admin/events" class="dropdown-item">이벤트 관리</router-link>
            </div>
          </div>

              <div class="nav-item dropdown">
            <a href="#" class="nav-link dropdown-toggle text-white" data-bs-toggle="dropdown">고객센타</a>
            <div class="dropdown-menu">
              <router-link to="/admin/notice" class="dropdown-item">공지사항</router-link>
              <router-link to="/admin/inquiry" class="dropdown-item">1:1문의</router-link>
            </div>
          </div>

          <!-- 로그아웃 -->
          <span class="nav-link text-white" @click="logout" style="cursor:pointer">로그아웃</span>
        </div>
      </div>
    </header>

    <!-- 본문 -->
    <main class="page-body mt-4">
      <div class="container-xl">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const logout = () => {
  localStorage.removeItem('admin_token')
  router.push('/admin/login')
}
</script>

<style scoped>
/* 드롭다운 작동을 위해 bootstrap의 js 또는 tabler.js 필요 */
.dropdown-menu {
  display: none;
  position: absolute;
  z-index: 999;
  top: 100%; /* ✅ 메뉴 바로 아래로 위치 */
  left: 0;
  background-color: white;
  min-width: 160px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  border-radius: 4px;
  padding: 0.5rem 0;
}
.dropdown:hover .dropdown-menu {
  display: block;
}
.dropdown-item {
  padding: 0.5rem 1rem;
  color: #333;
  text-decoration: none;
  display: block;
}

.dropdown-item:hover {
  background-color: #f0f0f0;
}

</style>
