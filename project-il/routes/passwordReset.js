// routes/passwordReset.js
const express = require('express')
const router = express.Router()
const prController = require('../controllers/passwordResetController')

router.post('/auth/forgot', prController.forgotPassword)
router.get('/auth/reset', prController.verifyResetToken)
router.post('/auth/reset', prController.resetPassword)

module.exports = router
