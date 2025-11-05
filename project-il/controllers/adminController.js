const jwt = require('jsonwebtoken');
const adminModel = require('../models/adminModel');
const messageModel = require('../models/messageModel');
const warningModel = require('../models/warningModel');
const db = require('../db');
const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const toManilaTime = require('../utils/formatDate');
const logger = require('../utils/logger');


// 📊 관리자 통계 API
exports.getSummary = async (req, res) => {
  try {
    // 1️⃣ 총 승인된 사용자 수
   const [[{ totalUsers }]] = await db.query(`
  SELECT COUNT(*) AS totalUsers 
  FROM users 
  WHERE role = 'user' 
    AND status = 'approved'
    AND username NOT LIKE '%test%'
    AND username NOT LIKE '%admin%'
`);

    // 2️⃣ 오늘 신규 가입자 수
    const [[{ todayUsers }]] = await db.query(`
      SELECT COUNT(*) AS todayUsers FROM users 
      WHERE role = 'user' AND DATE(created_at) = CURDATE()
    `);

    // 3️⃣ 가입 대기자 수
    const [[{ pendingUsers }]] = await db.query(`
      SELECT COUNT(*) AS pendingUsers FROM users WHERE status = 'pending'
    `);

    // 4️⃣ 대기 중 충전 신청 수 (내지갑 + 플랫폼 둘 다 포함)
    const [[{ pendingRecharge }]] = await db.query(`
      SELECT COUNT(*) AS pendingRecharge 
      FROM transactions 
      WHERE type IN ('wallet_charge', 'platform_charge')
      AND status = 'pending'
    `);

    // 5️⃣ 대기 중 출금 신청 수 (내지갑 + 플랫폼 둘 다 포함)
    const [[{ pendingWithdraw }]] = await db.query(`
      SELECT COUNT(*) AS pendingWithdraw 
      FROM transactions 
      WHERE type IN ('wallet_withdraw', 'platform_withdraw')
      AND status = 'pending'
    `);

    res.json({
      totalUsers,
      todayUsers,
      pendingUsers,
      pendingRecharge,
      pendingWithdraw,
    });
  } catch (err) {
    console.error('📊 관리자 통계 에러:', err);
    res.status(500).json({ message: '통계를 불러오지 못했습니다.' });
  }
};


