const express = require('express')
const router = express.Router()
const depositAddressController = require('../controllers/depositAddressController')
const transactionController = require('../controllers/transactionController')
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');


router.get('/', verifyToken, isAdmin, depositAddressController.getAllDepositAddresses)
router.post('/', verifyToken, isAdmin, depositAddressController.createOrUpdateDepositAddress)
router.patch('/:id', verifyToken, isAdmin, depositAddressController.updateDepositAddress)
//사용자조회
router.get('/:currency', transactionController.getDepositAddressByCurrency)


module.exports = router
