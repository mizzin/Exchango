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
    // open.er-api → PHP, CNY
    const fx = await axios.get('https://open.er-api.com/v6/latest/USD');
    const rates = fx.data?.rates || {};
    result.PHP = rates.PHP ?? null;
    result.CNY = rates.CNY ?? null;

    // ✅ 네이버 페이지 (EUC-KR 디코딩)
    const res = await axios.get('https://finance.naver.com/marketindex/exchangeList.naver', {
      responseType: 'arraybuffer'  // 중요!
    });
    const decoded = iconv.decode(res.data, 'EUC-KR');
    const $ = cheerio.load(decoded);

    let usdRate = null;

    $('table.tbl_exchange tbody tr').each((_, el) => {
      const title = $(el).find('td.tit').text().trim().replace(/\s+/g, '');
      if (title.includes('미국USD')) {
        const rateText = $(el).find('td.sale').text().replace(/,/g, '');
        usdRate = parseFloat(rateText);
      }
    });

    if (usdRate) {
      result.KRW = usdRate;
      result.USDT = usdRate;
    } else {
      console.error('❌ 네이버에서 KRW 환율을 찾을 수 없습니다.');
    }

    
    // ✅ USDT는 업비트 기준으로
    const upbitUSDT = await getUpbitUSDT();
    if (upbitUSDT) {
      result.USDT = upbitUSDT;
    } else if (usdRate) {
      result.USDT = usdRate; // fallback
    }
    
    return result;
  } catch (err) {
    console.error('[환율 수집 실패]', err.message);
    return result;
  }
};
