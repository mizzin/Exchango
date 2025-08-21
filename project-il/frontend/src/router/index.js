import { createRouter, createWebHistory } from 'vue-router'
import AdminLogin from '../pages/AdminLogin.vue'
import AdminDashboard from '../pages/AdminDashboard.vue'
import AdminMessageTemplates from '../pages/AdminMessageTemplates.vue'
import AdminInquiries from '../pages/AdminInquiries.vue'
import AdminInquiryDetail from '../pages/AdminInquiryDetail.vue'
import UserInquiryWrite from '../pages/UserInquiryWrite.vue';
//0721
const routes = [
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/pages/Register.vue')
  },{
    path: '/guide',
    name: 'JoinGuide',
    component: () => import('@/pages/JoinGuide.vue')
  },  
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue')
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue')
  },
  {
    path: '/admin/users',
    component: () => import('@/pages/AdminUserList.vue'),
    meta: { requiresAdmin: true }
  },{
    path: '/admin/login',
    component: AdminLogin
  },
  {
    path: '/admin/dashboard',
    component: AdminDashboard
  },{
    path: '/mypage',
    name: 'MyPage',
    meta: { requiresAuth: true },
    component: () => import('@/pages/MyPage.vue')
  },{
    path: '/messages/:id',
    name: 'MessageDetail',
    component: () => import('../pages/MessageDetail.vue')
  },{
    path: '/admin/messages/sent',
    name: 'AdminSentMessages',
    component: () => import('../pages/AdminSentMessages.vue'),
    meta: { requiresAdmin: true }
  },{
    path: '/admin/messages/send',
    name: 'AdminMessageSend',
    component: () => import('../pages/AdminMessageSend.vue'),
    meta: { requiresAdmin: true }
  },{
    path: '/admin/trade/recharge',
    name: 'AdminTrade',
    component: () => import('../pages/AdminTrade.vue'),
    meta: { requiresAdmin: true } 
  },{
    path: '/admin/trade/withdraw',
    name: 'AdminWithdraw',
    component: () => import('../pages/AdminWithdraw.vue'),
    meta: { requiresAdmin: true } 
  },{
    path: '/admin/messages/templates',
    name: 'AdminMessageTemplates',
    component: AdminMessageTemplates
  },{
    path: '/messages',
    name: 'messages',
    meta: { requiresAuth: true },
    component: () => import('../pages/Messages.vue'),
  },{
    path: '/trade/recharge',
    name: 'recharge',
    component: () => import('@/pages/ChargeForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/notice',
    name: 'AdminNoticeList',
    component: () => import('@/pages/AdminNoticeList.vue'),
    meta: { requiresAdmin: true } 
  },{
    path: '/admin/notices/create',
    name: 'AdminNoticeCreate',
    component: () => import('@/pages/AdminNoticeCreate.vue') 
  },{
    path: '/admin/notices/:id/edit',
    name: 'AdminNoticeEdit',
    component: () => import('@/pages/AdminNoticeEdit.vue')
  },{
    path: '/support/notice',
    name: 'UserNoticeList',
    component: () => import('@/pages/UserNoticeList.vue')
  },
  {
    path: '/support/notice/:id',
    name: 'UserNoticeDetail',
    component: () => import('@/pages/UserNoticeDetail.vue')
  },{
  path: '/wallet/charge',
  name: 'WalletCharge',
  component: () => import('@/pages/WalletChargeForm.vue')
},{
  path: '/wallet/withdraw',
  name: 'Walletwithdraw',
  component: () => import('@/pages/WalletWithdrawForm.vue')
}, {
  path: '/wallet/history',
  name: 'Wallethistory',
  component: () => import('@/pages/Wallethistory.vue')
}, {
   path: '/wallet/transfer',
  name: 'TransferForm',
  component: () => import('@/pages/TransferForm.vue')
},{
   path: '/wallet/transfer/history',
  name: 'TransferHistory',
  component: () => import('@/pages/TransferHistory.vue')
},{
    path: '/admin/inquiry',
    name: 'AdminInquiries',
    component: AdminInquiries
  },
  {
    path: '/admin/inquiries/:id',
    name: 'AdminInquiryDetail',
    component: AdminInquiryDetail
  },{
    path: '/support/inquiry/write',
    name: 'UserInquiryWrite',
    component: UserInquiryWrite
  },{
    path: '/support/inquiry',
    name: 'UserInquiryList',
    component: () => import('@/pages/UserInquiryList.vue')
  },
  {
    path: '/support/inquiry/:id',
    name: 'UserInquiryDetail',
    component: () => import('@/pages/UserInquiryDetail.vue')
  },{
    path: '/trade/withdraw',
    name: 'Withdraw',
    component: () => import('@/pages/Withdraw.vue')
  },{
    path: '/trade/history',
    name: 'History',
    component: () => import('@/pages/History.vue')
  },{
     path: '/admin/trade/wallet-charge',
    name: 'wallet-charge',
    component: () => import('@/pages/AdminWalletChargeList.vue')
  },{
     path: '/admin/trade/wallet-withdraw',
    name: 'wallet-withdraw',
    component: () => import('@/pages/AdminWalletWithdrawList.vue')
  },{
  path: '/admin/users/:id',
  component: () => import('@/pages/AdminUserDetail.vue')
},{
     path: '/admin/trade/wallet-transfer',
    name: 'AdminTransferRequests',
    component: () => import('@/pages/AdminTransferRequests.vue')
  },{
     path: '/admin/requests',
    name: 'AdminRequests',
    component: () => import('@/pages/AdminRequests.vue')
  },{
     path: '/admin/history',
    name: 'AdminHistory',
    component: () => import('@/pages/AdminHistory.vue')
  }
  
  
]

const router = createRouter({
  history: createWebHistory(),
  routes
})
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('user_token')
  const role = localStorage.getItem('role')
  const userToken = !!token 
  const adminToken = !!localStorage.getItem('admin_token')

  const requiresAuth = ['mypage', 'messages', 'recharge', 'withdraw']

  // 로그인 사용자만 접근 가능한 페이지
  if (to.name && requiresAuth.includes(to.name) && (!token || role !== 'user')) {
    alert('로그인이 필요한 페이지입니다.')
    return next('/login')
  }

  // meta: { requiresAuth: true } 설정된 경우
  if (to.meta.requiresAuth && !userToken) {
    alert('로그인이 필요합니다.')
    return next('/login')
  }

  // meta: { requiresAdmin: true } 설정된 경우
  if (to.meta.requiresAdmin && !adminToken) {
    alert('관리자 권한이 필요합니다.')
    return next('/admin/login')
  }

  next()
})

export default router
