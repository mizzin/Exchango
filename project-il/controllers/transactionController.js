
//금전 관련 로직 중심, 내부 지갑 트랜잭션 관리
const db = require('../db');
const bcrypt = require('bcrypt');
const { getCustomRates } = require('../utils/rateUtil')
const sendMessage = require('../utils/sendMessage')
const transaction = require('../models/transaction');

//충전신청
exports.createTransaction = async (req, res) => {
  const {
    amount,            // USD 금액
    currency,          // KRW / PHP / USDT
    local_amount,      // 환산된 금액
    platform_id,       // 플랫폼 ID (변경됨)
    platform_user_id,  // 사용자 입력 플랫폼 아이디
    type,
     expected_amount  
  } = req.body

  const userId = req.user.id

  if (!amount || !currency || !local_amount || !platform_id || !platform_user_id) {
    return res.status(400).json({ message: '필수 입력값 누락' })
  }

  try {
    const [[user]] = await db.query('SELECT username FROM users WHERE id = ?', [userId])

    await db.query(`
      INSERT INTO transactions 
      (user_id, type, amount, krw_amount, currency,expected_amount, platform_id, platform_user_id, status, confirmed_by_admin, admin_note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', false, '')
    `, [userId, type, amount, local_amount, currency,expected_amount, platform_id, platform_user_id])

    // 💬 자동 쪽지 발송 (충전신청 시)
    if (type === 'charge') {
      const templateKey = `recharge_guide_${currency.toLowerCase()}`
      const [[template]] = await db.query('SELECT content FROM message_templates WHERE `template_key` = ?', [templateKey])

      if (template) {
        const content = template.content
          .replace('{{nickname}}', user.username)
          .replace('{{amount}}', amount)

        await sendMessage({
          to_user_id: userId,
          subject: '💬 충전 안내',
          content,
          type: 'system'
        })
      }
    }

    res.status(201).json({ message: '충전 신청이 완료되었습니다.' })

  } catch (error) {
    console.error('[ERROR] createTransaction:', error)
    res.status(500).json({ error: '서버 오류로 충전 신청에 실패했습니다.' })
  }
}

