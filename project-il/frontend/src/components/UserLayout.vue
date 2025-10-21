<template>
  <div :key="isMember">
    <div class="user-layout">
      <!-- 헤더 -->
      <header class="user-header">
        <div class="container header-flex">
          <router-link to="/" class="logo-link">
              <img src="@/assets/img/logo.png" alt="TranAsia" class="logo-img" style="height:38px;width:auto;"/>
            </router-link>
            <!-- ✅ 모바일 전용 언어 셀렉트 (로고 옆 고정) -->
              <select
                v-if="isMobile"
                v-model="$i18n.locale"
                @change="onChangeLang"
                class="lang-select-mobile"
              >
                <option value="en">EN</option>
                <option value="ko">한국어</option>
                <option value="zh">中文</option>
                <option value="ja">日本語</option>
              </select>

            <!-- 💰 보유금액 박스: 햄버거/로고와 같은 라인, PC만 노출 -->
          <div v-if="isMember && userInfo && userInfo.balance != null && !isMobile" class="user-balance">
            💰 <strong>{{ Math.floor(userInfo.balance).toLocaleString() }} USD</strong>
          </div>

          <!-- 햄버거 버튼 (우측 상단) -->
          <button class="hamburger" @click="toggleMenu">☰</button>
          <span
            v-if="isMobile && unreadCount > 0"
            class="msg-badge-floating"
          >
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>       
        </div>
        <!-- 모바일에서는 메뉴 바로 아래 보유금액 -->
        <div v-if="isMember && userInfo && userInfo.balance != null && isMobile" class="user-balance-mobile">
          💰 <strong>{{ Math.floor(userInfo.balance).toLocaleString() }} USD</strong>
        </div>
        <!-- 네비게이션 메뉴 (PC에서는 항상 보이도록 위치 수정) -->
        <div class="nav-wrapper" :class="{ open: isOpen || !isMobile }">
          <nav :class="['nav', { open: isOpen || !isMobile }]">
            <router-link to="/" class="nav-item">{{ $t('nav.home') }}</router-link>

            <router-link to="/guide" class="nav-item" v-if="!isMember">{{ $t('nav.guide') }}</router-link>

            <!-- 거래 드롭다운 -->
            <div class="dropdown nav-item" v-if="isMember">
              <span class="nav-item" @click="toggleDropdown('trade')">
                {{ $t('nav.trade') }} ▾
              </span>
              <div v-if="dropdown === 'trade' || !isMobile" class="dropdown-menu">
                
                <!-- 내 지갑 -->
                <div class="dropdown-item"><strong>{{ $t('wallet.title') }}</strong></div>
                <router-link to="/wallet/charge" class="dropdown-item">{{ $t('nav.recharge') }}</router-link>
                <router-link to="/wallet/withdraw" class="dropdown-item">{{ $t('nav.withdraw') }}</router-link>
                <router-link to="/wallet/history" class="dropdown-item">{{ $t('nav.history') }}</router-link>

                <!--외부 플랫폼
                <div class="dropdown-item" style="margin-top: 0.5rem;"><strong>{{ $t('platform.title') }}</strong></div>
                <router-link to="/trade/recharge" class="dropdown-item">{{ $t('nav.recharge') }}</router-link>
                <router-link to="/trade/withdraw" class="dropdown-item">{{ $t('nav.withdraw') }}</router-link>
                <router-link to="/trade/history" class="dropdown-item">{{ $t('nav.history') }}</router-link> -->

                <!-- 머니 이동 -->
                <div class="dropdown-item" style="margin-top: 0.5rem;"><strong>{{ $t('transfer.title') }}</strong></div>
                  <router-link to="/wallet/transfer" class="dropdown-item">{{ $t('transfer.request') }}</router-link>
                  <router-link to="/wallet/transfer/history" class="dropdown-item">{{ $t('transfer.history') }}</router-link>

              </div>
            </div>




            <!-- Support 드롭다운 -->
            <div class="dropdown nav-item">
              <span class="nav-item" @click="toggleDropdown('support')">
                {{ $t('nav.support') }} ▾
              </span>
              <div v-if="dropdown === 'support' || !isMobile" class="dropdown-menu">
                <router-link to="/support/notice" class="dropdown-item">{{ $t('nav.notice') }}</router-link>
                <router-link to="/support/inquiry" class="dropdown-item" v-if="isMember">{{ $t('nav.inquiry') }}</router-link>
              </div>
            </div>

            <router-link v-if="isMember" to="/mypage" class="nav-item">{{ $t('nav.mypage') }}</router-link>
            <router-link to="/messages" class="nav-item message-link">
              {{ $t('nav.messages') }}
  <span v-if="unreadCount > 0" class="msg-badge-inline">
    {{ unreadCount > 9 ? '9+' : unreadCount }}
  </span>            </router-link>
            <router-link to="/how-to-play" class="nav-item">how-to-play</router-link>

            <router-link to="/login" class="nav-item" v-if="isMember" @click="logout">{{ $t('nav.logout') }}</router-link>
            <router-link to="/login" class="nav-item" v-else>{{ $t('nav.login') }}</router-link>

            <select v-model="$i18n.locale" @change="onChangeLang" class="lang-select">
              <option value="en">EN</option>
              <option value="ko">한국어</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
            </select>
          </nav>
        </div>
      </header>

      <!-- 메인 콘텐츠 -->
      <main class="main">
        <div class="container">
          <slot />
        </div>
      </main>

      <!-- 푸터 -->
      <footer class="footer">
        <div class="container">
          <div class="rate-box">
            <label>💱 {{ $t('footer.exchangeLabel') }}</label>
            <ul v-if="Object.keys(rates).length">
              <li>USD: ₩1.00</li>
              <li v-if="rates.KRW">KRW: ₩{{ formatRate(rates.KRW) }} <span class="note"></span></li>
              <li v-if="rates.PHP">PHP: ₱{{ formatRate(rates.PHP) }}</li>
              <li v-if="rates.USDT">USDT: ₮{{ formatRate(rates.USDT) }}</li>
               <li v-else class="error">USDT: {{ $t('footer.usdtUnavailable') }}</li>
            </ul>
            <p v-else>Loading information now...</p>

            <small v-if="date">{{ $t('footer.dateLabel') }}: {{ formatDate(date) }}</small>
          </div>
          <p>{{ $t('footer.inquiry') }}</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/axiosUser'
