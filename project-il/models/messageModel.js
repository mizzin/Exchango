const db = require('../db');
// 쪽지함 조회
exports.createMessage = async ({ from_user_id, to_user_id, subject, content, language, type = 'normal' }) => {
  const [result] = await db.query(
    `INSERT INTO messages (from_user_id, to_user_id, subject, content, language, type, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, false, NOW())`,
    [from_user_id, to_user_id, subject, content, language, type]
  );
  return result.insertId;
};

// 받은 쪽지 목록 (최신순)
exports.getMessagesForUser = async (userId) => {
    const [rows] = await db.query(
      `SELECT id, from_user_id, subject, content, language, is_read, created_at, type
       FROM messages
       WHERE to_user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  };
  