// bcryptTest.js
const bcrypt = require('bcryptjs');

const plain = '11111';
const hash = '$2b$10$Fa6XHdCvbZ8MofV6vn2JE.z9yVcd6.tyXLxNBeqLBpDgF1NlZwTAu';

bcrypt.compare(plain, hash)
  .then(result => {
    console.log('✅ 일치 여부:', result);
  })
  .catch(err => {
    console.error('❌ 오류:', err);
  });
  