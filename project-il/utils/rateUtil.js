//utils>rateUtil.js
const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

const getUpbitUSDT = async () => {
  try {
    const res = await axios.get('https://api.upbit.com/v1/ticker?markets=KRW-USDT');
    const price = res.data?.[0]?.trade_price;
    return typeof price === 'number' ? price : null;
  } catch (err) {
    console.error('❌ 업비트 USDT 시세 조회 실패:', err.message);
    return null;
  }
};

exports.getCustomRates = async () => {
  const result = {
    USD: 1.0,
    KRW: null,
    PHP: null,
    CNY: null,
    USDT: null,
    updated_at: new Date().toISOString()
  };

  try {
    // ✅ 오픈 API (PHP, CNY)
    const fx = await axios.get('https://open.er-api.com/v6/latest/USD');
    const rates = fx.data?.rates || {};
    result.PHP = rates.PHP ?? null;
    result.CNY = rates.CNY ?? null;

    // ✅ 업비트 USDT-KRW 실시간 시세
    const upbitUSDT = await getUpbitUSDT();
    if (upbitUSDT) {
      result.KRW = upbitUSDT;   // 원화 = 업비트 기준 시세
      result.USDT = upbitUSDT;  // USDT 동일 시세
    }

    return result;
  } catch (err) {
    console.error('[환율 수집 실패]', err.message);
    return result;
  }
};
