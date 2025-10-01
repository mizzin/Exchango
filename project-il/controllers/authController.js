const db = require('../db');
//이메일 인증 코드 생성 AP
const { sendVerificationEmail } = require('../utils/mail');

exports.sendEmailCode = async (req, res) => {
  const { email, lang = 'en' } = req.body; 

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    // 이메일 중복 확인 (회원가입된 사용자 기준)
    const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length > 0) {
      return res.status(400).json({ message: 'Email already in use.' });
    }

    // 인증 코드 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5분 유효

    // email_verifications 테이블에 저장 (중복이면 업데이트)
    await db.query(`
      INSERT INTO email_verifications (email, code, expires_at)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      code = VALUES(code), 
      expires_at = VALUES(expires_at),
          created_at = CURRENT_TIMESTAMP

    `, [email, code, expiry]);
  await sendVerificationEmail(email, code, lang); //
    // 메일 발송은 추후에, 지금은 콘솔 출력
    console.log(`📨 [DEBUG] 인증 코드 for ${email}: ${code}`);

    return res.status(200).json({ message: 'Verification code sent (console only).' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
//이메일 인증 코드 확인 API
exports.verifyEmailCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required.' });
  }

  try {
    const [rows] = await db.query('SELECT code, expires_at FROM email_verifications WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Verification info not found. LIMIT 1' });
    }

    const { code: storedCode, expires_at } = rows[0];

    if (new Date() > new Date(expires_at)) {
      return res.status(400).json({ message: 'Verification code expired.' });
    }

    if (code !== storedCode) {
      return res.status(400).json({ message: 'Incorrect code.' });
    }
    // ✅ 인증 성공 시 삭제 대신 verified=1로 업데이트
    await db.query(
      'UPDATE email_verifications SET verified = 1 WHERE email = ?',
      [email]
    );

    return res.status(200).json({ message: 'Email verified successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
