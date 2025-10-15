
//controllers>transactionController.js
const db = require('../db');
const { getCustomRates } = require('../utils/rateUtil')
const sendMessage = require('../utils/sendMessage')
const bcrypt = require('bcrypt');
const transaction = require('../models/transaction');
const sendTelegramMessage = require('../utils/telegram');
const toManilaTime = require('../utils/formatDate')


//충전신청 0728 쿼리 외부
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
// 2. 중복 신청 방지 - 금액 관련 전체로 확장
const [existing] = await db.execute(
  `SELECT id FROM transactions
   WHERE user_id = ? AND status = 'pending' AND type IN (
      'charge', 'withdraw', 'wallet_to_platform', 'platform_to_wallet', 'platform_to_platform'
   )`,
  [userId]
);
if (existing.length > 0) {
   return res.status(400).json({ message: 'You already have a pending money-related request.' });
}

  if (!amount || !currency || !local_amount || !platform_id || !platform_user_id) {
    return res.status(400).json({ message: 'Value to enter' })
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

        await sendTelegramMessage(
        `[충전신청]\n유저명: ${user.username}\n플랫폼: ${platform_id}\n입력ID: ${platform_user_id}\n금액: ${amount} ${currency}\n환산금액: ${expected_amount}`
        )


      const templateKey = `recharge_guide_${currency.toLowerCase()}`
      const [[template]] = await db.query('SELECT content FROM message_templates WHERE `template_key` = ?', [templateKey])

      if (template) {
        const content = template.content
          .replace('{{nickname}}', user.username)
          .replace('{{amount}}', amount)

        await sendMessage({
          to_user_id: userId,
          subject: '💬 Charging Information',
          content,
          type: 'system'
        })
      }
    }

    res.status(201).json({ message: 'Your charging request has been completed..' })

  } catch (error) {
    console.error('[ERROR] createTransaction:', error)
    res.status(500).json({ error: '서버 오류로 충전 신청에 실패했습니다.' })
  }
}

//출금신청 사용자 0728 쿼리외부
exports.createWithdrawTransaction = async (req, res) => {
  const userId = req.user.id;

 // 2. 중복 신청 방지 - 금액 관련 전체로 확장
    const [existing] = await db.execute(
      `SELECT id FROM transactions
      WHERE user_id = ? AND status = 'pending' AND type IN (
          'charge', 'withdraw', 'wallet_to_platform', 'platform_to_wallet', 'platform_to_platform'
      )`,
      [userId]
    );
if (existing.length > 0) {
   return res.status(400).json({ message: 'You already have a pending money-related request.' });
}

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
  return res.status(400).json({ message: 'A required field is missing.' });
}

  if (amount < 40) {
    return res.status(400).json({ message: 'The minimum withdrawal amount is $40.' });
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
      ) VALUES (?, 'platform_withdraw', ?, ?, ?, ?,? ,?, ?, 'pending')
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

    // 📢 출금신청시 텔레그램 알림!
    await sendTelegramMessage(
      `[출금신청]\n유저ID: ${userId}\n플랫폼: ${platform_id}\n입력ID: ${platform_user_id}\n출금액: ${amount} ${currency}\n환산금액: ${expected_amount}\n메모: ${user_memo || '-'}`
    );

    res.status(201).json({ message: 'Withdrawal request has been completed.', transactionId: result.insertId });
  } catch (err) {
    console.error('[ERROR] 출금 신청 실패:', err);
    res.status(500).json({ message: 'An error occurred while requesting withdrawal.' });
  }
};

//출금내역 사용자 0728 쿼리외부
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

//충전내역조회 0728 쿼리 외부
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

//충전관리자가조회 외부
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

// 충전 승인 처리 관리자 0728 외부

