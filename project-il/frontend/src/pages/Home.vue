<script setup>
import UserLayout from '@/components/UserLayout.vue'
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axiosUser  from '@/axiosUser'
import '@/assets/style.css'
import home001 from '@/assets/img/home001.jpg';
import home002 from '@/assets/img/home002.jpg';
import home003 from '@/assets/img/home003.jpg';





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
    name: 'pokerbros',
    url: 'https://pokerbroskorea.net/',
    image: home001,

  }
];

const isLoggedIn = computed(() => !!localStorage.getItem('user_token'))
const router = useRouter()

const logout = () => {
  localStorage.removeItem('user_token')
  router.push('/home')
}


const rates = ref({})
const date = ref('')
const notices = ref([])

const getRates = async () => {
  try {
    const res = await axiosUser.get(`/exchange-rate`);

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
    const res = await axiosUser.get(`/users/notices?limit=3&lang=${lang}`)
    notices.value = res.data.notices
  } catch (err) {
    console.error('공지사항 실패:', err)
  }
}

onMounted(async () => {
  try {
    // 🔹 사용자 정보 (토큰 만료 자동 처리)
    const res = await axiosUser.get('/users/info')
  } catch (err) {
    console.error('사용자 정보 로드 실패:', err)
  }

  // 🔹 기존 기능
  getRates()
  getNotices()

  // 🔹 오버레이 처리
  if (sessionStorage.getItem('overlayClosed') === '1') {
    showOverlay.value = false
  }
})

const formatRate = val => Number(val).toFixed(2)
const formatDate = dateStr => new Date(dateStr).toLocaleDateString()

const showOverlay = ref(true)
// URL에 preview=true 있으면 닫기 버튼 보이고 오버레이 닫기 가능
const canClose = new URLSearchParams(window.location.search).has('preview')


function closeOverlay() {
  showOverlay.value = false
  sessionStorage.setItem('overlayClosed', '1')
}
</script>

<template>
  <UserLayout>
<!-- home.vue -->
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
      <section class="section-two-grid">
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
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.section-two-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
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


.notice-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
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

.notice-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
      padding: 0.4rem 1rem;
  text-decoration: none;
  color: #333;
  transition: background 0.2s;
  font-size: 14px;
}

.notice-row .title {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding-right: 0.5rem;
}

.notice-row .date {
  flex-shrink: 0;
  font-size: 13px;
  color: #888;
}
.notice-card {
  padding: 1.5rem !important;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #eee;
}
.notice-list{
  padding: 0 !important;
}
.notice-list li {
   white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #333;
}
.notice-list li:last-child {
    border-bottom: none;
  }

@media screen and (max-width: 768px) {

  .home {
    background: linear-gradient(180deg, #f5f8ff 0%, #f9fbff 100%) !important;
    padding: 1rem 0.8rem 2rem;
  }
  /* 🔹 카드 레이아웃 정리 */
  .section-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.8rem;
    margin-top: 1rem;
  }
  /* 🔹 외부 링크 카드 (앱 느낌) */
  .external-card {
    background: linear-gradient(180deg, #ffffff 0%, #f7f9ff 100%);
    border-radius: 18px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.06);
    text-align: center;
    border: 1px solid #e8edff;
    transition: all 0.25s ease;
  }
  .external-card:active {
    transform: scale(0.96);
  }
.card-img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 12px;
  display: block;
}
.card-body {
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 0.4rem 0.6rem;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 0 0 12px 12px;
}

  .card-title {
    color: #ffffff;
    font-size: 0.85rem;
    font-weight: 600;
    margin-top: 0.3rem;
    white-space: nowrap;
  }

  /* 🔹 공지사항 / 환율 카드 */
  .section-two-grid {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    margin-top: 1.3rem;
  }
  .section-two-grid .card {
    border-radius: 16px;
    background: #fff;
    border: 1px solid #edf1ff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    padding: 1.3rem !important;
  }
  .card h2 {
    font-size: 1rem;
    color: #3c5ef0;
    font-weight: 700;
    margin-bottom: 0.7rem;
  }

  .notice-card {
    border-radius: 16px;
    background: #fff;
    border: 1px solid #edf1ff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    padding: 1rem 1.1rem !important;
  }
    .notice-card h2 {
    font-size: 1rem;
    color: #3c5ef0;
    margin-bottom: 0.7rem;
    font-weight: 700;
  }
   .notice-list {
    padding: 0;
    margin: 0;
  }
  /* 🔹 리스트 영역 간격 조정 */
  .notice-list li {
    padding: 0.55rem 0;
    border-bottom: 1px solid #f0f3fa;
  }
  .notice-list li:last-child {
    border-bottom: none;
  }


  .notice-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-decoration: none;
    color: #333;
    transition: background 0.2s;
  }
    .notice-row .date {
    display: none;
  }
  .notice-row:hover {
    background: #f7f9ff;
  }

  .notice-row .title {
    font-size: 0.9rem;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .notice-row:hover {
    background: #f7f9ff;
  }

  /* 🔹 환율 블록 */
  .rate-card {
    border-radius: 16px;
    background: #fff;
    border: 1px solid #edf1ff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    padding: 1.1rem 1.2rem !important;
  }

  .rate-list-block {
    background: #f9faff;
    border-radius: 12px;
    padding: 0.8rem 1rem;
  }
  .rate-date {
    text-align: right;
    font-size: 0.8rem;
    color: #777;
    margin-top: 0.8rem;
  }

  /* 🔹 약간의 애니메이션 */
  .card {
    animation: fadeInUp 0.4s ease both;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
.rate-list-block{
  margin: 0 !important;
}
</style>