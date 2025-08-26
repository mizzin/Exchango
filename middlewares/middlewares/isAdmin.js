exports.checkAdmin = (req, res, next) => {
  console.log('[DEBUG] role:', req.user.role);  // 여기서 admin인지 확인
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
    }
    next();
  };
  