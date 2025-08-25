const express = require('express');
const router = express.Router();
const { getCustomRates } = require('../utils/rateUtil');

router.get('/', async (req, res) => {
  const { from, to } = req.query;

 
  console.log('📦 쿼리 파라미터:', { from, to });

  if (!from || !to) {
    return res.status(400).json({ message: 'from, to 쿼리 파라미터가 필요합니다.' });
  }

  try {
    const rates = await getCustomRates();
  //  console.log('📊 환율 데이터 keys:', Object.keys(rates));

    if (!(from in rates) || !(to in rates)) {
     // console.error('❗ 지원되지 않는 통화:', from, to);
      return res.status(404).json({ message: '지원되지 않는 통화입니다.' });
    }

    const rate = rates[to] / rates[from];
    //console.log(`💱 계산된 환율: ${from} → ${to} = ${rate}`);

    res.json({ rate });
  } catch (err) {
    console.error('❌ 환율 조회 실패:', err.message);
    res.status(500).json({ message: '환율 가져오기 실패' });
  }
});

module.exports = router;
