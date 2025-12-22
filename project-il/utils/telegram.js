// utils/telegram.js
const axios = require('axios');
const https = require('https');

const TELEGRAM_TOKEN = '8247376637:AAF9SLCIT9b3Nye56Du2jLdTKtyIHBgmIGw';
const CHAT_ID = '-4839707017';

// HTTPS Agent를 한 번만 생성하여 재사용합니다.
const httpsAgent = new https.Agent({
  family: 4,        // ✅ IPv4 강제
  keepAlive: true,  // ✅ 연결 재사용 활성화
  maxSockets: 10,    // 동시 연결 소켓 수 (적절히 조절)
});

function sendTelegramMessage(msg) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  return axios.post(
    url,
    {
      chat_id: CHAT_ID,
      text: msg,
    },
    {
      httpsAgent: httpsAgent, // 생성해둔 Agent 사용
    }
  );
}

module.exports = sendTelegramMessage;