exports.login = async (req, res) => {
  const { username, password } = req.body;
  const admin = await userModel.findUserByUsernameWithPassword(username);

  if (!admin || admin.role !== 'admin') {
    return res.status(403).json({ error: '관리자 전용 로그인입니다.' });
  }

  if (!admin || admin.password !== password) {
    return res.status(401).json({ error: '잘못된 로그인 정보' });
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username, role: admin.role }, 
    process.env.JWT_SECRET, {
    expiresIn: '2h',
  });

  console.log('🧪 관리자 로그인 성공:', admin);

  res.json({ token, message: '로그인 성공' });
};  
// 전체 사용자 목록 (페이징 지원)
// ✅ controllers/adminController.js (getAllUsers)
exports.getAllUsers = async (req, res) => {
  const {
    username, status, startDate, endDate,
    warningOnly, platform, referral_id,wallet_address, 
    page = 1, limit = 15
  } = req.query;

  const conditions = [`u.role != 'admin'`];
  const values = [];

  if (username) {
    conditions.push('u.username LIKE ?');
    values.push(`%${username}%`);
  }
  if (status) {
    conditions.push('u.status = ?');
    values.push(status);
  }
  if (startDate && endDate) {
    conditions.push('u.created_at BETWEEN ? AND ?');
    values.push(startDate, endDate);
  }
  if (referral_id) {
    conditions.push('u.referral_id = ?');
    values.push(referral_id);
  }  
   if (wallet_address) {
      sql += ' AND wallet_address LIKE ?'
      params.push(`%${wallet_address}%`)
    }
  if (warningOnly === 'true') {
    conditions.push('wcnt.warning_count >= 1');
  }
  if (platform) {
    conditions.push(`EXISTS (
      SELECT 1 FROM user_platforms up
      JOIN platform_translations pt ON up.platform_id = pt.platform_id
      WHERE up.user_id = u.id AND pt.language = ? AND pt.name = ?
    )`);
    values.push(req.query.lang || 'ko');
    values.push(platform);
  }

  const offset = (page - 1) * limit;
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const [users] = await db.query(
  `SELECT 
     u.*, 
     COALESCE(wcnt.warning_count, 0) as warning_count,
     COALESCE(ub.balance, 0) as balance        -- 💰 여기서 잔액도 같이!
   FROM users u
   LEFT JOIN (
     SELECT user_id, COUNT(*) as warning_count
     FROM warnings
     GROUP BY user_id
   ) wcnt ON u.id = wcnt.user_id
   LEFT JOIN user_balances ub ON u.id = ub.user_id    -- 💰 잔액 조인!
   ${whereClause}
   ORDER BY u.created_at DESC
   LIMIT ? OFFSET ?`,
  [...values, Number(limit), Number(offset)]
);

const formattedUsers = users.map(u => ({
  ...u,
  created_at: toManilaTime(u.created_at),
  updated_at: toManilaTime(u.updated_at)
}))
    const [[{ count }]] = await db.query(
      `SELECT COUNT(DISTINCT u.id) as count
       FROM users u
       LEFT JOIN (
         SELECT user_id, COUNT(*) as warning_count
         FROM warnings
         GROUP BY user_id
       ) wcnt ON u.id = wcnt.user_id
       ${whereClause}`,
      values
    );

    res.json({
      users : formattedUsers,
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error('❌ 사용자 목록 조회 실패:', err);
    res.status(500).json({ message: '사용자 목록 조회에 실패했습니다.' });
  }
};

// ✅ controllers/commonController.js (getPlatformNamesForFilter)
exports.getPlatformNamesForFilter = async (req, res) => {
  const lang = req.query.lang || 'ko';
  try {
    const [rows] = await db.query(
      `SELECT DISTINCT name FROM platform_translations WHERE language = ? ORDER BY name`,
      [lang]
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ 플랫폼 이름 조회 실패:', err);
    res.status(500).json({ message: '플랫폼 목록 조회 실패' });
  }
};

// 단일 사용자 조회 0721// 단일 사용자 조회 0721
exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const [[user]] = await db.query(`
      SELECT id, username, email, phone, status, role,wallet_address, peso_account_type, peso_account ,
             real_name, bank_name, bank_account, referral_id, created_at, admin_note
      FROM users WHERE id = ?
    `, [id]);

    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

    // ⚠️ 보유 머니(balance) 불러오기
    try {
      const [[balanceRow]] = await db.query(`
        SELECT balance FROM user_balances WHERE user_id = ?
      `, [id]);

      user.balance = balanceRow ? Number(balanceRow.balance) : 0.00;
    } catch (err) {
      console.error('❌ 잔액 조회 실패:', err.message || err);
      user.balance = 0.00;
    }

    // ⚠️ 경고 수 불러오기
    try {
      const group = await warningModel.getCurrentResetGroup(Number(id));
      const count = await warningModel.getCurrentWarningCount(Number(id), group);
      user.warning_count = count;
    } catch (err) {
      console.error('❌ 경고 수 계산 실패:', err.message || err);
      user.warning_count = 0;
    }

    res.json({ user });

  } catch (err) {
    console.error('❌ 단일 사용자 조회 오류:', err.message || err);
    res.status(500).json({ message: '사용자 조회에 실패했습니다.' });
  }
};
// 관리자 메모 저장
exports.updateNote = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  try {
    const [result] = await db.query('UPDATE users SET admin_note = ? WHERE id = ?', [note, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    res.json({ message: '메모가 저장되었습니다.' });
  } catch (err) {
    console.error('❌ 관리자 메모 저장 오류:', err);
    res.status(500).json({ message: '서버 오류로 인해 메모 저장에 실패했습니다.' });
  }
};

// 가입 승인 대기 목록
exports.getPendingUsers = async (req, res) => {
  try {
    const [users] = await db.query("SELECT id, username, phone, status FROM users WHERE status = 'pending'");
    res.json(users);
  } catch (err) {
    console.error('❌ 가입 대기 사용자 조회 오류:', err);
    res.status(500).json({ message: '가입 대기자 조회에 실패했습니다.' });
  }
};

//회원승인
//회원승인
exports.approveUser = async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ 승인 처리
    const [result] = await db.query(
      'UPDATE users SET status = ? WHERE id = ?',
      ['approved', id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 2️⃣ 유저 정보 조회 (닉네임/언어용)
    const [[user]] = await db.query(
      'SELECT username, language FROM users WHERE id = ?',
      [id]
    );
  // 관리자 정보 (JWT에서 추출됨)
    const adminUsername = req.admin?.username || 'unknown_admin';

    // 로그 기록
    const now = new Date().toISOString().replace('T', ' ').split('.')[0];
    logger.info(`✅ [USER APPROVED] ${adminUsername} → ${user.username} (${now})`);

    // 3️⃣ 템플릿 가져오기
    const [[template]] = await db.query(
      'SELECT content FROM message_templates WHERE template_key = ?',
      ['welcome_message']
    );

    // 4️⃣ 쪽지 전송
    if (template) {
      const content = template.content.replace('{{nickname}}', user.username);

      await messageModel.createMessage({
        from_user_id: 1, // 시스템 관리자 ID (예: 1번 계정)
        to_user_id: id,
        subject: '🎉 Welcome to Tranasia!',
        content,
        language: user.language || 'en',
            });
    }

    // 5️⃣ 응답
    res.json({ message: '✅ 가입이 승인되었습니다.' });
  } catch (err) {
    console.error('❌ 사용자 승인 오류:', err);
    res.status(500).json({ message: '서버 오류로 가입 승인에 실패했습니다.' });
  }
};


//회원거절
exports.rejectUser = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body; // 선택: 거절 사유 받기

  try {
    await db.query('UPDATE users SET status = ?, rejected_reason = ? WHERE id = ?', ['rejected', reason || null, id]);
    res.json({ message: '❌ 회원가입이 거절되었습니다.' });
  } catch (err) {
    console.error('❌ 회원 거절 오류:', err);
    res.status(500).json({ message: '거절 처리에 실패했습니다.' });
  }
};
// 🚫 사용자 차단
exports.blockUser = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('UPDATE users SET status = ? WHERE id = ?', ['blocked', id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '😥 사용자를 찾을 수 없습니다.' });
    }

    res.json({ message: '🚫 사용자가 차단되었습니다.' });
  } catch (err) {
    console.error('❌ 사용자 차단 오류:', err);
    res.status(500).json({ message: '서버 오류로 인해 차단에 실패했습니다.' });
  }
};

