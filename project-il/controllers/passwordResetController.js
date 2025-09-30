const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const db = require('../db')
const { sendMail }= require('../utils/mailer')


// 🔹 토큰/로그 유틸
async function createResetToken(userId, ip, ua) {
  const raw = crypto.randomBytes(32).toString('hex')
  const hash = crypto.createHash('sha256').update(raw).digest('hex')

  await db.query(
    `INSERT INTO password_reset_tokens 
      (user_id, token_hash, expires_at, ip, ua)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), ?, ?)`,
    [userId, hash, ip || null, ua || null]
  )
  return raw
}

async function logReset(userId, event, ip, ua) {
  await db.query(
    `INSERT INTO password_reset_logs (user_id, event, ip, ua) VALUES (?, ?, ?, ?)`,
    [userId || null, event, ip || null, ua || null]
  )
}

// 🔹 1) 비번 재설정 메일 발송
exports.forgotPassword = async (req, res) => {

  const { username, email } = req.body
  const ip = req.ip
  const ua = req.headers['user-agent']

  if (!username || !email) {
    return res.status(400).json({ message: '아이디와 이메일을 입력해주세요.' })
  }

  try {
    const [rows] = await db.query(
      `SELECT id FROM users WHERE username = ? AND email = ? LIMIT 1`,
      [username, email]
    )
    if (rows.length === 0) {
      return res.json({ message: '재설정 링크를 이메일로 보냈습니다(존재 시).' })
    }

    const userId = rows[0].id
    const token = await createResetToken(userId, ip, ua)
    const resetUrl = `${process.env.FRONTEND_BASE_URL}/reset-password?token=${token}`

    const subject = '[Exchango] 비밀번호 재설정 안내'
    const html = `
      <p>아래 링크에서 새 비밀번호를 설정하세요 (15분 이내, 1회용).</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>본인이 요청하지 않았다면 이 메일은 무시하셔도 됩니다.</p>
    `

    await sendMail(email, subject, html)
    await logReset(userId, 'request', ip, ua)

    res.json({ message: '재설정 링크를 이메일로 보냈습니다.' })
  } catch (err) {
    console.error('forgotPassword error:', err)
    res.status(500).json({ message: '서버 오류' })
  }
}

// 🔹 2) 토큰 검증
exports.verifyResetToken = async (req, res) => {
  const { token } = req.query
  if (!token) return res.status(400).json({ message: '토큰이 필요합니다.' })

  const hash = crypto.createHash('sha256').update(token).digest('hex')
  const [rows] = await db.query(
    `SELECT user_id FROM password_reset_tokens
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
     LIMIT 1`,
    [hash]
  )
  if (rows.length === 0) {
    return res.status(400).json({ valid: false })
  }
  res.json({ valid: true })
}

// 🔹 3) 새 비번 저장
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body
  if (!token || !newPassword) {
    return res.status(400).json({ message: '토큰과 새 비밀번호가 필요합니다.' })
  }

  try {
    const hash = crypto.createHash('sha256').update(token).digest('hex')
    const [rows] = await db.query(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
       LIMIT 1`,
      [hash]
    )
    if (rows.length === 0) {
      return res.status(400).json({ message: '토큰이 유효하지 않거나 만료되었습니다.' })
    }

    const { id: tokenId, user_id } = rows[0]
    const hashedPw = await bcrypt.hash(newPassword, 10)

    await db.query(`UPDATE users SET password = ? WHERE id = ?`, [hashedPw, user_id])
    await db.query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?`, [tokenId])

    res.json({ message: '비밀번호가 재설정되었습니다.' })
  } catch (err) {
    console.error('resetPassword error:', err)
    res.status(500).json({ message: '서버 오류' })
  }
}
