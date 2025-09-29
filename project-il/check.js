// check.js
const bcrypt = require('bcryptjs');

const hashed = '$2b$10$HnsQLYuopgvk13srwmZFsO19ONjClsh1DZNFoI2NFl4qdPK0d9m/.';

// 후보 비밀번호들
const candidates = ['1234', 'password', 'test123', '비밀번호123'];

(async () => {
  for (const pw of candidates) {
    const match = await bcrypt.compare(pw, hashed);
    if (match) {
      console.log(`✅ 일치: ${pw}`);
      return;
    }
  }
  console.log('❌ 후보 리스트에 일치하는 값 없음');
})();
