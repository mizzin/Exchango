// utils/formatDate.js
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)

function toManilaTime(utcDate) {
  if (!utcDate) return null
  return dayjs.utc(utcDate).tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss')
}

module.exports = toManilaTime
