const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/authMiddleware');
// must 함수 정의
const must = (fn, name) => {
  if (typeof fn !== 'function') {
    console.error('❌ Handler missing:', name);
    return (req, res) =>
      res.status(500).json({ ok: false, error: 'HandlerMissing:' + name });
  }
  return fn;
};const messageController = require('../controllers/messageController')

// ✅ 안 읽은 쪽지 개수 조회
router.get(
  '/unread-count',
  must(verifyToken, 'verifyToken'),
  must(messageController.getUnreadCount, 'messageController.getUnreadCount')
)

module.exports = router
