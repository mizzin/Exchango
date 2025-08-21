const db = require('../db');

// 현재 유저의 최신 그룹 번호 가져오기
exports.getCurrentResetGroup = async (userId) => {
  const [[result]] = await db.query(
    'SELECT MAX(reset_group) AS max_group FROM warnings WHERE user_id = ?',
    [userId]
  );
  return result.max_group || 1;
};

// 경고 추가
exports.addWarning = async (userId, reason, severity, group) => {
  const [result] = await db.query(
    `INSERT INTO warnings (user_id, reason, severity, reset_group, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [userId, reason, severity, group]
  );
  return result.insertId;
};

// 현재 그룹의 누적 경고 수 가져오기
exports.getCurrentWarningCount = async (userId, group) => {
  const [[result]] = await db.query(
    `SELECT COUNT(*) AS count FROM warnings WHERE user_id = ? AND reset_group = ?`,
    [userId, group]
  );
  return result.count;
};

// 사용자 전체 경고 조회
exports.getWarningsByUser = async (userId) => {
    const [rows] = await db.query(
      `SELECT id, reason, severity, reset_group, created_at
       FROM warnings
       WHERE user_id = ?
       ORDER BY reset_group DESC, created_at DESC`,
      [userId]
    );
    return rows;
  };