const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ✅ users 라우터 연결
const userRoutes = require('./routes/user');
app.use('/users', userRoutes);
// ✅ 다국어
const platformRoutes = require('./routes/platformRoutes')
app.use('/api/platforms', platformRoutes)

// ✅ users ＡＰＩ연결
const exchangeRoute = require('./routes/exchange');
app.use('/exchange-rate', exchangeRoute);
//0724
const exchangeRateRouter = require('./routes/exchangeRate');
app.use('/api/exchange-rate', exchangeRateRouter); 
 
const transactionRoutes = require('./routes/transaction');
app.use('/api/transactions', transactionRoutes);

//이메일 중복 확인 + 인증 코드 생성 API
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const uploadRoutes = require('./routes/upload')
app.use('/api/upload', uploadRoutes)

const path = require('path')
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')))


// ✅ admin 라우터 연결 전 로그 
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});


