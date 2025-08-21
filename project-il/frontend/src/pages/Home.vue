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
</script>

<template>
  <UserLayout>
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


</style>