//출금신청 사용자
exports.createWithdrawTransaction = async (req, res) => {
  const userId = req.user.id;
  const {
    amount,
    currency,
    krw_amount,
    platform_id ,
    platform_user_id,
    user_memo,
    expected_amount  
  } = req.body;

 if (!amount || !currency || !platform_id || !platform_user_id || krw_amount == null) {
  return res.status(400).json({ message: '필수 항목이 누락되었습니다.' });
}

  if (amount < 40) {
    return res.status(400).json({ message: '최소 출금 금액은 $40입니다.' });
  }

  try {
    const [result] = await db.query(`
      INSERT INTO transactions (
        user_id,
        type,
        amount,
        krw_amount,
        currency,
        expected_amount  ,
        platform_id ,
        platform_user_id,
        user_memo,
        status
      ) VALUES (?, 'platform_withdraw', ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      userId,
      amount,
      krw_amount,
      currency,
      expected_amount  ,
      platform_id ,
      platform_user_id,
      user_memo || ''
    ]);

    res.status(201).json({ message: '출금 신청이 완료되었습니다.', transactionId: result.insertId });
  } catch (err) {
    console.error('[ERROR] 출금 신청 실패:', err);
    res.status(500).json({ message: '출금 신청 중 오류가 발생했습니다.' });
  }
};

//출금내역 사용자
exports.getMyWithdraws = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(`
      SELECT id, platform_id , platform_user_id, amount, currency, krw_amount, status, created_at, updated_at, expected_amount
      FROM transactions
      WHERE user_id = ? AND type = 'platform_withdraw'
      ORDER BY created_at DESC
      LIMIT 10
    `, [userId]);

    res.json({ transactions: rows });
  } catch (err) {
    console.error('[ERROR] 출금 이력 조회 실패:', err);
    res.status(500).json({ message: '출금 이력 조회 중 오류 발생' });
  }
}

//충전내역조회 0721
exports.getMyRechargeTransactions = async (req, res) => {
  const userId = req.user.id

  try {
    const [rows] = await db.query(
      `SELECT id, type, amount, currency, expected_amount, krw_amount, status, platform_id, platform_user_id, created_at, updated_at
       FROM transactions
       WHERE user_id = ? AND type = 'platform_charge'
       ORDER BY created_at DESC
       LIMIT 100`,
      [userId]
    )

    res.json({ transactions: rows })
  } catch (err) {
    console.error('[ERROR] 사용자 충전 이력 조회 실패:', err)
    res.status(500).json({ message: '충전 이력을 불러오는 데 실패했습니다.' })
  }
}

//충전관리자가조회
exports.getRechargeTransactions = async (req, res) => {
  const { username, status, currency, startDate, endDate, page = 1 } = req.query;
  const limit = 10;
  const offset = (page - 1) * limit;
   let where = `WHERE t.type = 'platform_charge'`;
  const values = [];

  if (username) {
    where += ` AND u.username LIKE ?`;
    values.push(`%${username}%`);
  }
  if (status) {
    where += ` AND t.status = ?`;
    values.push(status);
  }
  if (currency) {
    where += ` AND t.currency = ?`;
    values.push(currency);
  }
  if (startDate && endDate) {
    where += ` AND DATE(t.created_at) BETWEEN ? AND ?`;
    values.push(startDate, endDate);
  }
  try {
    const [rows] = await db.query(`
      SELECT SQL_CALC_FOUND_ROWS 
        t.id,
        t.user_id,
        u.username,
        t.platform_id ,
        t.platform_user_id,
        t.amount,
        t.krw_amount,
        t.currency,
        t.status,
        t.created_at,
        t.updated_at
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ${where}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `, [...values, limit, offset]);

    const [[{ 'FOUND_ROWS()': total }]] = await db.query(`SELECT FOUND_ROWS()`);

    res.json({ rows, total });
  } catch (err) {
    console.error('[ERROR] 충전 내역 조회 실패:', err);
    res.status(500).json({ message: '충전 내역 조회에 실패했습니다.' });
  }
};

// 충전 승인 처리
exports.approveRecharge = async (req, res) => {
  const id = req.params.id
  try {
    const [result] = await db.query(`
      UPDATE transactions 
      SET status = 'completed', confirmed_by_admin = true 
      WHERE id = ? AND type = 'charge'
    `, [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '해당 충전 신청을 찾을 수 없습니다.' })
    }

    res.json({ message: '충전 승인 처리 완료' })
  } catch (err) {
    console.error('[ERROR] 승인 처리 실패:', err)
    res.status(500).json({ message: '서버 오류' })
  }
}
// 충전 거절 처리
exports.rejectRecharge = async (req, res) => {
  const id = req.params.id
  try {
    const [result] = await db.query(`
      UPDATE transactions 
      SET status = 'rejected', confirmed_by_admin = true 
      WHERE id = ? AND type = 'platform_charge'
    `, [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '해당 충전 신청을 찾을 수 없습니다.' })
    }

    res.json({ message: '충전 거절 처리 완료' })
  } catch (err) {
    console.error('[ERROR] 거절 처리 실패:', err)
    res.status(500).json({ message: '서버 오류' })
  }
}

//충전내역역
exports.submitRechargeRequest = async (req, res) => {
  const userId = req.user.id
  const { amount, currency, platform_id , platform_user_id } = req.body

  try {
    const [[user]] = await db.query('SELECT id, nickname FROM users WHERE id = ?', [userId])
    if (!user) return res.status(404).json({ message: '사용자 정보를 찾을 수 없습니다.' })

    // 환율 기준 한화 환산 금액 (예시로 krw_amount는 그냥 amount로 저장함)
    const krwAmount = amount  // 필요시 환율 계산 로직 넣어도 됨

    // 1. 충전 신청 저장
    await db.query(
      `INSERT INTO transactions 
      (user_id, type, amount, currency, status, platform_id , platform_user_id, krw_amount, created_at)
      VALUES (?, 'platform_charge', ?, ?, 'pending', ?, ?, ?, NOW())`,
      [userId, amount, currency, platform_id , platform_user_id, krwAmount]
    )

    // 2. 템플릿 불러오기
    const templateKey = `recharge_guide_${currency.toLowerCase()}`
    const [[template]] = await db.query('SELECT content FROM message_templates WHERE `key` = ?', [templateKey])

    if (template) {
      const content = template.content
        .replace('{{nickname}}', user.nickname)
        .replace('{{amount}}', amount)
 console.log('👉 자동 쪽지 내용:', content)
      // 3. 쪽지 전송
      await sendMessage({
        to_user_id: userId,
        subject: '💬 충전 안내',
        content,
        type: 'system'
      })
    }

    res.json({ message: '충전 신청이 완료되었습니다.' })

  } catch (err) {
    console.error('❌ 충전 신청 오류:', err)
    res.status(500).json({ message: '충전 신청 실패', error: err })
  }
}

//관리자 출금 조회
exports.getWithdrawTransactions = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        t.id,
        t.user_id,
        u.username,
        t.platform_id ,
        t.platform_user_id,
        t.amount,
        t.krw_amount,
        t.currency,
        t.status,
        t.created_at,
        t.updated_at
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.type = 'platform_withdraw'
      ORDER BY t.created_at DESC
    `)

    res.json({ transactions: rows })
  } catch (err) {
    console.error('[ERROR] 출금 내역 조회 실패:', err)
    res.status(500).json({ message: '출금 내역 조회에 실패했습니다.' })
  }
}