import { useI18n } from 'vue-i18n'
const userInfo = ref(null)
const isOpen = ref(false)
const dropdown = ref(null)
const isMobile = ref(false)

const toggleDropdown = (menu) => {
  dropdown.value = dropdown.value === menu ? null : menu
}

const isMember = ref(false)
const rates = ref({})
const date = ref('')
const { locale } = useI18n()


const onChangeLang = () => {
  localStorage.setItem('lang', locale.value)
}

const checkLoginStatus = () => {
  const token = localStorage.getItem('user_token')
  const role = localStorage.getItem('role')
  isMember.value = !!token && role  === 'user'
}
const fetchUserInfo = async () => {
  try {
    const token = localStorage.getItem('user_token')
    if (!token) return
    const res = await axios.get('/users/info', {
      headers: { Authorization: `Bearer ${token}` }
    })
    userInfo.value = res.data
  } catch (e) {
    userInfo.value = null
  }
}
const unreadCount = ref(0)

const fetchUnreadMessages = async () => {
  const token = localStorage.getItem('user_token')
  if (!token) return
  try {
    const res = await axios.get('/messages/unread-count', {
      headers: { Authorization: `Bearer ${token}` }
      
    })
           

    unreadCount.value = res.data.count || 0

  } catch (err) {
    console.error('쪽지 갯수 불러오기 실패:', err)
  }
}

onMounted(() => {
  fetchUnreadMessages()
  setInterval(fetchUnreadMessages, 30000) // 30초마다 새로고침
})

const getRates = async () => {
  try {
    const res = await axios.get(`/exchange-rate`);

    if (typeof res.data === 'string' && res.data.includes('<!doctype html')) {
      console.error('❌ API 대신 HTML이 응답됨: 잘못된 API 요청 경로 또는 프록시 오류');
      return;
    }

    rates.value = res.data.rates;
    date.value = res.data.date;
  } catch (e) {
    console.error('환율 가져오기 실패', e);
  }
};

const formatDate = (isoString) => {
  const d = new Date(isoString)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

onMounted(() => {
  checkLoginStatus()
  getRates()
  fetchUserInfo()
  const checkWidth = () => {
    isMobile.value = window.innerWidth <= 768
  }
  window.addEventListener('resize', checkWidth)
  checkWidth()
})

const logout = () => {
  localStorage.removeItem('user_token')
  localStorage.removeItem('admin_token')
    localStorage.removeItem('exp') 

  alert('You have been logged out.')
  window.location.href = '/'
}

const formatRate = (val) => {
  if (!val) return '-'
  return Number(val).toFixed(2)
}

const toggleMenu = () => {
  isOpen.value = !isOpen.value
}
</script>

 
<style scoped>
.message-link {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.msg-badge-inline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #ff3b30;
  color: white;
  font-size: 11px;
  font-weight: 700;
  border-radius: 10px;
  min-width: 18px;
  height: 16px;
  line-height: 1;
  padding: 0 4px;
  margin-left: 5px; /* 글자랑 간격 */
  box-shadow: 0 0 2px rgba(0,0,0,0.2);
  vertical-align: middle;
}
.msg-badge-floating {
  position: absolute;
  top: 5px; /* 살짝 아래로 */
  right: 10px;
  min-width: 18px;
  height: 18px;
  background-color: #ff3b30;
  color: white;
  font-size: 11px;
  font-weight: 700;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
  box-shadow: 0 0 2px rgba(0,0,0,0.2);
  z-index: 2000;
}
.msg-badge-floating:has(:not(:empty)) {
  border-radius: 10px;
  min-width: 20px;
  height: 18px;
}

@keyframes blink {
  from { opacity: 0.7; }
  to { opacity: 1; }
}

.user-header .logo-img {
  height: 38px !important;
  width: auto !important;
}

.user-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.user-header {
    box-shadow: 0 2px 6px #0000000f;
        padding: 1rem;
  position: relative; /* ← 햄버거 기준점으로 작용 */
  min-height: 50px; /* ← 명시적으로 최소 높이 지정 */
}


.logo-link {
  text-decoration: none;
}

.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
  padding: 0 1.5rem;
  max-width: 1024px;
  margin: 0 auto;
}

