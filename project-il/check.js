// check.js
const bcrypt = require('bcryptjs');

const hashed = '$2b$10$DwCMSTgF92BqQHZQgFuqmuONWb8EhKCsu8MSK6obgjittbMcCEd9G';
const plain = '123456'; // 실제 평문 비밀번호

(async () => {
  const match = await bcrypt.compare(plain, hashed);
  console.log(match ? '✅ 일치함' : '❌ 불일치함');
})();