// ✅ 사용자 차단 해제
exports.unblockUser = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('UPDATE users SET status = ? WHERE id = ?', ['approved', id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '😥 사용자를 찾을 수 없습니다.' });
    }

    res.json({ message: '✅ 사용자의 차단이 해제되었습니다.' });
  } catch (err) {
    console.error('❌ 사용자 차단 해제 오류:', err);
    res.status(500).json({ message: '서버 오류로 인해 차단 해제에 실패했습니다.' });
  }
};

// 📬 관리자 → 사용자 쪽지 보내기
exports.sendMessage = async (req, res) => {
  const { to_username, subject, content, language } = req.body;

  if (!to_username || !subject || !content) {
    return res.status(400).json({ message: '받는 사용자 ID, 제목, 내용을 모두 입력해주세요.' });
  }

  try {
      // 👇 사용자 정보 조회 추가
      const user = await userModel.findUserByUsername(to_username);
      if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
      }
  
    const msgId = await messageModel.createMessage({
      from_user_id: req.user.id, // 현재 로그인된 관리자
      to_user_id: user.id,
      subject,
      content,
      language: language || 'ko',
    });

    res.status(201).json({ message: '쪽지가 전송되었습니다.', message_id: msgId });
  } catch (err) {
    console.error('❌ 쪽지 전송 오류:', err);
    res.status(500).json({ message: '서버 오류로 쪽지 전송에 실패했습니다.' });
  }
};

