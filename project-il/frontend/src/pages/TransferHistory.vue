<template>
  <UserLayout>
    <div class="recharge-history">
  <h2>{{ $t('history.transfer.title') }}</h2>
  <p>{{ $t('history.transfer.description') }}</p>

      <table v-if="paginatedHistory.length">
        <thead>
          <tr>
            <th>{{ $t('history.transfer.date') }}</th>
            <th>{{ $t('history.transfer.from') }}</th>
            <th>{{ $t('history.transfer.to') }}</th>
            <th>{{ $t('history.transfer.amount') }}</th>
            <th>{{ $t('history.transfer.converted') }}</th>
            <th>{{ $t('history.transfer.status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in paginatedHistory" :key="item.id" class="clickable-row" @click="openDetail(item)">
            <td>{{ formatDate(item.created_at) }}</td>

            <td>
              {{ item.from_type === 'wallet' ? $t('history.transfer.wallet') : getPlatformName(item.from_platform_id) }}
            </td>
            <td>
              {{ item.to_platform_id === null ? $t('history.transfer.wallet') : getPlatformName(item.to_platform_id) }}
            </td>
            <td>{{ formatAmount(item.amount, item.currency) }}</td>

           <td>
            <span v-if="item.expected_amount">
              {{ formatAmount(item.expected_amount, getCurrencyByPlatformId(item.to_platform_id)) }}
            </span>
            <span v-else>-</span>
          </td>
            <td>
              <span :class="'badge status-' + item.status">
                {{ formatStatus(item.status) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else style="text-align: center; padding: 2rem; color: #777;">
        {{ $t('history.noRechargeHistory') }}
      </div>

      <!-- 상세 모델 -->
      <div v-if="selected" class="modal-overlay" @click.self="selected = null">
        <div class="modal">
            <h3>{{ $t('history.transfer.detailTitle') }}</h3>
          <ul>
            <li><strong>{{ $t('history.transfer.type') }}:</strong> {{ formatType(selected.type) }}</li>
            <li><strong>{{ $t('history.transfer.from') }}:</strong> {{ selected.from_type }} - {{ selected.from_platform_user_id }}</li>
            <li><strong>{{ $t('history.transfer.to') }}:</strong> {{ selected.to_platform_id }} - {{ selected.to_platform_user_id }}</li>
            <li><strong>{{ $t('history.transfer.amount') }}:</strong> {{ formatAmount(selected.amount, selected.currency) }}</li>
            <li v-if="selected.expected_amount"><strong>{{ $t('history.transfer.converted') }}:</strong> {{ formatAmount(selected.expected_amount, selected.currency) }}</li>
            <li v-if="selected.exchange_rate"><strong>{{ $t('history.transfer.rate') }}:</strong> {{ selected.exchange_rate }}</li>
            <li v-if="selected.user_memo"><strong>{{ $t('history.transfer.memo') }}:</strong> {{ selected.user_memo }}</li>
            <li v-if="selected.admin_note"><strong>{{ $t('history.transfer.adminMemo') }}:</strong> {{ selected.admin_note }}</li>
            <li><strong>{{ $t('history.transfer.status') }}:</strong> {{ formatStatus(selected.status) }}</li>
            <li><strong>{{ $t('history.transfer.startedAt') }}:</strong> {{ formatDate(selected.created_at) }}</li>
            <li><strong>{{ $t('history.transfer.processedAt') }}:</strong> {{ formatDate(selected.updated_at) }}</li>
          </ul>
          <button class="btn-dark" @click="selected = null">{{ $t('common.close') }}</button>

        </div>
      </div>
<!-- 페이징 -->
      <div class="pagination" v-if="totalPages > 1">
  <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1" class="btn btn-outline-primary">
    &lt;
  </button>
  <button
    v-for="page in visiblePages"
    :key="page"
    @click="changePage(page)"
    :class="['btn', currentPage === page ? 'btn-primary' : 'btn-outline-primary']"
  >
    {{ page }}
  </button>
  <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages" class="btn btn-outline-primary">
    &gt;
  </button>
</div>

    </div>
  </UserLayout>
</template>

<script setup>
import { ref, onMounted, computed  } from 'vue'
import axios from '@/axiosUser'
import UserLayout from '@/components/UserLayout.vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'


const { t } = useI18n()
const history = ref([])
const selected = ref(null)
const userBalance = ref(0)  // 초기값 0으로 설정

const platformOptions = ref([])


const currentPage = ref(1)
const pageSize = 10



const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return history.value.slice(start, start + pageSize)
})

const totalPages = computed(() => Math.ceil(history.value.length / pageSize))

const visiblePages = computed(() => {
  const pages = []
  for (let i = 1; i <= totalPages.value; i++) {
    pages.push(i)
  }
  return pages
})

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}


const fetchHistory = async () => {
  try {
    const res = await axios.get('/transactions/wallet/transfer/history')
    history.value = res.data.data
  
  } catch (err) {
    alert('error  ')
  }
}
const getCurrencyByPlatformId = (id) => {
  if (!id || id === 'wallet') return 'USD'
  const p = platformOptions.value.find(p => String(p.platform_id) === String(id))
  return p?.currency || 'USD'
}

const openDetail = (item) => {
  
  selected.value = item
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY.MM.DD HH:mm:ss')
}
const formatAmount = (val, currency) => `${Number(val).toLocaleString()} ${currency}`
const formatType = (type) => {
  switch (type) {
    case 'wallet_to_platform': return t('history.transfer.direction.walletToPlatform')
    case 'platform_to_wallet': return t('history.transfer.direction.platformToWallet')
    case 'platform_to_platform': return t('history.transfer.direction.platformToPlatform')
    default: return type
  }
}
const formatDirection = (item) => formatType(item.type)
const formatStatus = (status) => {
  return t(`status.${status}`)
}

const getPlatformName = (id) => {
  if (!id || id === 'wallet') return t('history.transfer.wallet')
  const p = platformOptions.value.find(p => String(p.platform_id) === String(id))
  return p?.name || t('history.transfer.platformFallback')
}

const fetchPlatformOptions = async () => {
  try {
    const lang = localStorage.getItem('lang') || 'en'
    const res = await axios.get('/platforms?lang=' + lang)
    platformOptions.value = res.data
  } catch (err) {
    console.error('❌ platfrom list failed:', err)
  }
}

onMounted(() => {
  fetchPlatformOptions()
  fetchHistory()
})

</script>

<style scoped>
.modal {
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1001;
}

.recharge-history {
  max-width: 900px;
  margin: 2rem auto;
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  font-family: 'Pretendard', sans-serif;
  font-size: 14px;
  color: #333;
}

.wallet-balance {
  font-size: 16px;
  margin-bottom: 1rem;
  color: #111;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

thead {
  background-color: #f8f9fa;
}

th, td {
  padding: 0.75rem 1rem;
  text-align: center;
  border-bottom: 1px solid #eee;
}

th {
  font-weight: 600;
  color: #555;
  font-size: 13px;
}

td {
  font-size: 14px;
  color: #333;
}

.badge {
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 13px;
  display: inline-block;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
}

.status-approved,
.status-completed {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-rejected {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
.modal {
   display: block !important;
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1001;
}
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}


.modal h3 {
  margin-bottom: 16px;
}

.modal ul {
  list-style: none;
  padding: 0;
}

.modal li {
  margin-bottom: 8px;
  font-size: 14px;
}

.btn-dark {
  margin-top: 16px;
  padding: 8px 16px;
  background: #333;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-dark:hover {
  background: #000;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable-row:hover {
  background-color: #f0f8ff;
}
</style>
