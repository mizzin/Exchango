<template>
   <div class="mypage-info" v-if="user">
    <div class="balance-box">
      💰 <p v-if="user">{{ $t('mypage.balance') }}: {{ user.balance ?? 0 }} USD</p>
    </div>

    <div class="info-box">
      <h3>{{ $t('mypage.userInfo') }}</h3>
      <ul>
        <li><span>{{ $t('mypage.username') }}</span> {{ user.username }}</li>
        <li><span>{{ $t('mypage.realName') }}</span> {{ user.real_name || '-' }}</li>
        <li><span>{{ $t('mypage.recommender') }}</span> {{ user.recommender || '-' }}</li>
        <li><span>{{ $t('mypage.warningCount') }}</span> {{ user.warning_count }}</li>
        <li><span>{{ $t('mypage.language') }}</span> {{ user.language }}</li>
        <li><span>{{ $t('mypage.bankName') }}</span> {{ user.bank_name || '-' }}</li>
        <li><span>{{ $t('mypage.bankAccount') }}</span> {{ user.bank_account || '-' }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
defineProps({ user: Object })
</script>

<style scoped>

.balance-box {
  font-size: 18px;
  font-weight: bold;
  color: #3b49df;
  margin-bottom: 20px;
  background: #f4f6ff;
  padding: 10px 16px;
  border-left: 4px solid #3b49df;
}

.info-box h3 {
  font-size: 16px;
  margin-bottom: 10px;
}

.info-box ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-box li {
  padding: 6px 0;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
}

.info-box li span {
  font-weight: 500;
  color: #333;
}
</style>