// 충전 승인 처리
exports.approveRecharge = async (req, res) => {
  const id = req.params.id
  const adminId = req.admin?.id || null // 🔹로그인한 관리자 ID

  try {
      const [result] = await db.query(`
      UPDATE transactions 
      SET status = 'completed', confirmed_by_admin = true, admin_id = ?, updated_at = NOW()
      WHERE id = ? AND type = 'platform_charge'
    `, [adminId, id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '해당 충전 신청을 찾을 수 없습니다.' })
    }

    res.json({ message: '충전 승인 처리 완료' })
  } catch (err) {
    console.error('[ERROR] 승인 처리 실패:', err)
    res.status(500).json({ message: '서버 오류' })
  }
}
// 충전 거절 처리 외부
exports.rejectRecharge = async (req, res) => {
  const id = req.params.id
  const adminId = req.admin?.id || null // 🔹관리자 ID 추가
 try {
    const [result] = await db.query(`
      UPDATE transactions 
      SET status = 'rejected', confirmed_by_admin = true, admin_id = ?, updated_at = NOW()
      WHERE id = ? AND type = 'platform_charge'
    `, [adminId, id])


    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '해당 충전 신청을 찾을 수 없습니다.' })
    }

    res.json({ message: '충전 거절 처리 완료' })
  } catch (err) {
    console.error('[ERROR] 거절 처리 실패:', err)
    res.status(500).json({ message: '서버 오류' })
  }
}

//충전내역역 외부
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
//관리자 출금 조회 외부
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

// 출금 승인 신청 외부
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
// 출금 거절 신청 외부
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


// controllers/transactionController.js 지갑 충전 0721 
//내 지갑 충전 사용자가 입금신청
exports.createWalletRecharge = async (req, res) => {
  const userId = req.user.id;

  const { currency, amount_usd, local_amount,expected_amount } = req.body;

  //중복금액방지
  const [existing] = await db.execute(
  `SELECT id FROM transactions
   WHERE user_id = ? AND status = 'pending' AND type IN (
      'charge', 'withdraw', 'wallet_to_platform', 'platform_to_wallet', 'platform_to_platform'
   )`,
  [userId]
);
if (existing.length > 0) {
   return res.status(400).json({ message: 'You already have a pending money-related request.' });
}


  if (!currency || !amount_usd || !local_amount) {
    return res.status(400).json({ message: 'A required field is missing.' });
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

   // 📢 여기! 충전신청시 텔레그램 알림 추가
    await sendTelegramMessage(
      `[지갑 충전신청]\n유저명: ${user.username}\n충전금액: ${amount_usd} USD (${currency})\n환산금액: ${expected_amount}`
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
        subject: '💬 Recharge Information',
        content,
        type: 'system'
      });
    }

    res.status(201).json({ message: 'Wallet recharge request has been submitte.' });
  } catch (err) {
    console.error('[ERROR] createWalletRecharge:', err);
    res.status(500).json({ message: 'Failed to process the recharge request' });
  }
};
// 특정 통화 주소 조회
exports.getDepositAddressByCurrency = async (req, res) => {
  const { currency } = req.params
  if (!currency) return res.status(400).json({ error: 'currency is required' })

  try {
    const [rows] = await db.query('SELECT address FROM deposit_addresses WHERE currency = ?', [currency])
    if (rows.length === 0)
      return res.status(404).json({ error: 'No address found for this currency' })

    res.status(200).json(rows[0])
  } catch (err) {
    console.error('❌ [getDepositAddressByCurrency]', err)
    res.status(500).json({ error: 'Failed to fetch deposit address' })
  }
}

