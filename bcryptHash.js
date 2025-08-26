// bcryptHash.js
const bcrypt = require('bcryptjs');

const plainPassword = '11111';

bcrypt.hash(plainPassword, 10).then(hash => {
  console.log('🔐 해시된 비밀번호:', hash);
});
