// routes/user.js
console.log('📦 routes user 시작');
const express = require('express');
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');
const messageController = require('../controllers/messageController');
const transactionController = require('../controllers/transactionController.js')
const router = express.Router()

router.post('/check-username', userController.checkUsername);
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/info', verifyToken, userController.getUserInfo);
router.get('/messages', verifyToken, messageController.getUserMessages);
router.get('/me', verifyToken, userController.getCurrentUser)
router.get('/me/transactions', verifyToken, transactionController.getMyRechargeTransactions)
router.post('/inquiries', verifyToken, userController.createInquiry);
router.get('/inquiries', verifyToken, userController.getUserInquiries);
router.post('/charge', verifyToken, transactionController.submitRechargeRequest);
router.get('/me/withdraws', verifyToken, transactionController.getMyWithdraws);

router.patch('/:id/bank-info', verifyToken, userController.updateBankInfo)
router.get('/messages/:id', verifyToken, messageController.readMessage)

router.get('/notices', userController.getPublicNotices)
router.get('/notices/:id', userController.getPublicNoticeById)

router.get('/inquiry/pending', verifyToken, userController.checkPendingInquiry);
router.get('/:id', userController.getUserById);
router.get('/', userController.getUsers);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.patch('/money-password', verifyToken, userController.changeMoneyPassword);
router.patch('/password', verifyToken, userController.changePassword);
router.post('/', verifyToken, transactionController.createTransaction);
router.get('/inquiries/:id', verifyToken, userController.getInquiryById);

//0721
router.get('/me/wallet-history', verifyToken, userController.getWalletTransactions )



module.exports = router