// 내 지갑 출금 신청  사용자
exports.createWalletWithdraw = async (req, res) => {
  const userId = req.user.id;
  const { currency, amount_usd, local_amount, user_memo, expected_amount, money_password } = req.body;
  
  //중복금액방지
  const [existing] = await db.execute(
  `SELECT id FROM transactions
   WHERE user_id = ? AND status = 'pending' AND type IN (
      'charge', 'withdraw', 'wallet_to_platform', 'platform_to_wallet', 'platform_to_platform'
   )`,
  [userId]
);
if (existing.length > 0) {
   return res.status(400).json({ message: 'You already have a pending money-related request.' });
}

  if (!currency) return res.status(400).json({ message: 'Currency is required.' });
  if (!amount_usd) return res.status(400).json({ message: 'Withdrawal amount (USD) is required.' });
  if (!local_amount) return res.status(400).json({ message: 'Converted local amount is required.' });
  if (!money_password || typeof money_password !== 'string' || money_password.length !== 6)
    return res.status(400).json({ message: 'Please enter your 6-digit withdrawal password.' });
  if ((currency === 'PHP' || currency === 'USDT') && (!user_memo || user_memo.trim() === ''))
    return res.status(400).json({ message: 'Withdrawal address or memo is required for PHP/USDT.' });

  try {
    // 유저 정보 조회 및 비밀번호 검증
    const [userRows] = await db.query('SELECT money_password FROM users WHERE id = ?', [userId]);
    const user = userRows[0];

    if (!user || !user.money_password)
      return res.status(403).json({ message: '출금 비밀번호가 설정되어 있지 않습니다.' });

    const isPasswordMatch = await bcrypt.compare(money_password, user.money_password);
    if (!isPasswordMatch) {
      return res.status(403).json({ message: '출금 비밀번호가 일치하지 않습니다.' });
    }

    // 출금 신청 INSERT
    const query = currency === 'PHP' || currency === 'USDT'
      ? `INSERT INTO transactions 
         (user_id, type, amount, krw_amount, currency, expected_amount, user_memo, status, created_at)
         VALUES (?, 'wallet_withdraw', ?, ?, ?, ?, ?, 'pending', NOW())`
      : `INSERT INTO transactions 
         (user_id, type, amount, krw_amount, currency, expected_amount, status, created_at)
         VALUES (?, 'wallet_withdraw', ?, ?, ?, ?, 'pending', NOW())`;

    const params = currency === 'PHP' || currency === 'USDT'
      ? [userId, amount_usd, local_amount, currency, expected_amount, user_memo]
      : [userId, amount_usd, local_amount, currency, expected_amount];

    await db.query(query, params);

       // 📢 출금신청시 텔레그램 알림 추가!
    await sendTelegramMessage(
      `[지갑 출금신청]\n유저명: ${user.username}\n출금액: ${amount_usd} USD (${currency})\n환산금액: ${local_amount}\n메모: ${user_memo || '-'}`
    );

    res.status(201).json({ message: '출금 신청이 완료되었습니다.' });

  } catch (err) {
    console.error('[ERROR] createWalletWithdraw:', err);
    res.status(500).json({ message: '출금 신청 처리 실패' });
  }
};


//사이트 내 충전 신청 목록 API 0721 관리자
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
      WHERE t.type = 'wallet_charge' 
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


// ⚠️ 여기! LIMIT/OFFSET은 쿼리에 직접 들어가 있으니, params에 넣지 말 것!
const [rows] = await db.execute(listQuery, params);
const [countRows] = await db.execute(countQuery, params.slice(0, params.length));

