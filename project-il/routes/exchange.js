
const express = require('express');
const router = express.Router();
const { getCustomRates } = require('../utils/rateUtil');

router.get('/', async (req, res) => {
  try {
    const rates = await getCustomRates();  // 여기서 이미 업비트 USDT-KRW 시세가 반영됨
    res.json({ success: true, rates , date: rates.updated_at});
  } catch (err) {
    console.error('❌ 환율 조회 실패:', err.message);
    res.status(500).json({ success: false, message: '환율 가져오기 실패' });
  }
});

module.exports = router;
