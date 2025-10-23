<template>
  <div class="mypage-info" v-if="user">

    <!-- 회원정보 -->
    <div class="info-box">

      <div class="info-grid">
      <h3>{{ $t('mypage.userInfo') }}</h3>
        <!-- 아이디 -->
        <div class="info-item">
          <span class="label">{{ $t('mypage.username') }}</span>
          <span class="value">{{ user.username }}</span>
        </div>

        <!-- 이름 -->
        <div class="info-item">
          <span class="label">{{ $t('mypage.realName') }}</span>
          <span class="value">{{ user.real_name || '-' }}</span>
        </div>

        <!-- 추천인 
        <div class="info-item">
          <span class="label">{{ $t('mypage.recommender') }}</span>
          <span class="value">{{ user.recommender || '-' }}</span>
        </div>-->

        <!-- 경고 수 -->
        <div class="info-item">
          <span class="label">{{ $t('mypage.warningCount') }}</span>
          <span class="value">{{ user.warning_count }}</span>
        </div>

        <!-- 언어 
        <div class="info-item">
          <span class="label">{{ $t('mypage.language') }}</span>
          <span class="value">{{ user.language }}</span>
        </div>-->

        <!-- ✅ 보유 금액 (리스트 내부 강조 스타일 적용) -->
        <div class="info-item balance">
          <span class="label">{{ $t('mypage.balance') }}</span>
          <span class="value">{{ user.balance ?? 0 }} USD</span>
        </div>

        <!-- 은행 정보 -->
        <div class="info-item">
          <span class="label">{{ $t('mypage.bankName') }}</span>
          <span class="value">{{ user.bank_name || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">{{ $t('mypage.bankAccount') }}</span>
          <span class="value">{{ user.bank_account || '-' }}</span>
        </div>
      </div>

      <!-- ✅ 플랫폼 정보 -->
      <div class="linked-platforms">
        <h3>{{ $t('mypage.linkedPlatforms') }}</h3>
        <p>{{ $t('mypage.platformNote') }}</p>

        <div v-if="props.user.platforms && props.user.platforms.length" class="platform-list">
          <div v-for="(p, i) in props.user.platforms" :key="i" class="info-item">
            <span class="label">{{ p.platform_name || p.platform_id }}</span>
            <span class="value">{{ p.platform_user_id }}</span>
          </div>
        </div>

        <div v-else class="empty">
          {{ $t('mypage.noPlatform') }}
        </div>

        <form @submit.prevent="addPlatform" class="platform-form">
          <div class="platform-actions">
            <label>{{ $t('mypage.addPlatform') }}</label>
            <select v-model="form.platform_id" required>
              <option disabled value="">{{ $t('mypage.platformName') }}</option>
              <option v-for="p in platformOptions" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
            <input
              type="text"
              v-model="form.platform_user_id"
              :placeholder="$t('mypage.platformId')"
              required
            />
          </div>
          <button type="submit" class="btn-submit">{{ $t('mypage.common.save') }}</button>
        </form>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import axiosUser from '@/axiosUser'
import Swal from 'sweetalert2'
import { useI18n } from 'vue-i18n'
import { populate } from 'dotenv'

const { t, locale } = useI18n()
const props = defineProps({ user: Object })
   
const platforms = ref([])
const platformOptions = ref([])
const form = ref({
  platform_id: '',
  platform_user_id: ''
})

const fetchUserPlatforms = async () => {
  if (!props.user?.id) return
  const lang = locale.value
  const res = await axiosUser.get(`/platforms/users/${props.user.id}?lang=${lang}`)
  platforms.value = res.data || []
}


// ✅ 등록 가능한 플랫폼 목록 불러오기
const fetchPlatformOptions = async () => {
  try {
    const res = await axiosUser.get(`/platforms?lang=${locale.value}`)
    platformOptions.value = res.data
  } catch (err) {
    console.error('❌ 플랫폼 옵션 불러오기 실패:', err)
  }
}

// ✅ 플랫폼 추가
const addPlatform = async () => {
  if (!form.value.platform_id || !form.value.platform_user_id) {
    return Swal.fire({
      icon: 'warning',
      title: t('alert.title'),
      text: t('alert.fillAll'),
      confirmButtonColor: '#0052cc'
    })
  }

  try {

    await axiosUser.post(`/platforms/users/${props.user.id}`, form.value)

    await Swal.fire({
      icon: 'success',
      title: 'success!',
      showConfirmButton: false,
      timer: 1200
    })

    form.value.platform_id = ''
    form.value.platform_user_id = ''
    fetchUserPlatforms()
  } catch (err) {
    console.error('❌ 플랫폼 등록 실패:', err)
    Swal.fire({
      icon: 'error',
      title: t('alert.error'),
      text: err.response?.data?.message || 'Failed to add platform.',
      confirmButtonColor: '#0052cc'
    })
  }
}

onMounted(() => {
 
  fetchPlatformOptions()
})
</script>

<style scoped>
/* === 전체 컨테이너 === */
.mypage-info {
  background: #f7f8fc; /* 은은한 톤으로 탭영역과 분리 */
  padding: 1rem;
  border-radius: 16px;
}

/* === 메인 카드 (회원정보 + 플랫폼 통합 섹션) === */
.info-box {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  padding: 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

/* === 회원정보 리스트 === */
.info-grid {
  display: flex;
  flex-direction: column;
  
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
  background: #fff;
  border: 1px solid transparent;
  transition: background 0.2s;
}

.info-item:hover {
  background: #f9faff;
}

.info-item .label {
  color: #666;
  font-size: 0.9rem;
}
.info-item .value {
  color: #222;
  font-weight: 600;
  font-size: 0.95rem;
}

/* === 보유금액 강조 === */

.info-item.balance .value {
  color: #3b49df;
  font-weight: 700;
}

/* === 연동된 플랫폼 === */
.linked-platforms {
  margin-top: 0.4rem;
  padding: 0.8rem 0;
  border-top: 1px solid #f0f1f5;
}

.linked-platforms h4 {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
  color: #222;
}

.linked-platforms p {
  font-size: 0.8rem;
  color: #777;
  margin-bottom: 0.8rem;
}

/* === 플랫폼 리스트 카드 === */
.platform-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  background: #f9f9fc;
  border-radius: 12px;
  padding: 0.6rem 0.8rem;
}

/* 각 플랫폼 라인 */
.platform-list .info-item {
  background: transparent;
  padding: 0.5rem 0;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

/* === 플랫폼 등록 폼 === */
.platform-form {
  margin-top: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.platform-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.platform-actions select,
.platform-actions input {
  width: 100%;
  padding: 0.65rem 0.8rem;
  border: 1px solid #dcdfe6;
  border-radius: 10px;
  background: #fff;
  font-size: 0.9rem;
  outline: none;
}

.platform-actions select:focus,
.platform-actions input:focus {
  border-color: #3b49df;
  box-shadow: 0 0 0 2px rgba(59, 73, 223, 0.15);
}

/* === 저장 버튼 === */
.btn-submit {
  background: linear-gradient(135deg, #0052cc, #2f66ff);
  border-radius: 12px;
  color: #fff;
  font-weight: 600;
  padding: 0.75rem;
  border: none;
  box-shadow: 0 3px 8px rgba(47, 102, 255, 0.25);
  transition: all 0.2s ease;
}
.btn-submit:active {
  transform: scale(0.97);
}

/* === 모바일 최적화 === */
@media (max-width: 768px) {
  .mypage-info {
    background: #fff !important; /* ✅ 배경 흰색으로 통일 */
    padding: 1rem;
  }

  .info-box {
    background: transparent !important; /* ✅ 배경 제거 */
    border-radius: 0 !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  
  .platform-actions select,
  .platform-actions input {
    font-size: 0.85rem;
  }
}


</style>