// 출금 승인 신청
exports.approveWithdraw = async (req, res) => {
  const id = req.params.id
  try {
    await db.query(`
      UPDATE transactions
      SET status = 'completed', updated_at = NOW()
      WHERE id = ? AND type = 'platform_withdraw'
    `, [id])

    res.json({ message: '출금 요청이 승인되었습니다.' })
  } catch (err) {
    console.error('[ERROR] 출금 승인 실패:', err)
    res.status(500).json({ message: '출금 승인 중 오류 발생' })
  }
}
// 출금 거절 신청
exports.rejectWithdraw = async (req, res) => {
  const id = req.params.id
  try {
    await db.query(`
      UPDATE transactions
      SET status = 'rejected', updated_at = NOW()
      WHERE id = ? AND type = 'platform_withdraw'
    `, [id])

    res.json({ message: '출금 요청이 거절되었습니다.' })
  } catch (err) {
    console.error('[ERROR] 출금 거절 실패:', err)
    res.status(500).json({ message: '출금 거절 중 오류 발생' })
  }
}
// controllers/transactionController.js 지갑 충전 0721 추가로 위에 타입도 수정해줘야함.  platform_charge
exports.createWalletRecharge = async (req, res) => {
  const userId = req.user.id;
  const { currency, amount_usd, local_amount,expected_amount } = req.body;

  if (!currency || !amount_usd || !local_amount) {
    return res.status(400).json({ message: '필수 값이 누락되었습니다.' });
  }

  try {
    const [[user]] = await db.query('SELECT id, username FROM users WHERE id = ?', [userId]);

    // 🔥 platform_id는 더 이상 필요 없음 → wallet_charge로 고정
    await db.query(
      `INSERT INTO transactions 
       (user_id, type, amount, krw_amount, currency, expected_amount, status, created_at)
       VALUES (?, 'wallet_charge', ?, ?, ?,?, 'pending', NOW())`,
      [userId, amount_usd, local_amount, currency,expected_amount]
    );

    // ✅ 쪽지 템플릿 전송
    const templateKey = `recharge_guide_${currency.toLowerCase()}`;
    const [[template]] = await db.query('SELECT content FROM message_templates WHERE `template_key` = ?', [templateKey]);

    if (template) {
      const content = template.content
        .replace('{{username}}', user.username)
        .replace('{{amount}}', amount_usd);

      await sendMessage({
        to_user_id: userId,
        subject: '💬 충전 안내',
        content,
        type: 'system'
      });
    }

    res.status(201).json({ message: '내 지갑 충전 신청이 완료되었습니다.' });
  } catch (err) {
    console.error('[ERROR] createWalletRecharge:', err);
    res.status(500).json({ message: '충전 신청 처리 실패' });
  }
};

