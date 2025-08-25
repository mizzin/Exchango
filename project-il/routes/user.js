// routes/user.js
console.log('📦 routes user 시작');

const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');
const messageController = require('../controllers/messageController');
const transactionController = require('../controllers/transactionController');

// must 함수 정의
const must = (fn, name) => {
  if (typeof fn !== 'function') {
    console.error('❌ Handler missing:', name);
    return (req, res) =>
      res.status(500).json({ ok: false, error: 'HandlerMissing:' + name });
  }
  return fn;
};

// 개발에서만 디버그 로그
if (process.env.NODE_ENV !== 'production') {
  console.log('[routes/user] keys:', Object.keys(userController));
}

// 라우트 등록
router.post(
  '/check-username',
  must(userController.checkUsername, 'userController.checkUsername')
);
router.post(
  '/register',
  must(userController.register, 'userController.register')
);
router.post('/login', must(userController.login, 'userController.login'));

router.get(
  '/info',
  must(verifyToken, 'verifyToken'),
  must(userController.getUserInfo, 'userController.getUserInfo')
);
router.get(
  '/messages',
  must(verifyToken, 'verifyToken'),
  must(messageController.getUserMessages, 'messageController.getUserMessages')
);
router.get(
  '/me',
  must(verifyToken, 'verifyToken'),
  must(userController.getCurrentUser, 'userController.getCurrentUser')
);
router.get(
  '/me/transactions/pending-check',
  must(verifyToken, 'verifyToken'),
  must(userController.getMyTransactions, 'userController.getMyTransactions')
);
router.get(
  '/me/transactions',
  must(verifyToken, 'verifyToken'),
  must(
    transactionController.getMyRechargeTransactions,
    'transactionController.getMyRechargeTransactions'
  )
);

router.post(
  '/inquiries',
  must(verifyToken, 'verifyToken'),
  must(userController.createInquiry, 'userController.createInquiry')
);
router.get(
  '/inquiries',
  must(verifyToken, 'verifyToken'),
  must(userController.getUserInquiries, 'userController.getUserInquiries')
);
router.get(
  '/inquiries/:id',
  must(verifyToken, 'verifyToken'),
  must(userController.getInquiryById, 'userController.getInquiryById')
);

router.get(
  '/me/withdraws',
  must(verifyToken, 'verifyToken'),
  must(transactionController.getMyWithdraws, 'transactionController.getMyWithdraws')
);
router.post(
  '/charge',
  must(verifyToken, 'verifyToken'),
  must(transactionController.submitRechargeRequest, 'transactionController.submitRechargeRequest')
);

router.patch(
  '/:id/bank-info',
  must(verifyToken, 'verifyToken'),
  must(userController.updateBankInfo, 'userController.updateBankInfo')
);
router.get(
  '/messages/:id',
  must(verifyToken, 'verifyToken'),
  must(messageController.readMessage, 'messageController.readMessage')
);

router.get(
  '/notices',
  must(userController.getPublicNotices, 'userController.getPublicNotices')
);
router.get(
  '/notices/:id',
  must(userController.getPublicNoticeById, 'userController.getPublicNoticeById')
);

router.get(
  '/inquiry/pending',
  must(verifyToken, 'verifyToken'),
  must(userController.checkPendingInquiry, 'userController.checkPendingInquiry')
);

router.get('/:id', must(userController.getUserById, 'userController.getUserById'));
router.get('/', must(userController.getUsers, 'userController.getUsers'));
router.put('/:id', must(userController.updateUser, 'userController.updateUser'));
router.delete('/:id', must(userController.deleteUser, 'userController.deleteUser'));

router.patch(
  '/money-password',
  must(verifyToken, 'verifyToken'),
  must(userController.changeMoneyPassword, 'userController.changeMoneyPassword')
);
router.patch(
  '/password',
  must(verifyToken, 'verifyToken'),
  must(userController.changePassword, 'userController.changePassword')
);

//0721
router.get(
  '/me/wallet-history',
  must(verifyToken, 'verifyToken'),
  must(userController.getWalletTransactions, 'userController.getWalletTransactions')
);

module.exports = router;