.nav-item {
  color: #333;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  position: relative;
  cursor: pointer;
}
.nav-item:hover {
  color: #5a75f0;
}

.dropdown {
  position: relative;
}
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #ddd;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  display: none;
  flex-direction: column;
  z-index: 10;
  min-width: 150px;
}
.dropdown:hover .dropdown-menu {
  display: flex;
}
.dropdown-item {
  padding: 10px;
  color: #333;
  text-decoration: none;
  transition: background 0.2s;
}
.dropdown-item:hover {
  background-color: #f0f4ff;
}

.main {
  flex: 1;
  background: #f9f9f9;
  padding: 2rem 0;
}

.footer {
  background-color: #f4f4f4;
  text-align: center;
  font-size: 0.8rem;
  color: #777;
  padding: 1rem 0;
  border-top: 1px solid #ddd;
}

.container {
  max-width: 1024px;
  margin: 0 auto;
  padding: 0 1rem;
}

.lang-select {
  border: 1px solid #ccc;
  padding: 4px 8px;
  font-size: 0.9rem;
  background-color: white;
  cursor: pointer;
  width: auto;
  min-width: 80px;
  max-width: 120px;
  margin-left: auto;
  display: inline-block;
}

.hamburger {
  display: none; /* PC에서는 숨김 */
  font-size: 2rem;   
  top: 0.2rem;
  background: none !important; /* Tabler 스타일 무효화 */
  border: none !important;
  color: #6d7c9c !important; /* 원하는 파란색 아이콘 */
  position: absolute;
  right: 1rem;
  top: 0.1rem;
  z-index: 1001;
  padding: 0;
  line-height: 1;
}

.rate-box {
  text-align: left;
  margin-bottom: 1rem;
}
.rate-box ul {
  list-style: none;
  padding-left: 0;
}
.rate-box li {
  margin: 2px 0;
}
.note {
  font-size: 0.75rem;
  color: #aaa;
}
.header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}
.user-balance {
  margin-left: auto;
  font-weight: 600;
  color: #2563eb;
  font-size: 1.08rem;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
}
.user-balance-mobile {
  padding: 8px 1.1rem 0.5rem 1.1rem;
  font-size: 1.03rem;
  color: #2563eb;
  font-weight: 600;
}
/* ✅ 모바일 전용 언어 셀렉트 */
.lang-select-mobile {
  border: 1px solid #d3d3d3;
  background: #fff;
  border-radius: 20px;
  padding: 4px 8px;
  font-size: 0.8rem;
  color: #333;
  position: absolute;
  right: 3.5rem;  
  z-index: 1000;
    -o-appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}
select::-ms-expand { 
	display: none;
}
.select {
  -o-appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

@media (max-width: 768px) {
    .msg-badge {
    right: 303px;
  }
    .msg-badge-hamburger {
   
      display: none;
  }
  .user-header {
    box-shadow: none;
    padding-top: 0.9rem !important;
    padding-right: 0 !important;
    padding-bottom: 0.5rem !important;
    padding-left: 0 !important;
    position: relative;
    min-height: 48px;
  }
   .logo-img {
    height: 28px !important; /* 로고 크기 축소 */
  }
   .main {
    padding: 0; /* 모바일에선 여백 줄이기 */
  }
  .user-balance,
  .user-balance-mobile,
  .lang-select {
    display: none !important;
  }

}
@media (min-width: 769px) {
  .user-balance-mobile {
    display: none;
  }
    .msg-badge-floating {
    display: none;
  }
}

@media screen and (max-width: 768px) {
  .header {
    padding: 1rem 1rem; /* 충분한 높이를 주자 */
    min-height: 56px;     /* 높이 부족시 명시적으로 설정 */
  }
  .hamburger {
    display: block; 
    top: 0.1rem;
    right: 1rem;
  }
  .nav {
    display: none;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
  }
  .nav.open {
    display: flex;
  }
  .nav-item,
  .lang-select {
    width: 100%;
    margin-bottom: 0.8rem;
    text-align: left;
  }
  .dropdown-menu {
    position: static;
    background: none;
    box-shadow: none;
    border: none;
    padding-left: 1.5rem;
  }
  .header-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
  }
}
</style>
