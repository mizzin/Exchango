<script setup>
import UserLayout from '@/components/UserLayout.vue'
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/axiosUser'
import '@/assets/style.css'
import home001 from '@/assets/img/home001.jpg';
import home002 from '@/assets/img/home002.jpg';
import home003 from '@/assets/img/home003.jpg';
import home004 from '@/assets/img/home004.png';


const externalSites = [
  {
    name: 'ggclub',
    url: 'https://clubgg.app.link/PUDc0bITiUb',
    image: home003,
  },
  {
    name: 'xpoker',
    url: 'https://x-pokerkorea.com/',
    image: home002,
  },
  {
    name: 'pokernex',
    url: 'https://pokernex.net/',
    image: home004 ,

  },
  {
    name: 'pokerbros',
    url: 'https://pokerbroskorea.net/',
    image: home001,

  }
];

const isLoggedIn = computed(() => !!localStorage.getItem('user_token'))
const router = useRouter()

const logout = () => {
  localStorage.removeItem('user_token')
  alert('You have been logged out.')
  router.push('/home')
}

const rates = ref({})
const date = ref('')
const notices = ref([])

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


const getNotices = async () => {
  try {
    const lang = localStorage.getItem('lang') || 'en'
    const res = await axios.get(`/users/notices?limit=3&lang=${lang}`)
    notices.value = res.data.notices
  } catch (err) {
    console.error('공지사항 실패:', err)
  }
}

onMounted(() => {
  getRates()
  getNotices()
})

const formatRate = val => Number(val).toFixed(2)
const formatDate = dateStr => new Date(dateStr).toLocaleDateString()

const showOverlay = ref(true)
// URL에 preview=true 있으면 닫기 버튼 보이고 오버레이 닫기 가능
const canClose = new URLSearchParams(window.location.search).has('preview')

onMounted(() => {
  // 만약 이전에 닫았었다면 (세션 스토리지에 기록), 아예 보이지 않게
  if (sessionStorage.getItem('overlayClosed') === '1') {
    showOverlay.value = false
  }
})

function closeOverlay() {
  showOverlay.value = false
  sessionStorage.setItem('overlayClosed', '1')
}
</script>

<template>
  <UserLayout>
<!-- home.vue -->
  <!-- 오픈 전 안내 오버레이 -->
<!-- 퍼블리싱 오버레이 -->
<div v-if="showOverlay" class="prelaunch-overlay">
  <div class="bg-aurora"></div>
  <div class="particle-bg">
    <div class="particle" v-for="n in 30" :key="n" :style="{ '--i': Math.random() }"></div>
  </div>
  <div class="prelaunch-modal">
    <div class="pulse-title">T R A N A S I A</div>
    <h2>🎉 Official Launch: August 20 🎉</h2>
    <p class="tagline"></p>
    <p>We're coming soon — and we're coming strong. 💫</p>
  </div>
      <button
      v-if="canClose"
      class="close-btn"
      @click="closeOverlay"
    >✕</button>

</div>


    <div class="home">

      <!-- 🔹 외부 링크 카드 영역 -->
      <section class="section-grid external-links">
        <div
          v-for="site in externalSites"
          :key="site.name"
          class="card external-card"
        >
          <a :href="site.url" target="_blank" rel="noopener" class="card-link">
            <img :src="site.image || placeholderImage" alt="site.name" class="card-img" />
            <div class="card-body">
              <h3 class="card-title">{{ $t(`home.external.${site.name}`) }}</h3>
            </div>
          </a>
        </div>
      </section>

      <!-- 기존 공지사항 / 환율 -->
      <section class="section-grid">
      <div class="card notice-card">
        <h2>📢 {{ $t('home.notice') }}</h2>
        <ul class="notice-list">
        <li v-for="n in notices" :key="n.id">
          <router-link :to="`/support/notice/${n.id}`" class="notice-row">
            <span class="title">{{ n.title || 'no title' }}</span>
            <span class="date">{{ formatDate(n.created_at) }}</span>
          </router-link>
        </li>
      </ul>
      </div>

      <div class="card rate-card">
        <h2>📢 {{ $t('home.exchangeRate') }}</h2>
        <div class="rate-list-block">
          <div v-if="rates.KRW">🇰🇷 1 USD ≈ ₩{{ formatRate(rates.KRW) }} <span class="note"></span></div>
          <div v-if="rates.PHP">🇵🇭 1 USD ≈ ₱{{ formatRate(rates.PHP) }}</div>
          <div v-if="rates.USDT">₮ USDT = ₩{{ formatRate(rates.USDT) }}<span class="note"></span></div>
        </div>
        <div class="rate-date">{{ $t('home.date') }}: {{ formatDate(date) }}</div>
      </div>

  </section>
  </div>
  </UserLayout>
</template>

<style scoped>
/* 기본 배경 단순화 */
.home {
  background-color: #f9fafc; /* 더 밝고 부드러운 느낌 */
  min-height: 100vh;
}

/* 카드 그리드 정리 */
.section-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

