// utils/telegram.js
const axios = require('axios')

const TELEGRAM_TOKEN = '8247376637:AAF9SLCIT9b3Nye56Du2jLdTKtyIHBgmIGw'
// 아래 chat_id는 단톡방(chat) id!
const CHAT_ID = '-4839707017'

function sendTelegramMessage(msg) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`
  return axios.post(url, {
    chat_id: CHAT_ID,
    text: msg,
  })
}

module.exports = sendTelegramMessage
