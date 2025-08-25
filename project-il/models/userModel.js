// models/userModel.js
console.log('📦 userModel 시작');

const db = require('../db');

const getAllUsers = async () => {
  const [rows] = await db.query('SELECT * FROM users');
  return rows;
};

const updateUser = async (id, user) => {
  const { username, phone } = user;
  await db.query(
    'UPDATE users SET username = ?, phone = ? WHERE id = ?',
    [username, phone, id]
  );
};

const deleteUser = async (id) => {
  await db.query('DELETE FROM users WHERE id = ?', [id]);
};

const deleteUserById = async (id) => {
  const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
  return result;
};

const getUserById = async (id) => {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0]; // 단일 객체 반환
};

const findUserByUsername = async (username) => {
  const [rows] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
  return rows[0]; // 존재하면 객체, 없으면 undefined
};
//0630
const updateBankInfo = async (userId, { real_name, bank_name, bank_account }) => {
  const query = `
    UPDATE users 
    SET real_name = ?, bank_name = ?, bank_account = ? 
    WHERE id = ?
  `
  const [result] = await db.execute(query, [real_name, bank_name, bank_account, userId])
  return result
}
// 사용자 저장
const createUser = async (data) => {
  const {
    username,
    password,
    email,
    phone,
    country_code,
    real_name,
    referral_id,
    language,
    money_password
  } = data;

  const [result] = await db.query(`
    INSERT INTO users (
      username, password, email, phone, country_code,
      real_name, referral_id, language, money_password
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    username,
    password,
    email,
    phone || null,
    country_code || null,
    real_name || null,
    referral_id || null,
    language || 'en',
    money_password 
  ]);

  return result.insertId; // 생성된 사용자 ID 반환
};
// 플랫폼 ID 저장
// ✅ 수정된 플랫폼 저장
const insertUserPlatforms = async (userId, platforms) => {
  const values = platforms
    .filter(p => p.platform_id && p.platform_user_id) // 둘 다 채워진 항목만 남기기
    .map(p => [userId, p.platform_id, p.platform_user_id]);

  if (values.length === 0) return; // 유효한 항목이 없으면 insert 생략

  await db.query(`
    INSERT INTO user_platforms (user_id, platform_id, platform_user_id)
    VALUES ?
  `, [values]);
};


const findUserByUsernameWithPassword = async (username) => {
  const [rows] = await db.query(`
    SELECT * FROM users WHERE username = ?
  `, [username]);
  return rows[0]; // id, password, status 포함
};

const findUserByIdWithPassword = async (id) => {
  const [rows] = await db.query(`SELECT id, password FROM users WHERE id = ?`, [id]);
  return rows[0];
};

const updatePassword = async (id, newHashedPassword) => {
  await db.query(`UPDATE users SET password = ? WHERE id = ?`, [newHashedPassword, id]);
};

const getAllPublicNotices = async (limit = 10) => {
  const [rows] = await db.query(
    'SELECT id, title, created_at FROM notices ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  return rows;
};

const getNoticeById = async (id) => {
  const [rows] = await db.query('SELECT * FROM notices WHERE id = ?', [id])
  return rows[0]
}

const getPrevNotice = async (id, lang) => {
  const [[row]] = await db.query(`
    SELECT id, title, created_at 
    FROM notices 
    WHERE id < ? AND language = ? 
    ORDER BY id DESC 
    LIMIT 1
  `, [id, lang])
  return row
}
const getNextNotice = async (id, lang) => {
  const [[row]] = await db.query(`
    SELECT id, title, created_at 
    FROM notices 
    WHERE id > ? AND language = ? 
    ORDER BY id ASC 
    LIMIT 1
  `, [id, lang])
  return row
}

module.exports = {
  getAllUsers,
  updateUser,
  deleteUser,
  deleteUserById,
  getUserById,
  findUserByUsername,
  createUser,
  insertUserPlatforms,
  findUserByUsername,
  findUserByUsernameWithPassword,
  findUserByIdWithPassword,
  updatePassword,
  getAllPublicNotices,
  getNoticeById,
  getPrevNotice,
  getNextNotice,
  updateBankInfo
};
