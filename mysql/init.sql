CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  country_code VARCHAR(5),
  referral_id VARCHAR(50),
  language VARCHAR(5),
  status ENUM('pending', 'approved', 'rejected', 'blocked') DEFAULT 'pending',
  rejected_reason TEXT, -- 거절 사유
  warning_count INT DEFAULT 0, -- 실시간 계산을 쓰더라도 남겨둠
  real_name VARCHAR(100),
  bank_name VARCHAR(100),
  bank_account VARCHAR(100),
  role ENUM('user', 'admin') DEFAULT 'user',
  admin_note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platforms (
  id VARCHAR(10) PRIMARY KEY
);

-- ✅ user_platforms 테이블 (플랫폼 정보 최대 4개)
CREATE TABLE IF NOT EXISTS user_platforms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  platform_id VARCHAR(10) NOT NULL,
  platform_user_id VARCHAR(50) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_platform (user_id, platform_id)
);

CREATE TABLE IF NOT EXISTS platform_translations (
  platform_id VARCHAR(10) NOT NULL,
  language VARCHAR(5) NOT NULL,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY (platform_id, language),
  FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
);
-- admins 테이블 (별도로 필요 없다면 생략 가능)
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL
);

-- ✅ messages 테이블 (쪽지 기능)
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  from_user_id INT, -- 관리자거나 시스템이면 NULL 가능
  to_user_id INT NOT NULL,
  subject VARCHAR(100),
  content TEXT,
  language VARCHAR(5),
  is_read BOOLEAN DEFAULT FALSE,
  type ENUM('normal', 'warning', 'system') DEFAULT 'normal',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS message_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(50) UNIQUE,
  label VARCHAR(100),
  content TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- ✅ warnings 테이블 (경고 기록)
CREATE TABLE IF NOT EXISTS warnings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reason TEXT,
  severity ENUM('notice', 'warning', 'block_candidate'),
  reset_group INT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('charge', 'withdraw') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,         -- 사용자가 입력한 USD 금액
  currency VARCHAR(5),                   -- 통화 종류 (KRW, PHP, USDT 등)
  krw_amount INT,                        -- 환전된 금액 (원화 기준 등)
  platform_name VARCHAR(50),            -- 플랫폼명 (예: 포커스타즈)
  platform_user_id VARCHAR(50),         -- 플랫폼 ID
  user_memo TEXT,                        -- 사용자가 입력한 메모 (출금 주소 등)
  status ENUM('pending', 'completed', 'cancelled', 'rejected') DEFAULT 'pending',
  confirmed_by_admin BOOLEAN DEFAULT FALSE, -- 관리자 승인 여부
  admin_note TEXT,                       -- 관리자가 남긴 메모
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100),
  content TEXT,
  language VARCHAR(5),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category VARCHAR(50),
  title VARCHAR(100),
  content TEXT,
  status ENUM('pending', 'answered', 'closed') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  answered_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inquiry_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inquiry_id INT NOT NULL,
  admin_id INT,
  answer TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE
);