exports.sendAllMessage = async (req, res) => {
  const adminId = req.user.id; // 로그인된 관리자 ID
  const { subject, content, language } = req.body;

  if (!subject || !content) {
    return res.status(400).json({ message: '제목과 내용을 모두 입력해주세요.' });
  }

  try {
    // 1️⃣ 전체 사용자 목록 조회
    const [users] = await db.query('SELECT id FROM users WHERE role = "user" AND status = "approved"');

    if (users.length === 0) {
      return res.status(404).json({ message: '등록된 사용자가 없습니다.' });
    }

    // 2️⃣ values 배열 생성
    const values = users.map(u => [
      adminId,
      u.id,
      subject,
      content,
      language || 'ko',
    ]);

    // 3️⃣ 다중 INSERT
    await db.query(
      `INSERT INTO messages (from_user_id, to_user_id, subject, content, language)
       VALUES ?`,
      [values]
    );

    res.status(201).json({ message: `전체 사용자(${users.length}명)에게 쪽지를 발송했습니다.` });
  } catch (err) {
    console.error('❌ 전체 쪽지 발송 오류:', err);
    res.status(500).json({ message: '전체 쪽지 발송 중 오류가 발생했습니다.' });
  }
};
// 🚨 사용자에게 경고 주기
exports.giveWarning = async (req, res) => {
  const { id: userId } = req.params;
  const { reason, severity } = req.body;

  if (!reason || !severity) {
    return res.status(400).json({ message: '경고 사유와 단계는 필수입니다.' });
  }

  try {
    const currentGroup = await warningModel.getCurrentResetGroup(userId);
    await warningModel.addWarning(userId, reason, severity, currentGroup);

    const warningCount = await warningModel.getCurrentWarningCount(userId, currentGroup);
    console.log(`⚠️ 사용자 ${userId} 경고 누적 수 (${currentGroup}번 그룹):`, warningCount);

    // 누적 경고가 3 이상 → 자동 차단 + 쪽지
    if (warningCount >= 3) {
      await db.query(`UPDATE users SET status = 'blocked' WHERE id = ?`, [userId]);

      // 자동 쪽지 발송
      await messageModel.createMessage({
        from_user_id: null,
        to_user_id: userId,
        subject: '🚫 경고 누적 차단 안내',
        content: '경고가 3회 누적되어 계정이 차단되었습니다. 문의가 필요할 경우 고객센터를 이용해주세요.',
        language: 'ko',
        type: 'warning',
      });

      return res.json({ message: '⚠️ 경고가 추가되었고, 자동으로 계정이 차단되었습니다.' });
    }

    res.json({ message: `✅ 경고가 추가되었습니다. (현재 누적 ${warningCount}회)` });
  } catch (err) {
    console.error('❌ 경고 처리 오류:', err);
    res.status(500).json({ message: '서버 오류로 경고 처리에 실패했습니다.' });
  }
};

exports.getWarnings = async (req, res) => {
  const { id } = req.params;

  try {
    const warnings = await warningModel.getWarningsByUser(id);
    res.json({ user_id: id, warnings });
  } catch (err) {
    console.error('❌ 경고 조회 오류:', err);
    res.status(500).json({ message: '서버 오류로 경고 정보를 불러오지 못했습니다.' });
  }
};

