const express = require('express')
const router = express.Router()
const requestController = require('../controllers/requestController')

router.post('/apply', requestController.applyRequest)

module.exports = router
