const bcrypt = require('bcryptjs');

(async () => {
  const hash = await bcrypt.hash('1234', 10); // 여기서 '1234'는 새 비밀번호
  console.log(hash);
})();
