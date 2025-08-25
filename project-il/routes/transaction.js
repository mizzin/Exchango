const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/authMiddleware')
const transactionController = require('../controllers/transactionController')

// 🔋 충전 요청 등록
router.post('/', verifyToken, transactionController.createTransaction)
// 출금신청
router.post('/withdraw', verifyToken, transactionController.createWithdrawTransaction);
//사이트 내에 입금 신청 0721 사용자
router.post('/wallet/charge', verifyToken, transactionController.createWalletRecharge);

//사이트 내에 출금신청목록 0721
router.post('/wallet/withdraw', verifyToken, transactionController.createWalletWithdraw); 

//머니이동 0724
router.post('/wallet/transfer', verifyToken, transactionController.requestPlatformMove);
router.get('/wallet/transfer/history', verifyToken, transactionController.getPlatformMoveHistory);


 
module.exports = router
