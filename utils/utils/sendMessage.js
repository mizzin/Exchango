//utils/sendMessage.js

const db = require('../db')
const ADMIN_ID = 1

module.exports = async ({ to_user_id, subject, content, type = 'manual', from_user_id = null }) => {
    const senderId = from_user_id !== null ? from_user_id : (type === 'system' ? ADMIN_ID : null)
  await db.query(
    `INSERT INTO messages (from_user_id, to_user_id, subject, content, type, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())`,
    [senderId, to_user_id, subject, content, type]
  )
}