// 내 지갑 출금
exports.createWalletWithdraw = async (req, res) => {
  const userId = req.user.id;
  const { currency, amount_usd, local_amount, user_memo, expected_amount } = req.body;

  // 필수값 개별 검사
  if (currency === undefined || currency === null || currency === '') {
    return res.status(400).json({ message: 'Currency is required.' });
  }

  if (amount_usd === undefined || amount_usd === null || amount_usd === '') {
    return res.status(400).json({ message: 'Withdrawal amount (USD) is required.' });
  }

  if (local_amount === undefined || local_amount === null || local_amount === '') {
    return res.status(400).json({ message: 'Converted local amount is required.' });
  }

  // PHP 또는 USDT일 때는 user_memo가 필수
  if ((currency === 'PHP' || currency === 'USDT') && (!user_memo || user_memo.trim() === '')) {
    return res.status(400).json({ message: 'Withdrawal address or memo is required for PHP/USDT.' });
  }

  // ↓ 아래는 테스트용 로그
  console.log({ userId, currency, amount_usd, local_amount, user_memo });

  try {
    if (currency === 'PHP' || currency === 'USDT') {
      // memo 있는 경우
      await db.query(
        `INSERT INTO transactions 
         (user_id, type, amount, krw_amount, currency, expected_amount, user_memo, status, created_at)
         VALUES (?, 'wallet_withdraw', ?, ?, ?, ?,?, 'pending', NOW())`,
        [userId, amount_usd, local_amount, currency, expected_amount, user_memo]
      );
    } else {
      // memo 없는 경우 (예: KRW)
      await db.query(
        `INSERT INTO transactions 
         (user_id, type, amount, krw_amount, currency, expected_amount, status, created_at)
         VALUES (?, 'wallet_withdraw', ?, ?, ?,  ?, 'pending', NOW())`,
        [userId, amount_usd, local_amount, currency, expected_amount]
      );
    }

    res.status(201).json({ message: '출금 신청이 완료되었습니다.' });
  } catch (err) {
    console.error('[ERROR] createWalletWithdraw:', err);
    res.status(500).json({ message: '출금 신청 처리 실패' });
  }
};

