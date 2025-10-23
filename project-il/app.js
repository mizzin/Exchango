const express = require('express');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');
//이거레알실운여서버용이것만주석풀어야함require('dotenv').config({ path: path.join(__dirname, '.env.production') });
//console.log('📦 .env 사용 경로:', path.join(__dirname, '.env.production'));
//console.log('✅ PORT:', process.env.PORT);
// app.js 맨 위 아래는 로컬테스트환경
require('dotenv').config({ path: '.env.production.local' });

// const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
// require('dotenv').config({
//   path: path.resolve(__dirname, envFile)
// });

const app = express();

// ✅ Body 크기 제한 늘리기 (공지 + 이미지용)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));



// ✅ Vue 빌드 디렉토리
const distPath = path.resolve(__dirname, 'frontend', 'dist');

// ✅ 요청 로그 (정적 자원 제외)
app.use((req, res, next) => {
  if (!req.url.startsWith('/assets') && !req.url.endsWith('.svg')) {
    const ip = req.ip.includes('::ffff:') ? req.ip.replace('::ffff:', '') : req.ip;
    logger.info(`➡️ ${req.method} ${req.url} 요청 from ${ip}`);
  }
  next();
});

// ✅ 정적 파일 서빙 (딱 한 번만!)
app.use(express.static(distPath));


// ✅ API 경로는 /api 하위로만!
app.use('/api/users', require('./routes/user'));
app.use('/api/platforms', require('./routes/platformRoutes'));
app.use('/api/exchange-rate', require('./routes/exchange'));
app.use('/api/transactions', require('./routes/transaction'));
//0724
const exchangeRateRouter = require('./routes/exchangeRate');
app.use('/api/exchange-rate', exchangeRateRouter); 

const messageRoutes = require('./routes/messageRoutes')
app.use('/api/messages', messageRoutes)

app.use('/api/upload', require('./routes/upload'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/auth', require('./routes/auth'));

app.use('/api', require('./routes/passwordReset'))

app.use('/api/deposit-addresses', require('./routes/adminDepositAddress'))


// ✅ 업로드 파일 서빙
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use((req, res, next) => {
  // 읽지 않은 쪽지 카운트 API는 로그 남기지 않음
 if (
    !req.url.startsWith('/assets') &&
    !req.url.endsWith('.svg') &&
    !req.url.includes('/api/messages/unread-count') // 🔹 쪽지 카운트 요청 제외
  ) {
    return next()
  }

  console.log(`[${new Date().toISOString()}] [info] ➡️ ${req.method} ${req.originalUrl} 요청 from ${req.ip}`)
  next()
})
// ✅ 마지막 SPA fallback
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