// 쪽지조회
exports.getSentMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 15
    const offset = (page - 1) * limit

    // 전체 개수
    const [countRows] = await db.query(`
      SELECT COUNT(*) AS total FROM messages
    `)
    const total = countRows[0].total
    const totalPages = Math.ceil(total / limit)

    // 데이터 조회
    const [rows] = await db.query(`
      SELECT 
        m.*,
        u.username AS to_username,
        sender.username AS from_username
      FROM messages m
      JOIN users u       ON m.to_user_id   = u.id
      JOIN users sender  ON m.from_user_id = sender.id
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset])

    const formattedMessages = rows.map(m => ({
      ...m,
      created_at: toManilaTime(m.created_at)
    }))
    res.json({
      messages: formattedMessages,
      total,
      totalPages,
      currentPage: page
    })
  } catch (err) {
    console.error('❌ 보낸 쪽지 조회 오류:', err)
    res.status(500).json({ message: '보낸 쪽지 불러오기 실패' })
  }
}

// 쪽지관리
exports.getMessageTemplates = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM message_templates')
  res.json({ templates: rows })
}

exports.updateMessageTemplates = async (req, res) => {
  const templates = req.body.templates

  try {
    for (const tpl of templates) {
      await db.query('UPDATE message_templates SET content = ? WHERE template_key = ?', [tpl.content, tpl.template_key])
    }
    res.json({ message: '업데이트 완료' })
  } catch (err) {
    res.status(500).json({ message: '업데이트 실패', error: err })
  }
}
//쪽지삭제
exports.deleteMessage = async (req, res) => {
  const messageId = req.params.id

  try {
    const [rows] = await db.query(`
      SELECT * FROM messages WHERE id = ? AND is_read = 0
    `, [messageId])

    if (rows.length === 0) {
      return res.status(400).json({ message: '이미 읽은 쪽지는 삭제할 수 없습니다.' })
    }

    await db.query(`DELETE FROM messages WHERE id = ?`, [messageId])

    res.json({ message: '쪽지 삭제 완료' })
  } catch (err) {
    console.error('❌ 쪽지 삭제 실패:', err)
    res.status(500).json({ message: '쪽지 삭제 중 오류' })
  }
}
//공지사항 작성
exports.createNotice = async (req, res) => {
  const { title, content, language } = req.body
  try {
    const [result] = await db.query(
      'INSERT INTO notices (title, content, language) VALUES (?, ?, ?)',
      [title, content, language]
    )
    res.json({ success: true, id: result.insertId })
  } catch (err) {
    console.error('❌ 공지 등록 오류:', err)
    res.status(500).json({ success: false, message: '공지 등록 실패' })
  }
}

// 공지사항 조회
exports.getAllNotices = async (req, res) => {
  const limit = parseInt(req.query.limit) || 15
  const page = parseInt(req.query.page) || 1
  const offset = (page - 1) * limit

  try {
    const [notices] = await db.query(
      'SELECT id, title, language, created_at FROM notices ORDER BY id DESC LIMIT ? OFFSET ?',
      [limit, offset]
    )

    const [countResult] = await db.query('SELECT COUNT(*) AS total FROM notices')
    const total = countResult[0].total
    const totalPages = Math.ceil(total / limit)   // ✅ 계산

    const formattedNotices = notices.map(n => ({
      ...n,
      created_at: toManilaTime(n.created_at)
    }))
    res.json({ 
      success: true,
      notices: formattedNotices,
      total,
      totalPages,
      currentPage: page
    })
  } catch (err) {
    console.error('❌ 공지 목록 조회 실패:', err)
    res.status(500).json({ success: false, message: '공지 목록 조회 실패' })
  }
}

exports.deleteNotice = async (req, res) => {
  const noticeId = req.params.id
  try {
    await db.query('DELETE FROM notices WHERE id = ?', [noticeId])
    res.json({ success: true, message: '삭제 완료' })
  } catch (err) {
    console.error('❌ 공지 삭제 오류:', err)
    res.status(500).json({ success: false, message: '공지 삭제 실패' })
  }
}
exports.getNoticeById = async (req, res) => {
  const noticeId = req.params.id
  try {
    const [rows] = await db.query('SELECT * FROM notices WHERE id = ?', [noticeId])
    if (rows.length === 0) return res.status(404).json({ success: false, message: '공지 없음' })
    res.json({ success: true, notice: rows[0] })
  } catch (err) {
    console.error('❌ 공지 상세 조회 오류:', err)
    res.status(500).json({ success: false, message: '공지 불러오기 실패' })
  }
}
exports.updateNotice = async (req, res) => {
  const noticeId = req.params.id
  const { title, content, language } = req.body
  try {
    await db.query(
      'UPDATE notices SET title = ?, content = ?, language = ? WHERE id = ?',
      [title, content, language, noticeId]
    )
    res.json({ success: true, message: '공지 수정 완료' })
  } catch (err) {
    console.error('❌ 공지 수정 오류:', err)
    res.status(500).json({ success: false, message: '공지 수정 실패' })
  }
}


// 전체 문의 목록 조회 (status 필터 및 페이징)
exports.getInquiries = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  const statusCondition = status ? 'WHERE i.status = ?' : '';
  const params = status ? [status, parseInt(limit), parseInt(offset)] : [parseInt(limit), parseInt(offset)];

  const sql = `
    SELECT i.id, u.username, i.title, i.category, i.status, i.created_at
    FROM inquiries i
    JOIN users u ON i.user_id = u.id
    ${statusCondition}
    ORDER BY i.created_at DESC
    LIMIT ? OFFSET ?
  `;

  try {
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'DB 오류', details: err.message });
  }
};

// 문의 상세 조회
exports.getInquiryDetail = async (req, res) => {
  const inquiryId = req.params.id;

  const sql = `
    SELECT i.*, u.username,
      (SELECT answer FROM inquiry_answers WHERE inquiry_id = i.id LIMIT 1) AS answer
    FROM inquiries i
    JOIN users u ON i.user_id = u.id
    WHERE i.id = ?
  `;

  try {
    const [rows] = await db.query(sql, [inquiryId]);
    if (rows.length === 0) return res.status(404).json({ error: '문의가 없습니다.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'DB 오류', details: err.message });
  }
};
//0701
exports.answerInquiry = async (req, res) => {
  const inquiryId = req.params.id;
  const { admin_id, answer } = req.body;

  console.log('📩 답변 등록 시도:', { inquiryId, admin_id, answer }); // 🔍 로그 추가

  try {
    await db.query(
      'INSERT INTO inquiry_answers (inquiry_id, admin_id, answer) VALUES (?, ?, ?)',
      [inquiryId, admin_id, answer]
    );

    await db.query(
      'UPDATE inquiries SET status = "answered", answered_at = NOW() WHERE id = ?',
      [inquiryId]
    );

    res.json({ message: 'inquiry.answer.success' });
  } catch (err) {
    console.error('❌ 답변 등록 실패:', err.message); // 🔥 핵심 로그
    res.status(500).json({ error: 'DB 오류', details: err.message });
  }
};


//사용자 플랫폼 조회
exports.getUserPlatforms = async (req, res) => {
  const { id } = req.params
  const lang = req.query.lang || 'ko' // 기본 언어

  try {
    const [rows] = await db.query(
      `
      SELECT up.id, pt.name AS platform_name, up.platform_user_id, up.created_at
      FROM user_platforms up
      LEFT JOIN platform_translations pt
        ON up.platform_id = pt.platform_id AND pt.language = ?
      WHERE up.user_id = ?
      ORDER BY up.created_at ASC
      `,
      [lang, id]
    )

    res.json({ platforms: rows })
  } catch (err) {
    console.error('❌ 사용자 플랫폼 조회 실패:', err)
    res.status(500).json({ message: '사용자 플랫폼 정보를 불러오는 데 실패했습니다.' })
  }
}
//플랫폼 추가
exports.addUserPlatform = async (req, res) => {
  const { id: userId } = req.params;
  const { platform_id, platform_user_id } = req.body;

  if (!platform_id || !platform_user_id) {
    return res.status(400).json({ message: '플랫폼 ID와 플랫폼 아이디는 필수입니다.' });
  }

  try {
    // 중복 확인 (같은 플랫폼 중복 방지)
    const [existing] = await db.query(
      'SELECT id FROM user_platforms WHERE user_id = ? AND platform_id = ?',
      [userId, platform_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: '해당 플랫폼은 이미 등록되어 있습니다.' });
    }

    await db.query(
      'INSERT INTO user_platforms (user_id, platform_id, platform_user_id) VALUES (?, ?, ?)',
      [userId, platform_id, platform_user_id]
    );

    res.json({ message: '플랫폼이 추가되었습니다.' });
  } catch (err) {
    console.error('❌ 플랫폼 추가 오류:', err);
    res.status(500).json({ message: '플랫폼 추가에 실패했습니다.' });
  }
};
//플랫폼 수정
exports.updateUserPlatform = async (req, res) => {
  const { platformId } = req.params;
  const { platform_user_id } = req.body;

  if (!platform_user_id) {
    return res.status(400).json({ message: '플랫폼 아이디는 필수입니다.' });
  }

  try {
    const [result] = await db.query(
      'UPDATE user_platforms SET platform_user_id = ?, updated_at = NOW() WHERE id = ?',
      [platform_user_id, platformId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '플랫폼 정보가 존재하지 않습니다.' });
    }

    res.json({ message: '플랫폼 아이디가 수정되었습니다.' });
  } catch (err) {
    console.error('❌ 플랫폼 수정 오류:', err);
    res.status(500).json({ message: '수정에 실패했습니다.' });
  }
};
// 관리자용 사용자 비밀번호 초기화 0701
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    console.log('🔧 비밀번호 초기화 요청:', { id, newPassword });

    if (!newPassword) {
      return res.status(400).json({ message: '비밀번호가 없습니다.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10); // 여기서 bcrypt 정의됐는지 확인
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

    res.json({ message: '비밀번호가 초기화되었습니다.' });
  } catch (err) {
    console.error('🔥 비밀번호 초기화 중 에러:', err);
    res.status(500).json({ message: '서버 오류' });
  }
};

exports.resetUserWithdrawalPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const newWithdrawalPassword = '000000';
    const hashedPassword = await bcrypt.hash(newWithdrawalPassword, 10);

    await db.query('UPDATE users SET money_password = ? WHERE id = ?', [hashedPassword, id]);

    res.json({ message: '출금 비밀번호가 초기화되었습니다.' });
  } catch (err) {
    console.error('🔥 출금 비밀번호 초기화 중 에러:', err);
    res.status(500).json({ message: '서버 오류' });
  }
};

// controllers/adminController.js  updateUser  사용자 정보 수정
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { real_name, phone, referral_id, bank_name, bank_account } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE users SET real_name = ?, phone = ?, referral_id = ?, bank_name = ?, bank_account = ? WHERE id = ?`,
      [real_name, phone, referral_id, bank_name, bank_account, id]
    );

    res.json({ message: '사용자 정보가 수정되었습니다.' });
  } catch (err) {
    console.error('❌ 사용자 정보 수정 오류:', err);
    res.status(500).json({ message: '사용자 정보 수정 실패' });
  }
};
