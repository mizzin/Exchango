<template>
  <div v-if="showPopup" class="event-popup">
    <div class="popup-content">
      <img :src="popupImage" alt="Event Popup" class="popup-image" />

      <div class="popup-footer">
        <label class="checkbox-label">
          <input type="checkbox" v-model="dontShowToday" />
          {{ t('popup.doNotShowToday') }}
        </label>
        <button class="close-btn" @click="closePopup">{{ t('popup.close') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import enImage from '@/assets/img/event/popup_en.jpg'
import koImage from '@/assets/img/event/popup_ko.jpg'

const { locale, t } = useI18n()

const showPopup = ref(false)
const dontShowToday = ref(false)

// 이벤트 기간 설정 
const startDate = new Date('2025-12-23T00:00:00')
const endDate = new Date('2026-01-01T00:00:00')

// 언어별 이미지
const popupImage = computed(() => {
  return locale.value === 'ko' ? koImage : enImage
})

// localStorage 키 (언어별 독립 관리)
const storageKey = computed(() => `popupDismissed_${locale.value}`)

// 팝업 표시 조건
onMounted(() => {
  const today = new Date()
  if (today < startDate || today >= endDate) return // 이벤트 기간 외엔 표시 안 함

  const saved = localStorage.getItem(storageKey.value)
  if (!saved || new Date(saved) < today) {
    showPopup.value = true
  }
})

const closePopup = () => {
  showPopup.value = false
  if (dontShowToday.value) {
    const expire = new Date()
    expire.setHours(23, 59, 59, 999)
    localStorage.setItem(storageKey.value, expire)
  }
}
</script>

<style scoped>
.event-popup {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 16px;
}

/* 팝업 박스 */
.popup-content {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  text-align: center;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  animation: fadeIn 0.3s ease;
}

/* 이미지 */
.popup-image {
  width: 100%;
  display: block;
  height: auto;
}

/* 하단 체크박스 + 닫기버튼 */
.popup-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  font-size: 14px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
}

.close-btn {
  background: #007bff;
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.close-btn:active {
  background: #005fcc;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

/* 모바일 대응 */
@media (max-width: 480px) {
  .popup-content {
    max-width: 320px;
  }

  .popup-footer {
    flex-direction: column;
    gap: 8px;
  }

  .close-btn {
    width: 100%;
  }
}
</style>
