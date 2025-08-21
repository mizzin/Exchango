const db = require('../db');

const findByUsername = async (username) => {
  const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
  return rows[0];
};

module.exports = {
  findByUsername,
};