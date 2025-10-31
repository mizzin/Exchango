// controllers/userController.js
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const messageModel = require('../models/messageModel');
const jwt = require('jsonwebtoken');
console.log('📦 userController 시작');

const sendTelegramMessage = require('../utils/telegram')
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


//로그인 API
exports.login = async (req, res) => {
  const { username, password } = req.body; 
if (!username || !password ) {
  console.log("❌ 필수값 누락:", { username, password });
  return res.status(400).json({ message: 'Required field missing' });
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
    { expiresIn: '1h' }
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
         u.warning_count, u.language, u.bank_name, u.bank_account,  u.wallet_address, u.peso_account_type, u.peso_account,
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

  console.log("➡️ 회원가입 요청 수정수정:", req.body);

  // 1. 필수값 확인
  if (!username || !password || !email || !phone) {
    return res.status(400).json({ message: 'Required field missing' });
  }

  try {
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
    const [rows] = await db.query(
      'SELECT verified, expires_at FROM email_verifications WHERE email = ?',
      [email]
    );
    if (rows.length === 0 || rows[0].verified !== 1) {
      return res.status(400).json({ message: 'Email verification is required.' });
    }
    if (new Date() > new Date(rows[0].expires_at)) {
      return res.status(400).json({ message: 'Email verification has expired.' });
    }

    // 5. 추천인 유효성 확인 (선택)
    if (referral_id) {
      const refUser = await userModel.findUserByUsername(referral_id);
      if (!refUser) {
        return res.status(400).json({ message: 'Invalid referral ID.' });
      }
    }

    // 6. 비밀번호 해싱
    const hashed = await bcrypt.hash(password, 10);
    const hashedMoneyPassword = await bcrypt.hash(money_password, 10);

    // ✅ 트랜잭션 시작
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 7. 사용자 생성
      const [result] = await conn.execute(
        `INSERT INTO users (
          username, password, email, phone, country_code,
          real_name, referral_id, language, money_password
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          username,
          hashed,
          email,
          phone,
          country_code || null,
          real_name || null,
          referral_id || null,
          language || 'en',
          hashedMoneyPassword
        ]
      );
      const userId = result.insertId;

      // 8. 플랫폼 정보 저장
      if (Array.isArray(platforms) && platforms.length > 0) {
        for (const p of platforms) {
          await conn.execute(
            `INSERT INTO user_platforms (user_id, platform_id, platform_user_id)
             VALUES (?, ?, ?)`,
            [userId, p.platform_id, p.platform_user_id]
          );
        }
      }

      // 9. 이메일 인증 기록 삭제
      await conn.execute('DELETE FROM email_verifications WHERE email = ?', [email]);

      // ✅ 커밋
      await conn.commit();
      res.status(201).json({ message: 'Membership registration successful!' });

// ✅ 회원가입 축하 쪽지 전송
try {
  const [[template]] = await db.query(
    'SELECT content FROM message_templates WHERE template_key = ?',
    ['welcome_message'] // 템플릿 키 이름만 따로 정하면 됨
  )

  if (template) {
    const content = template.content
      .replace('{{nickname}}', username)

    await sendMessage({
      to_user_id: userId,
      subject: '🎉 Welcome to Tranasia!',
      content,
      type: 'system',
    })
  }
} catch (msgErr) {
  console.error('⚠️ 쪽지 전송 실패:', msgErr.message)
}
    // 📢 텔레그램 알림 보내기
    try {
      await sendTelegramMessage(
       `[회원가입]\n아이디: ${username}\n이메일: ${email}\n전화번호: ${phone}\n언어국가 ${language}`
      );
      } catch (notifyErr) {
        console.error("⚠️ Telegram 전송 실패:", notifyErr.message);
      }


    } catch (txErr) {
      await conn.rollback(); // 실패 시 롤백
      console.error("❌ 트랜잭션 에러:", txErr);
      res.status(500).json({ message: 'Server error', error: txErr.message });
    } finally {
      conn.release(); // 연결 반환
    }

  } catch (err) {
    console.error("❌ 회원가입 처리 에러:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
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
       `SELECT id, username, real_name, bank_name, bank_account,  wallet_address
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

  if (parseInt(id) !== userIdFromToken) {
    return res.status(403).json({ message: 'You are not authorized to update this user.' })
  }

  const { real_name, bank_name, bank_account, wallet_address,peso_account_type, peso_account } = req.body

  try {
    const user = await userModel.getUserById(id)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    const updatedRealName = user.real_name ? user.real_name : real_name

    // ✅ 빈 값이 아닌 필드만 업데이트
    await userModel.updateBankInfo(id, {
      real_name: updatedRealName || user.real_name,
      bank_name: bank_name ?? user.bank_name,
      bank_account: bank_account ?? user.bank_account,
      wallet_address: wallet_address ?? user.wallet_address,
      peso_account_type: peso_account_type ?? user.peso_account_type,
      peso_account: peso_account ?? user.peso_account 
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

    // 📢 여기서 텔레그램 알림 전송!
    await sendTelegramMessage(
      `[1:1 문의]\n유저ID: ${userId}\n카테고리: ${category}\n제목: ${title}\n내용: ${content}`
    );


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
  t.id,
  t.type,
  t.currency,
  t.amount,
  t.bonus_amount,            -- ✅ 실제 이벤트 금액 컬럼 추가
  ub.balance AS reflected_balance,   -- ✅ 누적 지갑 잔액 (참고용)
  t.krw_amount,
  t.status,
  t.created_at,
  t.updated_at
FROM transactions t
LEFT JOIN user_balances ub ON t.user_id = ub.user_id
WHERE t.user_id = ?
  AND t.type IN ('wallet_charge', 'wallet_withdraw', 'deduct')

UNION ALL

SELECT 
  s.id,
  'platform_move' AS type,
  NULL AS currency,
  s.amount,
  NULL AS bonus_amount,      -- ✅ 컬럼 수 맞추기용
  ub.balance AS reflected_balance,
  NULL AS krw_amount,
  s.status,
  s.created_at,
  s.updated_at
FROM site_transactions s
LEFT JOIN user_balances ub ON s.user_id = ub.user_id
WHERE s.user_id = ?
  AND s.type = 'platform_move'
  AND s.from_type = 'wallet'

ORDER BY created_at DESC

    `, [userId, userId]);
 
    res.json({ transactions });
  } catch (error) {
    console.error('❌ [getWalletTransactions] 에러:', error);
    res.status(500).json({ message: 'Failed to load wallet transactions.' });
  }
};



// GET /users/me/transactions
// 신청조회. 두번 신청 차단
// 신청 조회 - 두 번 신청 방지용
exports.getMyTransactions = async (req, res) => {
  try {
    const userId = req.user?.id
    const status = req.query.status


    if (!userId) return res.status(400).json({ message: '유저 정보 없음' })

    // ✅ query와 params 선언
    let query = 'SELECT * FROM transactions WHERE user_id = ?'
    const params = [userId]

    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }

    console.log('🧾 최종 SQL 쿼리:', query)
    console.log('📦 파라미터:', params)

    const [rows] = await db.query(query, params)
    res.json({ transactions: rows })
  } catch (err) {
    console.error('❌ Error in getMyTransactions:', err)
    res.status(500).json({ message: '서버 오류', error: err.message })
  }
}

// GET /users/me/wallet-address 지갑조회
exports.getWalletAddress = async (req, res) => {
  try {
    const userId = req.user?.id
    const [rows] = await db.execute(
      'SELECT wallet_address FROM users WHERE id = ?',
      [userId]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ wallet_address: rows[0].wallet_address || null })
  } catch (error) {
    console.error('❌ getWalletAddress Error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// PATCH /users/me/wallet-address  지갑등록 및 수정
exports.updateWalletAddress = async (req, res) => {
  try {
    const userId = req.user?.id
    const { wallet_address } = req.body

    if (!wallet_address || wallet_address.trim() === '') {
      return res.status(400).json({ message: 'Wallet address is required' })
    }

    await db.execute(
      'UPDATE users SET wallet_address = ? WHERE id = ?',
      [wallet_address.trim(), userId]
    )

    res.json({ message: 'Wallet address updated successfully' })
  } catch (error) {
    console.error('❌ updateWalletAddress Error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}