// controllers/userController.js
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const messageModel = require('../models/messageModel');
const jwt = require('jsonwebtoken');
console.log('📦 userController 시작');

const db = require('../db');

exports.getUsers = async (req, res) => {
  const users = await userModel.getAllUsers();
  res.json(users);
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  await userModel.updateUser(id, req.body);
  res.sendStatus(204);
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await userModel.deleteUserById(id);
    res.json({ message: `User with id ${id} deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await userModel.getUserById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.checkUsername = async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: "아이디를 입력해주세요." });
  }

  const existingUser = await userModel.findUserByUsername(username);

  if (existingUser) {
    return res.json({ available: false, message: "이미 사용 중인 아이디입니다." });
  }

  res.json({ available: true });
};

//회원가입 API
exports.register = async (req, res) => {
  const {
    username, password, email,
    phone, country_code, real_name,
    referral_id, language,
    platforms, money_password   
  } = req.body;

// 1. 필수값 확인
  if (!username || !password || !email || !phone) {
    return res.status(400).json({ message: 'Required field missing' });
  }

 // 2. 아이디 중복 체크
  const existingUser = await userModel.findUserByUsername(username);
  if (existingUser) {
    return res.status(409).json({ message: 'This ID is already in use.' });
  }

   // 3. 이메일 중복 체크
  const [existingEmail] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existingEmail.length > 0) {
    return res.status(409).json({ message: 'This email address has already been registered.' });
  }

  // 4. 이메일 인증 여부 확인
  const [verification] = await db.query(
    'SELECT code, expires_at FROM email_verifications WHERE email = ?',
    [email]
  );

  if (verification.length === 0) {
    return res.status(400).json({ message: 'Email verification is required.' });
  }

  const { expires_at } = verification[0];
  if (new Date() > new Date(expires_at)) {
    return res.status(400).json({ message: 'Email verification has expired.' });
  }

  // 5. 추천인 유효성 확인 (선택)
  if (referral_id) {
    const refUser = await userModel.findUserByUsername(referral_id);
    if (!refUser) {
      return res.status(400).json({ message: 'Invalid referral ID.' });
    }
  }
  // ✅ ② 머니 비밀번호 필수 체크 (6자리 숫자)
  if (!/^\d{6}$/.test(money_password)) {
    return res.status(400).json({ message: 'Money password must be exactly 6 digits.' });
  }
  // 6. 비밀번호 해싱
  const hashed = await bcrypt.hash(password, 10);

  // ✅ ③ 머니 비밀번호도 해싱
  const hashedMoneyPassword = await bcrypt.hash(money_password, 10);
  try {
    // 7. 사용자 생성 0630
    const userId = await userModel.createUser({
      username,
      password: hashed,
      email,
      phone,
      country_code,
      real_name: real_name || null,
      referral_id: referral_id || null,
      language,
      money_password: hashedMoneyPassword
    });

    // 8. 플랫폼 정보 저장 (platforms가 있을 때만)
    if (Array.isArray(platforms) && platforms.length > 0) {
      await userModel.insertUserPlatforms(userId, platforms);
    }


    // 9. 인증 기록 삭제 (선택)
    await db.query('DELETE FROM email_verifications WHERE email = ?', [email]);

    res.status(201).json({ message: 'Membership registration successful! This is an emergency measure.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'server error', error: err.message });
  }
};

//로그인 API
exports.login = async (req, res) => {
  const { username, password } = req.body; 
 // 필수 입력 체크
  if (!username || !password) {
    return res.status(400).json({ message: '아이디와 비밀번호를 입력해주세요.' });
  }

  const user = await userModel.findUserByUsernameWithPassword(username);
 
// 1. 사용자 존재 여부
if (!user) {
  return res.status(401).json({ message: "Invalid ID or password." });
}
// 2. 비밀번호 비교
const match = await bcrypt.compare(password, user.password);
if (!match) {
  return res.status(401).json({ message: "Invalid ID or password." });
}
// 3. 블럭처리 계정
if (user.status === 'blocked') {
  return res.status(403).json({ message: 'This account has been blocked. Please contact the administrator.' });
}
// 4. 거절된 계정
if (user.status === 'rejected') {
  return res.status(403).json({ message: `Registration was rejected. (${user.rejected_reason  || 'No reason provided'})` });
}
// 5. 계정 승인 여부 
if (user.status !== 'approved') {
  return res.status(403).json({ message: "Your account is pending admin approval." });
}



  // JWT 토큰 생성
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role},
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  // 로그인 성공 시
  res.json({
  token,
  role: user.role,         // ← 이 부분 추가!
  status: user.status      // 혹시나 상태도 쓸 경우 포함
});
};

// controllers/getUserInfo .js 0630
exports.getUserInfo = async (req, res) => {
  const userId = req.user.id
  const lang = req.query.lang || 'En'

  try {
    // 사용자 정보 + 잔액 조회
    const [userRows] = await db.query(
      `SELECT 
         u.id, u.username, u.real_name, u.referral_id, 
         u.warning_count, u.language, u.bank_name, u.bank_account,
         ub.balance
       FROM users u
       LEFT JOIN user_balances ub ON u.id = ub.user_id
       WHERE u.id = ?`,
      [userId]
    )

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const user = userRows[0]

    // 연결된 플랫폼 목록 조회
    const [platforms] = await db.query(
      `SELECT 
         up.platform_id, 
         pt.name AS platform_name,
         up.platform_user_id
       FROM user_platforms up
       JOIN platform_translations pt
         ON up.platform_id = pt.platform_id AND pt.language = ?
       WHERE up.user_id = ?`,
      [lang, userId]
    )

    user.platforms = platforms

    res.json(user)
  } catch (err) {
    console.error('❌ 사용자 정보 조회 실패:', err)
    res.status(500).json({ message: '사용자 정보를 불러오지 못했습니다.' })
  }
}

//회원가입 API
exports.register = async (req, res) => {
  const {
    username, password, email,
    phone, country_code, real_name,
    referral_id, language,
    platforms, money_password   
  } = req.body;

// 1. 필수값 확인
  if (!username || !password || !email || !phone) {
    return res.status(400).json({ message: 'Required field missing' });
  }

 // 2. 아이디 중복 체크
  const existingUser = await userModel.findUserByUsername(username);
  if (existingUser) {
    return res.status(409).json({ message: 'This ID is already in use.' });
  }

   // 3. 이메일 중복 체크
  const [existingEmail] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existingEmail.length > 0) {
    return res.status(409).json({ message: 'This email address has already been registered.' });
  }

  // 4. 이메일 인증 여부 확인
  const [verification] = await db.query(
    'SELECT code, expires_at FROM email_verifications WHERE email = ?',
    [email]
  );

  if (verification.length === 0) {
    return res.status(400).json({ message: 'Email verification is required.' });
  }

  const { expires_at } = verification[0];
  if (new Date() > new Date(expires_at)) {
    return res.status(400).json({ message: 'Email verification has expired.' });
  }

  // 5. 추천인 유효성 확인 (선택)
  if (referral_id) {
    const refUser = await userModel.findUserByUsername(referral_id);
    if (!refUser) {
      return res.status(400).json({ message: 'Invalid referral ID.' });
    }
  }
  // ✅ ② 머니 비밀번호 필수 체크 (6자리 숫자)
  if (!/^\d{6}$/.test(money_password)) {
    return res.status(400).json({ message: 'Money password must be exactly 6 digits.' });
  }
  // 6. 비밀번호 해싱
  const hashed = await bcrypt.hash(password, 10);

  // ✅ ③ 머니 비밀번호도 해싱
  const hashedMoneyPassword = await bcrypt.hash(money_password, 10);
  try {
    // 7. 사용자 생성
    const userId = await userModel.createUser({
      username,
      password: hashed,
      email,
      phone,
      country_code,
      real_name: real_name || null,
      referral_id: referral_id || null,
      language,
      money_password: hashedMoneyPassword
    });

    // 8. 플랫폼 정보 저장 (platforms가 있을 때만)
    if (Array.isArray(platforms) && platforms.length > 0) {
      await userModel.insertUserPlatforms(userId, platforms);
    }


    // 9. 인증 기록 삭제 (선택)
    await db.query('DELETE FROM email_verifications WHERE email = ?', [email]);

    res.status(201).json({ message: 'Membership registration successful! This is an emergency measure.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'server error', error: err.message });
  }
};

// 비밀번호 변경
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: '현재 비밀번호와 새 비밀번호를 입력해주세요.' });
  }

  try {
    const user = await userModel.findUserByIdWithPassword(userId);

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: '현재 비밀번호가 일치하지 않습니다.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(userId, hashed);

    res.json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (err) {
    console.error('❌ 비밀번호 변경 오류:', err);
    res.status(500).json({ message: '서버 오류로 비밀번호 변경에 실패했습니다.' });
  }
};

// 출금 비밀번호 변경0630
exports.changeMoneyPassword = async (req, res) => {
  const userId = req.user.id
  const { currentPassword, newPassword } = req.body

  try {
    // 사용자 정보 조회
    const [users] = await db.query('SELECT money_password FROM users WHERE id = ?', [userId])
    if (users.length === 0) return res.status(404).json({ code: 'user_not_found' })

    const user = users[0]

    // 기존 비밀번호 확인
    const isMatch = await bcrypt.compare(currentPassword, user.money_password || '')
    if (!isMatch) return res.status(400).json({ code: 'money_password_incorrect' })

    // 새 비밀번호 암호화
    const hashed = await bcrypt.hash(newPassword, 10)
    await db.query('UPDATE users SET money_password = ? WHERE id = ?', [hashed, userId])

    res.json({ message: 'success' })
  } catch (err) {
    console.error('❌ 출금 비밀번호 변경 실패:', err)
    res.status(500).json({ code: 'server_error' })
  }
}

//사용자 정보 불러오기0630
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id

    const [userRows] = await db.query(
       `SELECT id, username, real_name, bank_name, bank_account 
       FROM users 
       WHERE id = ?`,
      [userId]
    )

    const [platformRows] = await db.query(
       'SELECT platform_id, platform_user_id FROM user_platforms WHERE user_id = ?',
      [userId]
    )
    

    const platformMap = {}
    platformRows.forEach(row => {
      platformMap[row.platform_id] = row.platform_user_id
    })

    res.json({
      id: userRows[0].id,
      username: userRows[0].username,
      bank_name: userRows[0].bank_name,
      bank_account: userRows[0].bank_account,
      platform_ids: platformMap
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
// controllers/updateBankInfo.js 0630
exports.updateBankInfo = async (req, res) => {
  const { id } = req.params
  const userIdFromToken = req.user.id

  // 자기 자신만 수정 가능하게 제한
  if (parseInt(id) !== userIdFromToken) {
    return res.status(403).json({ message: 'You are not authorized to update this user.' })
  }

  const { real_name, bank_name, bank_account } = req.body

  try {
    // 현재 사용자 정보 조회
    const user = await userModel.getUserById(id)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    // 실명이 이미 있는 경우, 덮어쓰지 않음
    const updatedRealName = user.real_name ? user.real_name : real_name

    await userModel.updateBankInfo(id, {
      real_name: updatedRealName,
      bank_name,
      bank_account
    })

    res.json({ message: 'Bank info updated successfully.' })
  } catch (err) {
    console.error('❌ Bank info update error:', err)
    res.status(500).json({ message: 'Failed to update bank info.' })
  }
}

// 사용자용 공지사항 전체 조회 (언어 필터 + limit 지원)
exports.getPublicNotices = async (req, res) => {
  try {
    const lang = req.query.lang || req.headers['accept-language']?.split(',')[0].slice(0,2) || 'ko'
    const limit = parseInt(req.query.limit) || 10

    const [rows] = await db.query(
      `SELECT id, title, created_at 
       FROM notices 
       WHERE language = ?
       ORDER BY created_at DESC 
       LIMIT ?`,
      [lang, limit]
    )

    res.json({ notices: rows })
  } catch (err) {
    console.error('❌ 공지사항 조회 실패:', err)
    res.status(500).json({ message: '공지사항을 불러오지 못했습니다.' })
  }
}

// 사용자용 공지사항 상세 조회
exports.getPublicNoticeById = async (req, res) => {
  try {
    const { id } = req.params
    const notice = await userModel.getNoticeById(id)
    if (!notice) return res.status(404).json({ message: '공지사항을 찾을 수 없습니다.' })

    const lang = notice.language  // ✅ 현재 공지의 언어로 prev/next 필터링
    const prev = await userModel.getPrevNotice(id, lang)
    const next = await userModel.getNextNotice(id, lang)

    res.json({ notice, prev, next })
  } catch (err) {
    console.error('❌ 공지사항 상세 실패:', err)
    res.status(500).json({ message: '공지사항을 불러오지 못했습니다.' })
  }
}
// 질문하기0701
exports.createInquiry = async (req, res) => {
  const { category, title, content } = req.body;
  const userId = req.user.id; // JWT에서 추출

  try {
    // 답변되지 않은 문의가 있는지 확인
    const [existing] = await db.query(`
      SELECT id FROM inquiries
      WHERE user_id = ? AND status != 'answered'
    `, [userId]);

    if (existing.length > 0) {
      return res.status(400).json({
        message: 'inquiry.error.pending_exists'
      });
    }

    // 문의 등록
    await db.query(`
      INSERT INTO inquiries (user_id, category, title, content)
      VALUES (?, ?, ?, ?)
    `, [userId, category, title, content]);

    res.status(201).json({ message: 'inquiry.success.created' });
  } catch (err) {
    res.status(500).json({ error: 'DB 오류', details: err.message });
  }
};
//0701답변 안 된 문의가 있으면 이동 막고 안내문 띄우기
exports.checkPendingInquiry = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      'SELECT id FROM inquiries WHERE user_id = ? AND status != "answered" LIMIT 1',
      [userId]
    );

    if (rows.length > 0) {
      return res.json({ hasPending: true });
    } else {
      return res.json({ hasPending: false });
    }
  } catch (err) {
    res.status(500).json({ error: 'DB error', details: err.message });
  }
};

exports.getUserInquiries = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(`
      SELECT id, category, title, status, created_at
      FROM inquiries
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [userId]);

    res.json(rows);
  } catch (err) {
    console.error('문의 목록 불러오기 실패:', err);
    res.status(500).json({ error: 'DB 오류', details: err.message });
  }
};
exports.getInquiryById = async (req, res) => {
  const inquiryId = req.params.id;
  const userId = req.user.id;
console.log('req.user:', req.user)

  try {
    const [[inquiry]] = await db.query(`
      SELECT i.*, 
        (SELECT answer FROM inquiry_answers WHERE inquiry_id = i.id LIMIT 1) AS answer
      FROM inquiries i
      WHERE i.id = ? AND i.user_id = ?
    `, [inquiryId, userId]);

    if (!inquiry) {
      return res.status(404).json({ error: '문의가 존재하지 않거나 접근 권한이 없습니다.' });
    }

    res.json(inquiry);
  } catch (err) {
    console.error('문의 상세 조회 실패:', err);
    res.status(500).json({ error: 'DB 오류', details: err.message });
  }
};
// 충전출금 내지갑 이력 0721
exports.getWalletTransactions = async (req, res) => {
  const userId = req.user.id;

  try {
    const [transactions] = await db.query(`
      SELECT 
        id, type, currency, amount, krw_amount, status, created_at, updated_at
      FROM transactions
      WHERE user_id = ?
        AND type IN ('wallet_charge', 'wallet_withdraw', 'deduct')

      UNION ALL

      SELECT 
        id, 'platform_move' AS type, NULL AS currency, amount, NULL AS krw_amount,
        status, created_at, updated_at
      FROM site_transactions
      WHERE user_id = ?
        AND type = 'platform_move'
        AND from_type = 'wallet'

      ORDER BY created_at DESC
    `, [userId, userId]);

    res.json({ transactions });
  } catch (error) {
    console.error('❌ [getWalletTransactions] 에러:', error);
    res.status(500).json({ message: 'Failed to load wallet transactions.' });
  }
};


