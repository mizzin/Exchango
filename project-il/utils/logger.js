// logger.js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;
const fs = require('fs');
const path = require('path');

// logs 폴더 없으면 자동 생성
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',  // 운영에서는 warn 이상만
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new transports.Console({
      format: combine(colorize(), logFormat),
    }),
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
    }),
  ],
});

// ✅ 커스텀 이벤트 로그 함수 추가
logger.event = (action, userId, detail = '') => {
  const userInfo = userId ? ` by UserID:${userId}` : '';
  logger.info(`📢 ${action}${userInfo}${detail ? ` — ${detail}` : ''}`);
};

module.exports = logger;
