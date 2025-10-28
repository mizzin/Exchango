const jwt = require('jsonwebtoken');
const logger = require('../utils/logger'); // 로그 파일 사용

// 사용자 인증 미들웨어
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '토큰이 없습니다.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // ⏰ 토큰 만료 로그를 WARN으로 처리 (stack trace 없이 한 줄만)
    if (err.name === 'TokenExpiredError') {
      logger.warn(`⏰ 토큰 만료: ${req.method} ${req.originalUrl} from ${req.ip}`);
      return res.status(401).json({ message: '토큰이 만료되었습니다.' });
    }

    // ⚠️ 나머지 JWT 오류는 일반 에러 로그
    logger.error(`❌ JWT 검증 실패: ${err.message}`);
    return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

// 관리자 전용 미들웨어
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '관리자 전용 접근입니다.' });
  }
  req.admin = req.user;
  next();
};
