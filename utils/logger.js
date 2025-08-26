// logger.js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;


const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] [${level}] ${message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new transports.Console(), // 콘솔 출력
    new transports.File({ filename: 'logs/error.log', level: 'error' }), // 에러만
    new transports.File({ filename: 'logs/combined.log' }) // 전체 로그
  ]
});

module.exports = logger;
