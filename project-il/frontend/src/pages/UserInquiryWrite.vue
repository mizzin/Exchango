<template>
  <UserLayout>
    <div class="user-page">
      <h2>{{ $t('inquiry.write.title') }}</h2>
      <p class="notice-text">
        {{ $t('inquiry.write.noticeText') }}
      </p>
      <form @submit.prevent="submitInquiry">
        <div>
          <label>{{ $t('inquiry.common.category') }}</label>
          <select v-model="category" required>
            <option value="" disabled>{{ $t('inquiry.write.select') }}</option>
            <option value="money">{{ $t('inquiry.category.money') }}</option>
            <option value="account">{{ $t('inquiry.category.account') }}</option>
            <option value="platform">{{ $t('inquiry.category.platform') }}</option>
            <option value="download">{{ $t('inquiry.category.download') }}</option>
            <option value="etc">{{ $t('inquiry.category.etc') }}</option>
          </select>
        </div>

        <div>
          <label>{{ $t('inquiry.common.subject') }}</label>
          <input v-model="title" required />
        </div>

        <div>
          <label>{{ $t('inquiry.detail.content') }}</label>
          <textarea
            v-model="content"
            rows="8"
            :placeholder="$t('inquiry.write.placeholder')"
            class="textarea"
          ></textarea>
        </div>

        <button type="submit" class="btn-submit">
          {{ $t('inquiry.write.submit') }}
        </button>
      </form>
    </div>
  </UserLayout>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from '@/axiosUser'
import UserLayout from '@/components/UserLayout.vue';
import '@/assets/style.css';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const router = useRouter();
const category = ref('');
const title = ref('');
const content = ref('');


const submitInquiry = async () => {
  try {
    const token = localStorage.getItem('user_token');
    await axios.post(
      '/users/inquiries',
      {
        category: category.value,
        title: title.value,
        content: content.value
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    alert(t('inquiry.write.success')); // ✅ 다국어 알림
    router.push('/support/inquiry');
  } catch (err) {
    console.error('문의 등록 실패:', err);
    alert(t('inquiry.write.fail')); // ✅ 다국어 알림
  }
}
</script>

<style scoped>
.user-page {
  max-width: 600px;
  margin: 40px auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  font-family: 'Segoe UI', sans-serif;
  color: #333;
}
.notice-text {
  background-color: #f9f9f9;
  border-left: 4px solid #007BFF; /* 파란색 포인트 */
  padding: 12px 16px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  border-radius: 4px;
}
.user-page h2 {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2a2a2a;
  margin-bottom: 1.5rem;
}

/* 라벨 및 입력 공통 스타일 */
.user-page label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #444;
}

.user-page select,
.user-page input,
.user-page textarea {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.user-page select:focus,
.user-page input:focus,
.user-page textarea:focus {
  outline: none;
  border-color: #5a75f0;
}

/* 버튼 스타일 */
.btn-submit {
  display: inline-block;
  background-color: #5a75f0;
  color: white;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-submit:hover {
  background-color: #3c56c0;
}
@media (max-width: 768px) {
  .user-page {
    padding: 16px;
    margin: 20px auto;
    box-shadow: none;
  }

  .user-page h2 {
    font-size: 1.3rem;
  }

  .btn-submit {
    width: 100%;
    padding: 12px;
    font-size: 15px;
  }
}

</style>