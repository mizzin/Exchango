const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const eventController = require('../controllers/eventController')


// ✅ 관리자 권한 필요
router.get('/', verifyToken, isAdmin, eventController.getAllEvents)
router.post('/', verifyToken, isAdmin, eventController.createEvent)
router.patch('/:id/toggle', verifyToken, isAdmin, eventController.toggleEvent)
router.delete('/:id', verifyToken, isAdmin, eventController.deleteEvent)

module.exports = router