const formattedRows = rows.map(r => ({
  ...r,
  created_at: toManilaTime(r.created_at),
  updated_at: toManilaTime(r.updated_at)
}))
    res.json({ data: formattedRows, total: countRows[0].total });
  } catch (err) {
    console.error('❌ getWalletChargeList error:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

//사이트 내 충전 신청 승인/거절API 0721 관리자
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
        'UPDATE transactions SET status = ?, admin_id = ?, updated_at = NOW() WHERE id = ?',
        ['completed', adminId, transactionId]
      );


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
     subject: '❌ Notification: Deposit Request Declined',
content: `We regret to inform you that your deposit request for ${tx.amount} ${tx.currency} has been declined.\n\nReason: ${reason}\n\nIf you believe this is an error or need further assistance, please contact our support team.`,
      type: 'system'
    });

    res.json({ message: '거절이 완료되었습니다.' });
  } catch (err) {
    console.error('❌ rejectTransaction error:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};

// 사이트 내 출금 신청 목록 API 0721 관리자 wallet_withdraw
exports.getWalletWithdrawList = async (req, res) => {
  try {
    // limit 오탈자도 수용
    const rawLimit = req.query.limit ?? req.query.limiit ?? 15
    const limit = Math.max(1, Number(rawLimit) || 15)

    const { page = 1, status = '', currency = '', startDate = '', endDate = '' } = req.query
    const username = (req.query.username ?? '').trim()

    const where = [`t.type = 'wallet_withdraw'`]
    const params = []

    if (username) {
      if (/^\d+$/.test(username)) {
        where.push('(u.id = ? OR u.username LIKE ?)')
        params.push(Number(username), `%${username}%`)
      } else {
        where.push('u.username LIKE ?')
        params.push(`%${username}%`)
      }
    }

    if (status)   { where.push('t.status = ?');   params.push(status) }
    if (currency) { where.push('t.currency = ?'); params.push(currency) }
    if (startDate && endDate) {
      where.push('t.created_at >= ? AND t.created_at < DATE_ADD(?, INTERVAL 1 DAY)')
      params.push(startDate, endDate)
    }

    const offset = (Number(page) - 1) * Number(limit)
    const sqlBase = `
      FROM transactions t
      JOIN users u ON u.id = t.user_id
      WHERE ${where.join(' AND ')}
    `

    const [rows] = await db.query(
      `SELECT
         t.id, t.user_id, u.username,
         t.amount, t.currency, t.expected_amount, t.status,
         t.created_at, t.updated_at
       ${sqlBase}
       ORDER BY t.id DESC
       LIMIT ?, ?`,
      [...params, offset, Number(limit)]
    )

    const [[cnt]] = await db.query(`SELECT COUNT(*) AS total ${sqlBase}`, params)
    const total = cnt.total
    const totalPages = Math.ceil(total / limit)  // ✅ 페이지 수 계산 추가

    console.log('[CTL-OUT]', { rows: rows.length, total, totalPages })
console.log('📤 [API 응답 데이터 확인]', {
  page,
  limit,
  total: cnt.total,
  totalPages,
  rows: rows.length
})
const formattedRows = rows.map(r => ({
  ...r,
  created_at: toManilaTime(r.created_at),
  updated_at: toManilaTime(r.updated_at)
}))
    // ✅ 프론트가 기대하는 포맷으로 반환
    return res.json({
      data: formattedRows,
      total,
      totalPages,      // ✅ 반드시 추가
      page: Number(page),
      limit: Number(limit)
    })
  } catch (e) {
    console.error('[CTL-ERR getWalletWithdrawList]', e)
    return res.status(500).json({ message: 'Failed to load list' })
  }
}


//사이트 내 출금 신청 승인/거절API 0721 관리자
exports.approveWithdrawTransaction = async (req, res) => {
  const transactionId = req.params.id
  const adminId = req.admin?.id || null // 로그인한 관리자 ID

  try {
    // 🔹 1. 트랜잭션 조회
    const [rows] = await db.execute(
      'SELECT * FROM transactions WHERE id = ? AND type = ? AND status = ?',
      [transactionId, 'wallet_withdraw', 'pending']
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
        'UPDATE transactions SET status = ?, admin_id = ?, updated_at = NOW() WHERE id = ?',
        ['completed', adminId, transactionId]
      );


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
        'UPDATE user_balances SET balance = balance - ? WHERE user_id = ?',
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
exports.rejectWithdrawTransaction = async (req, res) => {
  const transactionId = req.params.id;
  const adminId = req.admin?.id || null;
  const { reason } = req.body;

  if (!reason || reason.trim() === '') {
    return res.status(400).json({ message: '거절 사유를 입력해주세요.' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT * FROM transactions WHERE id = ? AND type = ? AND status = ?',
      [transactionId, 'wallet_withdraw', 'pending']
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
subject: '❌ Notification: Withdrawal Request Declined',
content: `We regret to inform you that your withdrawal request for ${tx.amount} ${tx.currency} has been declined.\n\nReason: ${reason}\n\nIf you believe this is an error or need assistance, please contact our support team.`,

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

// 2. 중복 신청 방지 - 금액 관련 전체로 확장
const [existing] = await db.execute(
  `SELECT id FROM transactions
   WHERE user_id = ? AND status = 'pending' AND type IN (
      'charge', 'withdraw', 'wallet_to_platform', 'platform_to_wallet', 'platform_to_platform'
   )`,
  [userId]
);
if (existing.length > 0) {
   return res.status(400).json({ message: 'You already have a pending money-related request.' });
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
// 1) toCurrency 결정: 'wallet' 또는 빈값이면 USD, 그 외엔 플랫폼에서 조회
let toCurrency = 'USD';
if (to_platform_id && to_platform_id !== 'wallet') {
  const [[toPlat]] = await db.execute(
    `SELECT currency FROM platforms WHERE id = ?`,
    [to_platform_id]
  );
  toCurrency = toPlat?.currency || 'USD';
}

// 2) fromCurrency 결정: 기본 USD, 플랫폼 선택 시 플랫폼 통화 조회
let fromCurrency = 'USD';
if (from_type === 'platform') {
  const [[fromPlat]] = await db.execute(
    `SELECT currency FROM platforms WHERE id = ?`,
    [from_platform_id]
  );
  fromCurrency = fromPlat?.currency || 'USD';
}

// 3) 서로 다른 통화일 때만 환율 검증
if (fromCurrency !== toCurrency) {
  const cleanRate = parseFloat(parseFloat(exchange_rate).toFixed(6));
  const expected = Math.floor(amount * cleanRate);

  console.log('--- 환율 검증 로깅 ---');
  console.log('fromCurrency:', fromCurrency);
  console.log('toCurrency:', toCurrency);
  console.log('amount:', amount);
  console.log('exchange_rate:', exchange_rate);
  console.log('expected_amount (프론트 보낸 값):', expected_amount);
  console.log('expected (서버 계산):', expected);

  if (expected !== expected_amount) {
    return res.status(400).json({
      message:
      'Expected amount does not match calculated amount based on exchange rate.'
    });
  }
}

// 5.5. 트랜잭션 타입 결정 (수정본)
let transactionType = 'unknown';

if (
  from_type === 'wallet' &&               // 출발이 내 지갑이고
  !from_platform_id &&                     // from_platform_id 가 비어 있고
  to_platform_id &&                        // to_platform_id 가 존재하며
  to_platform_id !== 'wallet'              // 내 지갑 아닐 때
) {
  transactionType = 'wallet_to_platform';  // 지갑 → 플랫폼
}
else if (
  from_type === 'platform' &&              // 출발이 플랫폼이고
  from_platform_id &&                      // from_platform_id 가 채워져 있으며
  (!to_platform_id || to_platform_id === 'wallet') // to_platform_id 가 비어 있거나 내 지갑일 때
) {
  transactionType = 'platform_to_wallet';  // 플랫폼 → 지갑
}
else if (
  from_type === 'platform' &&              // 출발이 플랫폼이고
  from_platform_id &&                      // from_platform_id 가 채워져 있으며
  to_platform_id &&                        // to_platform_id 가 존재하며
  to_platform_id !== 'wallet'              // 내 지갑 아닐 때
) {
  transactionType = 'platform_to_platform';// 플랫폼 → 플랫폼
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

// 📢 머니이동 신청시 텔레그램 알림 추가!
await sendTelegramMessage(
  `[머니이동 신청]\n유저ID: ${userId}\n유형: ${transactionType}\n출발: ${from_type} ${from_platform_id || ''}/${from_platform_user_id || ''}\n도착: ${to_platform_id || ''}/${to_platform_user_id || ''}\n금액: ${amount}\n환산금액: ${expected_amount || ''}\n메모: ${memo || '-'}`
);

    return res.json({ message: 'Transfer request submitted successfully.' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'server errer' });
  }
};
// 머니이동 사용자 신청 이력조회 (0724)
exports.getPlatformMoveHistory = async (req, res) => {
  const userId = req.user?.id;
  console.log('📥 [getPlatformMoveHistory] 요청 도착');
  console.log('👤 userId:', userId);

  const { status, from_type, to_platform_id, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  console.log('🔍 query params:', { status, from_type, to_platform_id, page, limit, offset });

  try {
    let baseSql = `
      FROM transactions
      WHERE user_id = ? 
        AND type IN ('wallet_to_platform', 'platform_to_wallet', 'platform_to_platform', 'transfer')
    `;

    const params = [userId];

    if (status) { baseSql += ` AND status = ?`; params.push(status); }
    if (from_type) { baseSql += ` AND from_type = ?`; params.push(from_type); }
    if (to_platform_id) { baseSql += ` AND to_platform_id = ?`; params.push(to_platform_id); }

    const dataSql = `
      SELECT 
        id,
        amount,
        type,
        currency,
        to_platform_id,
        to_platform_user_id,
        expected_amount,
        exchange_rate,
        from_type,
        from_platform_id,
        from_platform_user_id,
        user_memo AS memo,
        status,
        confirmed_by_admin,
        admin_note,
        created_at,
        updated_at
      ${baseSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    console.log('📄 dataSql 실행');
    const [data] = await db.query(dataSql, [...params, parseInt(limit), parseInt(offset)]);
    console.log('✅ data length:', data.length);

    const countSql = `SELECT COUNT(*) AS total ${baseSql}`;
    console.log('📄 countSql 실행');
    const [count] = await db.query(countSql, params);

    const total = count[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);
    console.log('📊 total:', total, '➡️ totalPages:', totalPages);

    res.status(200).json({
      success: true,
      data,
      total,
      totalPages,
      currentPage: parseInt(page),
      limit: parseInt(limit),
    });
    console.log('✅ 응답 전송 완료');
  } catch (error) {
    console.error('❌ getPlatformMoveHistory error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch move history.' });
  }
};



// 머니이동 관리자 승인/거절
// 승인 시: transactions 상태 'completed'로 변경, user_balances 업데이트, site_transactions 기록 남김
// 거절 시: transactions 상태 'rejected'로 변경, user_balances / site_transactions 변화 없음

exports.approvePlatformMove = async (req, res) => {
  const { id } = req.params;
  if (!req.user?.id) return res.status(401).json({ message: 'Unauthenticated' });
  const adminId = req.user.id;

  const connection = await db.getConnection();
  try {
    console.log('📥 승인 요청 ID:', id);
    const [txRows] = await connection.query(
      `SELECT id, user_id, amount, from_type, to_platform_id, to_platform_user_id, status, type
       FROM transactions
       WHERE id=? 
         AND type IN ('wallet_to_platform','platform_to_platform','platform_to_wallet') 
         AND status='pending'`,
      [id]
    );

    const tx = txRows[0];
    if (!tx) return res.status(404).json({ message: 'Transfer request not found or already processed.' });

    await connection.beginTransaction();

    // ✅ transactions 상태 'completed'로 변경
    await connection.execute(
      `UPDATE transactions 
         SET status='completed', confirmed_by_admin=1, admin_id=?, updated_at=NOW() 
       WHERE id=? AND status='pending'`,
      [adminId, id]
    );
    console.log('🟢 transactions 상태 업데이트 완료');

    // 💸 지갑 → 플랫폼 (출금)
    if (tx.type.trim() === 'wallet_to_platform') {
      const [balRows] = await connection.execute(
        'SELECT balance FROM user_balances WHERE user_id=?',
        [tx.user_id]
      );

      const currentBalance = Number(balRows[0]?.balance ?? 0);
      const amount = Number(tx.amount);

      if (currentBalance < amount) {
        await connection.rollback();
        console.log('❌ 잔액 부족. current:', currentBalance, '요청금액:', amount);
        return res.status(400).json({ message: 'Insufficient wallet balance.' });
      }

      await connection.execute(
        'UPDATE user_balances SET balance = balance - ? WHERE user_id=?',
        [amount, tx.user_id]
      );
      console.log('💳 wallet_to_platform 출금 완료');
    }

    // 💰 플랫폼 → 지갑 (입금)
    if (tx.type === 'platform_to_wallet') {
      const amount = Number(tx.amount);
      await connection.execute(
        `INSERT INTO user_balances (user_id, balance)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE balance = balance + VALUES(balance)`,
        [tx.user_id, amount]
      );
      console.log('💰 platform_to_wallet 입금 완료');
    }

    // site_transactions 기록
    await connection.execute(
      `INSERT INTO site_transactions
         (user_id, type, amount, reason, from_type, to_platform_id, to_platform_user_id, 
          status, approved_by_admin, admin_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', 1, ?, NOW(), NOW())`,
      [
        tx.user_id,
        'platform_move',
        tx.amount,
        '머니이동 승인',
        tx.from_type,
        tx.to_platform_id,
        tx.to_platform_user_id,
        adminId,
      ]
    );

    await connection.commit();
    return res.json({ message: 'Transfer approved successfully.' });
  } catch (err) {
    try {
      await connection.rollback();
    } catch {}
    console.error('❌ approvePlatformMove error:', err);
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  } finally {
    connection.release();
  }
};


// 사용자 머니 이동 신청 거절 API + 쪽지 발송
exports.rejectPlatformMove = async (req, res) => {
  const { id } = req.params;              // transactions.id
  const { reason } = req.body || {};

  // 1) 인증 가드
  if (!req.user?.id) return res.status(401).json({ message: 'Unauthenticated' });
  const adminId = req.user.id;

  // 2) 입력 가드
  if (!reason) return res.status(400).json({ message: 'Rejection reason is required.' });

  try {
    // 3) 존재/상태 가드
    const [rows] = await db.query(
      `SELECT id, user_id, status
         FROM transactions
        WHERE id=? 
          AND type IN ('wallet_to_platform','platform_to_platform','platform_to_wallet')
          AND status='pending'`,
      [id]
    );
    const tx = rows[0];
    if (!tx) return res.status(404).json({ message: 'Transfer request not found or already processed.' });

    // 4) 상태 업데이트
    await db.query(
      `UPDATE transactions 
          SET status='rejected',
              confirmed_by_admin=0,
              admin_note=?,
              admin_id=?,
              updated_at=NOW()
        WHERE id=?`,
      [reason, adminId, id]
    );

    // 5) 사용자 알림(쪽지)
    await sendMessage({
      to_user_id: tx.user_id,
      subject: '❌ Your request to transfer funds has been denied',
      content: reason,
      type: 'system'
    });

    return res.json({ message: 'Transfer request rejected and message sent to user.' });
  } catch (error) {
    console.error('❌ rejectPlatformMove error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};


//머니이동 관리자  요청 조회 0724
//머니이동 관리자 요청 조회 (수정됨)
// 관리자 - 머니 이동 신청 목록 (페이징 포함)
exports.getAllMoveRequests = async (req, res) => {
  console.log('📥 [getAllMoveRequests] 요청 도착');

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const offset = (page - 1) * limit;

  try {
    // ✅ 데이터 조회 쿼리
    const dataSql = `
      SELECT 
        t.id,
        t.user_id,
        u.username,
        t.amount,
        t.status,
        t.currency,
        t.from_type,
        t.from_platform_id,
        t.from_platform_user_id,
        t.to_platform_id,
        t.to_platform_user_id,
        t.expected_amount,
        t.exchange_rate,
        t.user_memo,
        t.admin_note,
        t.confirmed_by_admin,
        t.created_at,
        t.updated_at
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.type IN (
        'wallet_to_platform',
        'platform_to_wallet',
        'platform_to_platform',
        'transfer'
      )
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(dataSql, [limit, offset]);

    // ✅ 전체 개수 조회 쿼리
    const [countResult] = await db.query(`
      SELECT COUNT(*) AS total
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.type IN (
        'wallet_to_platform',
        'platform_to_wallet',
        'platform_to_platform',
        'transfer'
      )
    `);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    console.log('📊 총 개수:', total, '| 총 페이지:', totalPages);
const formattedRows = rows.map(r => ({
  ...r,
  created_at: toManilaTime(r.created_at),
  updated_at: toManilaTime(r.updated_at)
}))
    res.status(200).json({
      success: true,
      data: formattedRows,
      total,
      totalPages,
      currentPage: page,
      limit,
    });
  } catch (error) {
    console.error('❌ getAllMoveRequests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch move requests.',
    });
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
      const formattedData = data[0].map(r => ({
        ...r,
        created_at: toManilaTime(r.created_at),
        updated_at: toManilaTime(r.updated_at)
      }))
    res.json({
      data: formattedData,
      total: count[0][0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    })
  } catch (err) {
    console.error('❌ 전체 신청내역 조회 실패:', err)
    res.status(500).json({ message: '서버 오류' })
  }
}