/* 카드 */
.card {
  background: #fff;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-in-out;
}
.external-card {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
 transition: transform 0.2s ease;
  padding: 0;
}
.external-card:hover {
  transform: translateY(-6px);
}
.rate-sub {
  font-size: 0.85rem;
  color: #777;
  font-weight: normal;
}
.card-link {
  text-decoration: none;
  color: inherit;
  display: block;
  height: 100%;
}
.card-img {
  width: 100%;
  height: 160px; /* ✅ 고정 높이로 통일 */
  object-fit: cover;
  display: block;
  position: relative;
    transition: transform 0.3s ease;
}
.external-card:hover .card-img {
  transform: scale(1.05);
}
.card-body {
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.4);
  width: 100%;
  box-sizing: border-box;
}
.card-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
}
.rate-list-block {
  padding: 1rem;
  line-height: 1.8;
  font-size: 1rem;
  background: #f8fafc;
  border-radius: 0.75rem;
  margin-top: 1rem;
}

.note {
  font-size: 0.8rem;
  color: #aaa;
  margin-left: 0.3rem;
}

/* 카드 헤더 */
.card h2 {
  font-size: 1.2rem;
  font-weight: bold;
  color: #3c5ef0;
  margin-bottom: 1rem;
}

/* 공지사항 리스트 */
.notice-item {
  list-style-type: none;
  border-bottom: 1px solid #ddd;
}

.notice-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #333;
  text-decoration: none;
  transition: background 0.2s;
}

.notice-link:hover {
  background: #f2f6ff;
}

.notice-title {
  font-weight: 500;
}

.notice-date {
  font-size: 0.9rem;
  color: #888;
  margin-left: 1rem;
  white-space: nowrap;
}

.notice-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.notice-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
  text-decoration: none;
  color: #333;
  transition: background 0.2s;
}

.notice-row:hover {
  background-color: #f2f6ff;
}

.notice-row .title {
  font-weight: 500;
  font-size: 1rem;
}

.notice-row .date {
  font-size: 0.85rem;
  color: #999;
  white-space: nowrap;
}


/* 환율 */
.rate-list {
  padding: 0;
  list-style: none;
  margin: 0;
}

.rate-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px dashed #e0e0e0;
}

.rate-date {
  font-size: 0.85rem;
  text-align: right;
  color: #888;
  margin-top: 1rem;
}

@media screen and (max-width: 768px) {
  .home {
  padding: 0.2rem;
}
  .card {
    padding: 0 !important;
  }

  .card-img {
    height: 120px;
  }

  .card-title {
    font-size: 0.85rem;
  }

  .card-body {
    padding: 0.3rem 0.7rem;
  }
}
/* 오픈 전 안내 오버레이 */
/* 전체 오버레이 */
.prelaunch-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(10, 10, 20, 0.85);
  backdrop-filter: blur(2px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}


@keyframes shineText {
  0% { background-position: 0% }
  100% { background-position: 200% }
}

/* 꽃가루 입자 애니메이션 */
.particle-bg {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}

.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: radial-gradient(circle, #fff, rgba(255, 255, 255, 0));
  border-radius: 50%;
  opacity: 0.6;
  animation: floatParticle 10s linear infinite;
  top: 100%;
  left: calc(100% * var(--i, 0.5));
}

.particle:nth-child(odd) {
  background: radial-gradient(circle, #f5c542, rgba(255, 255, 255, 0));
}
.particle:nth-child(even) {
  background: radial-gradient(circle, #ff84d4, rgba(255, 255, 255, 0));
}

.particle:nth-child(n) {
  --i: calc(var(--random, 0.1) * 1.0);
  animation-delay: calc(var(--i) * -10s);
}

/* 애니메이션 */
@keyframes floatParticle {
  0% {
    transform: translateY(0) scale(0.5);
    opacity: 0.8;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    transform: translateY(-120vh) scale(1.2);
    opacity: 0;
  }
}
@keyframes riseZoom {
  0% {
    transform: scale(0.9) translateY(30px);
    opacity: 0;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.prelaunch-modal {
  animation: riseZoom 0.8s ease-out;
}

/* 중앙 모달 */
.prelaunch-modal {
  position: relative;
  background: white;
  padding: 2rem 2.5rem;
  border-radius: 1.5rem;
  z-index: 2;
  text-align: center;
  max-width: 450px;
  width: 90%;
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.15);
  animation: slideUpFade 1s ease-out;
}

/* 트렌디한 타이틀 */
.pulse-title {
  font-size: 1.8rem;
  font-weight: 900;
  letter-spacing: 1px;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, #3c5ef0, #a5b8ff, #3c5ef0);
  background-size: 200%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  animation: shineText 3s linear infinite,  2s ease-in-out infinite;
}


.bg-aurora {
  position: absolute;
  width: 120%;
  height: 120%;
  background: radial-gradient(circle at 30% 30%, #3c5ef0 0%, transparent 60%),
              radial-gradient(circle at 70% 70%, #ff4081 0%, transparent 60%);
  animation: auroraMove 15s ease-in-out infinite;
  z-index: 0;
  opacity: 0.25;
  filter: blur(80px);
}

@keyframes auroraMove {
  0% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(-10%, -10%) rotate(30deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}




.drumroll {
  font-family: monospace;
  animation: drumrollWiggle 1s infinite;
  color: #ff4081;
  font-weight: bold;
}

@keyframes drumrollWiggle {
  0% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  50% { transform: translateX(2px); }
  75% { transform: translateX(-1px); }
  100% { transform: translateX(0); }
}

@keyframes slideUpFade {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 반응형 */
@media screen and (max-width: 480px) {
  .prelaunch-modal {
    padding: 1.5rem 1rem;
  }
  .pulse-title {
    font-size: 1.4rem;
  }
}
.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0,0,0,0.6);
  border: none;
  color: #fff;
  font-size: 1.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  z-index: 1000;
}
</style>