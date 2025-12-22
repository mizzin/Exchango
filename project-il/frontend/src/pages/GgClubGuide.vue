<template>
    <UserLayout>
    <div class="guide-container">
      <h2>{{ $t('ggClubGuide.title') }}</h2>

      <section>
        <h3>{{ $t('ggClubGuide.section.required') }}</h3>
        <ul>
          <li>{{ $t('ggClubGuide.approval') }}</li>
          <li>{{ $t('ggClubGuide.platformLimit') }}</li>
          <li>{{ $t('ggClubGuide.realNamePhone') }}</li>
          <li>{{ $t('ggClubGuide.referral') }}</li>
        </ul>
      </section>

      <section>
        <h3>{{ $t('ggClubGuide.section.warning') }}</h3>
        <ul>
          <li>{{ $t('ggClubGuide.warningBlock') }}</li>
          <li>{{ $t('ggClubGuide.warningMsg') }}</li>
        </ul>
      </section>

      <section>
        <h3>{{ $t('ggClubGuide.section.withdraw') }}</h3>
        <ul>
          <li>{{ $t('ggClubGuide.withdrawMessage') }}</li>
          <li>{{ $t('ggClubGuide.adminEditable') }}</li>
        </ul>
      </section>

      <section>
        <h3>{{ $t('ggClubGuide.section.rules') }}</h3>
        <ul>
          <li>{{ $t('ggClubGuide.oneAccount') }}</li>
          <li>{{ $t('ggClubGuide.falseInfo') }}</li>
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
  