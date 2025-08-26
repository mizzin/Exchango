<template>
    <UserLayout>
    <div class="guide-container">
      <h2>{{ $t('guide.title') }}</h2>

      <section>
        <h3>{{ $t('guide.section.required') }}</h3>
        <ul>
          <li>{{ $t('guide.approval') }}</li>
          <li>{{ $t('guide.platformLimit') }}</li>
          <li>{{ $t('guide.realNamePhone') }}</li>
          <li>{{ $t('guide.referral') }}</li>
        </ul>
      </section>

      <section>
        <h3>{{ $t('guide.section.warning') }}</h3>
        <ul>
          <li>{{ $t('guide.warningBlock') }}</li>
          <li>{{ $t('guide.warningMsg') }}</li>
        </ul>
      </section>

      <section>
        <h3>{{ $t('guide.section.withdraw') }}</h3>
        <ul>
          <li>{{ $t('guide.withdrawMessage') }}</li>
          <li>{{ $t('guide.adminEditable') }}</li>
        </ul>
      </section>

      <section>
        <h3>{{ $t('guide.section.rules') }}</h3>
        <ul>
          <li>{{ $t('guide.oneAccount') }}</li>
          <li>{{ $t('guide.falseInfo') }}</li>
        </ul>
      </section>
    </div>

    </UserLayout>
  </template>
  
  <script setup>
  import UserLayout from '@/components/UserLayout.vue' 
  </script>
  
  <style scoped>
  .guide-container {
    max-width: 700px;
    margin: 30px auto;
    padding: 20px;
    background-color: #f9faff;
    border-radius: 12px;
    line-height: 1.6;
    font-size: 15px;
  }
  h2 {
    text-align: center;
    margin-bottom: 20px;
  }
  section {
    margin-bottom: 25px;
  }
  ul {
    padding-left: 20px;
  }
  li {
    margin-bottom: 10px;
  }
  </style>
  