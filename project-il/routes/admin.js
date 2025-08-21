const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');
const transactionController = require('../controllers/transactionController')



 // ✅ 모든 admin 요청 감지용 로그 (정상 로그 추가하고 경로는 '/' 지정)
 router.use('/', (req, res, next) => {
   console.log(`[AdminRoute] ${req.method} ${req.originalUrl}`);
   next();
}); 
// ✅ 회원 승인 API
router.patch('/users/:id/approve', verifyToken, isAdmin, adminController.approveUser);
router.patch('/users/:id/reject', verifyToken, isAdmin, adminController.rejectUser);
// ✅ 회원 목록
router.get('/users', verifyToken, isAdmin, adminController.getAllUsers);
router.get('/users/pending', verifyToken, isAdmin, adminController.getPendingUsers);

//회원메모
router.patch('/users/:id/note', verifyToken, isAdmin, adminController.updateNote)

// ✅ 회원 차단 라우트
router.patch('/users/:id/block', verifyToken, isAdmin, adminController.blockUser);
router.patch('/users/:id/unblock', verifyToken, isAdmin, adminController.unblockUser);
// ✅ 쪽지보내기.
router.post('/messages', verifyToken, isAdmin, adminController.sendMessage);
//경고
router.patch('/users/:id/warning', verifyToken, isAdmin, adminController.giveWarning);
router.get('/users/:id/warnings', verifyToken, isAdmin, adminController.getWarnings);
router.post('/messages/send', verifyToken, isAdmin, adminController.sendMessage);
// ✅ 보낸 쪽지 목록
router.get('/messages/sent', verifyToken, isAdmin, adminController.getSentMessages);
// ✅ 쪽지관리
router.get('/message-templates', verifyToken, isAdmin, adminController.getMessageTemplates)
router.post('/message-templates', verifyToken, isAdmin, adminController.updateMessageTemplates)
router.delete('/messages/:id', verifyToken, isAdmin, adminController.deleteMessage)
// 관리자 충전 내역 조회
router.get('/trade/recharge', verifyToken, isAdmin, transactionController.getRechargeTransactions)
router.get('/trade/withdraw', verifyToken, isAdmin, transactionController.getWithdrawTransactions)
// 관리자 충전 내역 조회 0721
router.get('/transactions/wallet-charge', verifyToken, isAdmin, transactionController.getWalletChargeList);
// 충전 승인/거절 처리 0721
router.patch('/transactions/:id/approve', verifyToken, isAdmin, transactionController.approveTransaction)
router.patch('/transactions/:id/reject',verifyToken,  isAdmin, transactionController.rejectTransaction)
// 머니이동 관리자 승은/거절
router.get('/wallet/transfer', verifyToken, isAdmin, transactionController.getAllMoveRequests);

router.patch('/wallet/transfer/:id/approve', verifyToken, isAdmin, transactionController.approvePlatformMove);
router.patch('/wallet/transfer/:id/reject', verifyToken, isAdmin, transactionController.rejectPlatformMove);


// 승인
router.patch('/trade/recharge/:id/approve', verifyToken, isAdmin, transactionController.approveRecharge)
router.patch('/trade/withdraw/:id/approve', verifyToken, isAdmin, transactionController.approveWithdraw)
//관리자 사용자 비밀번호 변경 0701
router.patch('/users/:id', adminController.updateUser)
router.patch('/users/:id/password', verifyToken, isAdmin, adminController.resetUserPassword);

// 거절
router.patch('/trade/recharge/:id/reject', verifyToken, isAdmin, transactionController.rejectRecharge)
router.patch('/trade/withdraw/:id/reject', verifyToken, isAdmin, transactionController.rejectWithdraw)
//사용자 플랫폼 조회
router.get('/users/:id/platforms', verifyToken, isAdmin, adminController.getUserPlatforms)
router.post('/users/:id/platforms', verifyToken, isAdmin, adminController.addUserPlatform)
router.patch('/users/:id/platforms/:platformId', verifyToken, isAdmin, adminController.updateUserPlatform)

//모든 신청내역조회
router.get('/requests', verifyToken, isAdmin, transactionController.getAllRequests)


// 공지 등록
router.post('/notices', verifyToken, isAdmin, adminController.createNotice)
router.get('/notices', verifyToken, isAdmin, adminController.getAllNotices)
router.get('/notices/:id', verifyToken, isAdmin, adminController.getNoticeById)
router.put('/notices/:id', verifyToken, isAdmin, adminController.updateNotice)
router.delete('/notices/:id', verifyToken, isAdmin, adminController.deleteNotice)

// 미들웨어: 관리자 인증은 필요 시 추가
router.get('/inquiries', verifyToken, isAdmin, adminController.getInquiries);
router.get('/inquiries/:id', verifyToken, isAdmin, adminController.getInquiryDetail);


// 기존 라우트에서 이 부분을 변경
router.get('/summary', verifyToken, isAdmin, adminController.getSummary)
router.get('/users/:id', verifyToken, isAdmin, adminController.getUserById);
router.patch('/inquiries/:id/answer', verifyToken, isAdmin, adminController.answerInquiry);

module.exports = router;
