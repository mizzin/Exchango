const express = require('express');
const router = express.Router();
const { sendEmailCode, verifyEmailCode } = require('../controllers/authController');

router.post('/send-email-code', sendEmailCode);
router.post('/verify-email-code', verifyEmailCode);

module.exports = router;
