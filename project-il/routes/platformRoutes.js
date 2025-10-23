// routes/platformRoutes.js
const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/authMiddleware')
const platformController = require('../controllers/platformController')

router.get('/', verifyToken, platformController.getAllPlatforms)
router.get('/users/:id', verifyToken, platformController.getUserPlatforms)
router.post('/users/:id', verifyToken, platformController.addUserPlatform)

module.exports = router
