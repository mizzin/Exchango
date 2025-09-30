<template>
  <div class="mypage-info" v-if="user">
    <!-- 잔액 -->
    <div class="balance-box">
      <div class="balance-icon">💰</div>
      <div class="balance-text">
        <p class="label">{{ $t('mypage.balance') }}</p>
        <p class="amount">{{ user.balance ?? 0 }} USD</p>
      </div>
    </div>

    <!-- 회원정보 -->
    <div class="info-box">
      <h3>{{ $t('mypage.userInfo') }}</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">{{ $t('mypage.username') }}</span>
          <span class="value">{{ user.username }}</span>
        </div>
        <div class="info-item">
          <span class="label">{{ $t('mypage.realName') }}</span>
          <span class="value">{{ user.real_name || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">{{ $t('mypage.recommender') }}</span>
          <span class="value">{{ user.recommender || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">{{ $t('mypage.warningCount') }}</span>
          <span class="value">{{ user.warning_count }}</span>
        </div>
        <div class="info-item">
          <span class="label">{{ $t('mypage.language') }}</span>
          <span class="value">{{ user.language }}</span>
        </div>
        <div class="info-item">
          <span class="label">{{ $t('mypage.bankName') }}</span>
          <span class="value">{{ user.bank_name || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">{{ $t('mypage.bankAccount') }}</span>
          <span class="value">{{ user.bank_account || '-' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ user: Object })
</script>

<style scoped>
/* 💰 보유 금액 */
.balance-box {
  display: flex;
  align-items: center;
  background: #f4f6ff;
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
  box-shadow: inset 0 0 4px rgba(0,0,0,0.05);
}

.balance-icon {
  font-size: 2rem;
  margin-right: 0.8rem;
}

.balance-text .label {
  font-size: 0.85rem;
  color: #666;
}

.balance-text .amount {
  font-size: 1.3rem;
  font-weight: bold;
  color: #3b49df;
}

/* 🧑 회원정보 */
.info-box h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 0.8rem;
  border-bottom: 1px solid #e0e0e0;
}

.info-item:last-child{
  border-bottom: none;
}

.info-item .label {
  font-weight: 500;
  color: #555;
}

.info-item .value {
  font-weight: 600;
  color: #222;
}

/* 📱 모바일 */
@media (max-width: 768px) {
  .balance-text .amount {
    font-size: 1.1rem;
  }
  .info-item {
    font-size: 0.9rem;
    padding: 0.5rem 0.6rem;
  }
}
</style>