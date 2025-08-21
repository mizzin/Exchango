// middleware/authMiddleware.js
const jwt = require('jsonwebtoken')

// 사용자 인증 미들웨어
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '토큰이 없습니다.' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    //console.log('[DEBUG] 디코딩된 사용자:', decoded);
    next()  
  } catch (err) {
    console.error('[ERROR] 토큰 오류:', err)
    return res.status(403).json({ message: '유효하지 않은 토큰입니다.' })
  }
}

// 관리자 전용 미들웨어
exports.isAdmin = (req, res, next) => {
//console.log('🛡️ ADMIN CHECK:', req.user)
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '관리자 전용 접근입니다.' })
  }
  next()  // 관리자라면 다음 미들웨어로 넘어가기
}
