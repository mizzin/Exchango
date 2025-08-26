const db = require('../db');

// 받은 쪽지 목록 조회
exports.getUserMessages = async (req, res) => {
  const userId = req.user.id
  try {
    const [rows] = await db.query(`
      SELECT m.*, u.username AS from_username
      FROM messages m
      JOIN users u ON m.from_user_id = u.id
      WHERE m.to_user_id = ?
      ORDER BY m.created_at DESC
    `, [userId])
    res.json({ messages: rows })
  } catch (err) {
    console.error('❌ 받은 쪽지 목록 오류:', err)
    res.status(500).json({ message: '쪽지 목록 불러오기 실패' })
  }
}

// 쪽지 상세 조회 + 읽음 처리
exports.readMessage = async (req, res) => {
  const messageId = req.params.id
  const userId = req.user.id
  console.log('📩 읽음 처리 시작')
  try {
    const [rows] = await db.query(`
      SELECT * FROM messages WHERE id = ? AND to_user_id = ?
    `, [messageId, userId])

    if (rows.length === 0) {
      return res.status(404).json({ message: '쪽지를 찾을 수 없습니다.' })
    }

    await db.query(`UPDATE messages SET is_read = true WHERE id = ?`, [messageId])
    res.json({ message: rows[0] })
  } catch (err) {
    console.error('❌ 쪽지 읽기 실패:', err)
    res.status(500).json({ message: '쪽지 읽기 중 오류 발생' })
  }
}
// controllers/messageController.js
exports.getMessageTemplates = async (req, res) => {
  const [rows] = await db.query(`
    SELECT * FROM message_templates 
    WHERE template_key IN ('recharge_guide_krw', 'recharge_guide_php', 'recharge_guide_usdt')
  `)
  res.json({ templates: rows })
}