//사이트 내 충전출금 신청 목록 API 0721 관리자
exports.getWalletChargeList = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    username = '',
    status = '',
    currency = '',
    type = '',        
    startDate = '',
    endDate = '',
  } = req.query;


  const parsedLimit = Number(limit) || 20;
  const parsedOffset = (Number(page) - 1) * parsedLimit;

  try {
    let baseQuery = `
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.type IN ('wallet_charge', 'wallet_withdraw')
    `;

    const conditions = [];
    const params = [];

    if (username.trim()) {
      conditions.push(`u.username LIKE ?`);
      params.push(`%${username.trim()}%`);
    }

    if (status.trim()) {
      conditions.push(`t.status = ?`);
      params.push(status.trim());
    }

    if (currency.trim()) {
      conditions.push(`t.currency = ?`);
      params.push(currency.trim());
    }

    if (type.trim()) {
      conditions.push(`t.type = ?`);
      params.push(type.trim());
    }

    if (startDate && endDate) {
      conditions.push(`DATE(t.created_at) BETWEEN ? AND ?`);
      params.push(startDate, endDate);
    }

    // 조건이 있으면 AND 추가
    if (conditions.length > 0) {
      baseQuery += ' AND ' + conditions.join(' AND ');
    }

    // 최종 쿼리문
    const listQuery = `
      SELECT t.*, u.username
      ${baseQuery}
      ORDER BY t.created_at DESC
      LIMIT ${parsedLimit} OFFSET ${parsedOffset}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      ${baseQuery}
    `;
    params.push(parsedLimit, parsedOffset);

    // ⚠️ db.query로 바꿔도 테스트 가능 (prepared statement 문제 회피)
    const [rows] = await db.execute(listQuery, params);
    const [countRows] = await db.execute(countQuery, params);

    res.json({ data: rows, total: countRows[0].total });
  } catch (err) {
    console.error('❌ getWalletChargeList error:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

//사이트 내 충전 신청 승인/거절API 0721
exports.approveTransaction = async (req, res) => {
  const transactionId = req.params.id
  const adminId = req.admin?.id || null // 로그인한 관리자 ID

  try {
    // 🔹 1. 트랜잭션 조회
    const [rows] = await db.execute(
      'SELECT * FROM transactions WHERE id = ? AND type = ? AND status = ?',
      [transactionId, 'wallet_charge', 'pending']
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found or already processed' })
    }

    const tx = rows[0]

    const connection = await db.getConnection()
    await connection.beginTransaction()

    try {
      // 🔹1. 거래 상태 완료로 변경
      await connection.execute(
        'UPDATE transactions SET status = ?, updated_at = NOW() WHERE id = ?',
        ['completed', transactionId]
      )

      // 🔹 3.  user_balances 삽입 또는 업데이트
      const [balanceRows] = await connection.execute(
        'SELECT * FROM user_balances WHERE user_id = ?',
        [tx.user_id]
      )

      if (balanceRows.length === 0) {
        await connection.execute(
          'INSERT INTO user_balances (user_id, balance) VALUES (?, ?)',
          [tx.user_id, tx.amount]
        )
      } else {
        await connection.execute(
          'UPDATE user_balances SET balance = balance + ? WHERE user_id = ?',
          [tx.amount, tx.user_id]
        )
      }
      await connection.commit()
      connection.release()

      res.json({ message: 'Transaction approved and balance updated' })
    } catch (innerErr) {
      await connection.rollback()
      connection.release()
      console.error('❌ approveTransaction inner error:', innerErr)
      res.status(500).json({ message: 'Transaction failed', error: innerErr.message })
    }
  } catch (err) {
    console.error('❌ approveTransaction error:', err)
    res.status(500).json({ message: 'Internal Server Error', error: err.message })
  }
}
exports.rejectTransaction = async (req, res) => {
  const transactionId = req.params.id;
  const adminId = req.admin?.id || null;
  const { reason } = req.body;

  if (!reason || reason.trim() === '') {
    return res.status(400).json({ message: '거절 사유를 입력해주세요.' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT * FROM transactions WHERE id = ? AND type = ? AND status = ?',
      [transactionId, 'wallet_charge', 'pending']
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found or already processed' });
    }

    const tx = rows[0];

    await db.execute(
      'UPDATE transactions SET status = ?, admin_id = ?, updated_at = NOW() WHERE id = ?',
      ['rejected', adminId, transactionId]
    );

    await sendMessage({
      to_user_id: tx.user_id,
      subject: '❌ 충전 거절 안내',
      content: `요청하신 ${tx.amount} ${tx.currency} 충전이 거절되었습니다.\n\n사유: ${reason}`,
      type: 'system'
    });

    res.json({ message: '거절이 완료되었습니다.' });
  } catch (err) {
    console.error('❌ rejectTransaction error:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};



//머니이동 신청 API 0724 사용자.
exports.requestPlatformMove = async (req, res) => {
  const {
    type,
    from_type,
    from_platform_id,
    from_platform_user_id,
    to_platform_id,
    to_platform_user_id,
    amount,
    exchange_rate,
    expected_amount,
    money_password,
    memo, 
  } = req.body;

  const userId = req.user.id;

  try {
    // ✅ 1. 기본 유효성 체크
    if (!['wallet', 'platform'].includes(from_type)) {
       return res.status(400).json({ message: 'Invalid source type. Must be wallet or platform.' });
    }

    if (!to_platform_id || !to_platform_user_id || amount <= 0) {
      return res.status(400).json({ message: 'Missing or invalid destination platform or amount.' });
    }

    if (from_type === 'platform') {
      if (!from_platform_id || !from_platform_user_id) {
         return res.status(400).json({ message: 'Source platform and platform ID are required.' });
      }
      if (from_platform_id === to_platform_id) {
        return res.status(400).json({ message: 'Cannot transfer between the same platform.' });
      }
    }

    // ✅ 2. 중복 신청 방지
    const [existing] = await db.execute(
      `SELECT id FROM site_transactions 
       WHERE user_id = ? AND type = 'platform_move' AND status = 'pending'`,
      [userId]
    );
    if (existing.length > 0) {
       return res.status(400).json({ message: 'You already have a pending transfer request.' });
    }

    // ✅ 3. 출금 비밀번호 확인
    const [[user]] = await db.execute(`SELECT money_password FROM users WHERE id = ?`, [userId]);
    if (!user || !user.money_password) {
      return res.status(403).json({ message: 'Money password is not set.' });
    }

    const match = await bcrypt.compare(money_password, user.money_password);
    if (!match) {
       return res.status(403).json({ message: 'Incorrect money password.' });
    }

    // ✅ 4. 내 지갑 잔액 확인 (from_type이 wallet인 경우만)
    if (from_type === 'wallet') {
      const [[wallet]] = await db.execute(`SELECT balance FROM user_balances WHERE user_id = ?`, [userId]);
      if (!wallet || wallet.balance < amount) {
        return res.status(400).json({ message: 'Insufficient wallet balance.' });
      }
    }

    // ✅ 5. 환율 계산 검증 (from_currency ≠ to_currency 인 경우)
    const [[toPlat]] = await db.execute(`SELECT currency FROM platforms WHERE id = ?`, [to_platform_id]);
    let fromCurrency = 'USD';
    if (from_type === 'platform') {
      const [[fromPlat]] = await db.execute(`SELECT currency FROM platforms WHERE id = ?`, [from_platform_id]);
      fromCurrency = fromPlat?.currency || 'USD';
    }

    if (fromCurrency !== toPlat?.currency) {
      const expected = Math.floor(amount * exchange_rate * 0.98); // 수수료 2%
      if (expected !== expected_amount) {
        return res.status(400).json({ message: 'Expected amount does not match calculated amount based on exchange rate and fees.' });
      }
    }
// ✅ 5.5. 트랜잭션 타입 결정
let transactionType = '';

if (from_type === 'wallet' && to_platform_id && to_platform_id !== 'wallet') {
  transactionType = 'transfer'; // 내 지갑 → 플랫폼
} else if (from_type === 'platform' && (!to_platform_id || to_platform_id === 'wallet')) {
  transactionType = 'platform_withdraw'; // 플랫폼 → 내 지갑
} else if (from_type === 'platform' && to_platform_id && to_platform_id !== 'wallet') {
  transactionType = 'platform_to_platform'; // 플랫폼 → 플랫폼
} else {
  transactionType = 'unknown';
}


  // 💡 '내 지갑' 선택한 경우 to_platform_id를 null 또는 'internal'로 변환
  const toPlatformIdForDB = to_platform_id === 'wallet' ? null : to_platform_id;
  const toPlatformUserIdForDB = to_platform_id === 'wallet' ? null : to_platform_user_id;

  // ✅ 6. 신청 저장 (status = pending)
await db.execute(
  `INSERT INTO transactions 
    (user_id, type, amount, currency, status, user_memo, from_type, from_platform_id, from_platform_user_id,
      to_platform_id, to_platform_user_id, exchange_rate, expected_amount, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
  [
    userId,
    transactionType,
    amount,
    fromCurrency,
    memo || null,
    from_type,
    from_type === 'platform' ? from_platform_id : null,
    from_type === 'platform' ? from_platform_user_id : null,
    toPlatformIdForDB,
    toPlatformUserIdForDB,
    exchange_rate || null,
    expected_amount || null
  ]
);


    return res.json({ message: 'Transfer request submitted successfully.' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'server errer' });
  }
};
//머니이동 사용자 이력조회 0724
exports.getPlatformMoveHistory = async (req, res) => {
  const userId = req.user.id;
  console.log('[getPlatformMoveHistory] req.user:', req.user);

  const { status, from_type, to_platform_id } = req.query; // ❗ 필터 대비 쿼리 파라미터

  try {
    let sql = `
      SELECT 
        id,
        amount,
        type,
        currency,
        platform_id AS to_platform_id,
        platform_user_id AS to_platform_user_id,
        user_memo AS memo,
        status,
        confirmed_by_admin,
        admin_note,
        created_at,
        updated_at
      FROM transactions
     WHERE user_id = ? AND type IN ('wallet_charge', 'platform_charge', 'wallet_withdraw', 'platform_withdraw', 'platform_to_platform', 'transfer', 'reward', 'penalty')


    `;

    const params = [userId];

    // 필터 조건 동적 구성
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    if (from_type) {
      sql += ` AND platform_name = ?`; // 예: 'wallet' 또는 'platformA'
      params.push(from_type);
    }

    if (to_platform_id) {
      sql += ` AND platform_id = ?`;
      params.push(to_platform_id);
    }

    sql += ` ORDER BY created_at DESC`;

    const [rows] = await db.query(sql, params);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('getPlatformMoveHistory error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch move history.' });
  }
};


//머니이동 관리자승인/거절 0724  승인시 transactions에서 상태 승인으로 바뀌고 user_blance 테이블 업데이트 되고 site_transactions 여기에 따로 기록 남는 구조 
// 거절 시 transactions에서 상태 거절로 바뀌고 user_blance, site_transactions 아무 영향없음.
exports.approvePlatformMove = async (req, res) => {
  const { id } = req.params; // transactions.id
  const adminId = req.admin.id;

  const connection = await db.getConnection();
  try {
    // 🔹 1. 트랜잭션 조회
    const [txRows] = await connection.query(
      'SELECT * FROM transactions WHERE id = ? AND type = "transfer" AND status = "pending"',
      [id]
    );

    if (txRows.length === 0) {
      return res.status(404).json({ message: 'Transfer request not found or already processed.' });
    }

    const tx = txRows[0];

    await connection.beginTransaction();

    // 🔹 2. transactions 상태 업데이트
    await connection.execute(
      `UPDATE transactions 
       SET status = 'completed', confirmed_by_admin = 1, admin_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [adminId, id]
    );

    // 🔹 3. user_balances에서 금액 차감 (지갑에서 이동한 경우만)
    if (tx.platform_id === null || tx.platform_id === 'wallet') {
      const [balRows] = await connection.execute(
        'SELECT balance FROM user_balances WHERE user_id = ?',
        [tx.user_id]
      );

      if (balRows.length === 0 || balRows[0].balance < tx.amount) {
        await connection.rollback();
        return res.status(400).json({ message: 'Insufficient wallet balance.' });
      }

      await connection.execute(
        'UPDATE user_balances SET balance = balance - ? WHERE user_id = ?',
        [tx.amount, tx.user_id]
      );
    }

    // 🔹 4. site_transactions에 로그 기록
    await connection.execute(
      `INSERT INTO site_transactions 
       (user_id, type, amount, reason, from_type, to_platform_id, to_platform_user_id, status, approved_by_admin, admin_id, created_at, updated_at)
       VALUES (?, 'platform_move', ?, '머니이동 승인', 'wallet', ?, ?, 'completed', 1, ?, NOW(), NOW())`,
      [
        tx.user_id,
        tx.amount,
        tx.platform_id,
        tx.platform_user_id,
        adminId
      ]
    );

    await connection.commit();
    res.json({ message: 'Transfer approved successfully.' });
  } catch (err) {
    await connection.rollback();
    console.error('approvePlatformMove error:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  } finally {
    connection.release();
  }
};
// 사용자 머니 이동 신청 거절 API + 쪽지 발송
exports.rejectPlatformMove = async (req, res) => {
  const { id } = req.params; // transactions.id
  const { reason } = req.body;
  const adminId = req.admin.id;

  if (!reason) {
    return res.status(400).json({ message: 'Rejection reason is required.' });
  }

  try {
    // 🔹 transactions 테이블에서 요청 찾기
    const [txRows] = await db.query(
      `SELECT * FROM transactions 
       WHERE id = ? AND type = 'transfer' AND status = 'pending'`,
      [id]
    );

    if (txRows.length === 0) {
      return res.status(404).json({ message: 'Transfer request not found or already processed.' });
    }

    const transaction = txRows[0];

    // 🔹 사용자 정보 조회 (쪽지 발송용)
    const [[user]] = await db.query(`SELECT username FROM users WHERE id = ?`, [transaction.user_id]);

    // 🔹 상태 업데이트 + 관리자 메모 저장
    await db.query(
      `UPDATE transactions 
       SET status = 'rejected', confirmed_by_admin = 0, admin_note = ?, admin_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [reason, adminId, id]
    );

    // 🔹 쪽지 전송
    await sendMessage({
      to_user_id: transaction.user_id,
      subject: '❌ 머니 이동 신청이 거절되었습니다',
      content: reason, // 관리자가 입력한 거절 사유 그대로 발송
      type: 'system'
    });

    return res.json({ message: 'Transfer request rejected and message sent to user.' });
  } catch (error) {
    console.error('❌ rejectPlatformMove error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};


//머니이동 관리자  요청 조회 0724
exports.getAllMoveRequests = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        t.id,
        t.user_id,
        u.username,
        t.amount,
        t.reason,
        t.status,
        t.created_at,
        t.updated_at
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.type = 'platform_move'
      ORDER BY t.created_at DESC`
    );

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('getAllMoveRequests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch move requests.' });
  }
};
//머니이동 관리자  전체 요청 조회 0724
exports.getAllMoveRequests = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        st.id,
        st.user_id,
        u.username,
        st.amount,
        st.reason,
        st.status,
        st.created_at,
        st.updated_at,
        st.from_platform_id,
        st.from_platform_user_id,
        st.to_platform_id,
        st.to_platform_user_id,
        st.memo,
        st.reject_reason,
        st.admin_id,
        a.username AS admin_username
      FROM site_transactions st
      JOIN users u ON st.user_id = u.id
      LEFT JOIN admins a ON st.admin_id = a.id
      WHERE st.type = 'platform_move'
      ORDER BY st.created_at DESC
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getAllMoveRequests error:', error);
    res.status(500).json({ success: false, message: 'Failed to load move requests.' });
  }
};

// 모든 신청내역을 관리 관리자

exports.getAllRequests = async (req, res) => {
  try {
    const { type, status, username, startDate, endDate, page = 1, limit = 15 } = req.query
    const offset = (page - 1) * limit
let where = `WHERE 1=1`
const params = []

if (type) {
  where += ` AND t.type = ?`
  params.push(type)
}
if (status) {
  where += ` AND t.status = ?`
  params.push(status)
}
if (username) {
  where += ` AND u.username LIKE ?`
  params.push(`%${username}%`)
}
if (startDate) {
  where += ` AND t.created_at >= ?`
  params.push(`${startDate} 00:00:00`)
}
if (endDate) {
  where += ` AND t.created_at <= ?`
  params.push(`${endDate} 23:59:59`)
}


    const dataSql = `
      SELECT 
        t.*, 
        u.username AS user_username, 
        u.real_name AS user_real_name
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      ${where}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `

    const countSql = `
  SELECT COUNT(*) AS total
  FROM transactions t
  LEFT JOIN users u ON t.user_id = u.id
  ${where}
`

    const data = await db.query(dataSql, [...params, parseInt(limit), parseInt(offset)])
    const count = await db.query(countSql, params)

    res.json({
      data: data[0],
      total: count[0][0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    })
  } catch (err) {
    console.error('❌ 전체 신청내역 조회 실패:', err)
    res.status(500).json({ message: '서버 오류' })
  }
}