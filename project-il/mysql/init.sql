--  사용자 기본 정보 + 상태 관리
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  money_password CHAR(60),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  country_code VARCHAR(5),
  referral_id VARCHAR(50),
  language VARCHAR(5),
  status ENUM('pending', 'approved', 'rejected', 'blocked') DEFAULT 'pending',
  rejected_reason TEXT,
  warning_count INT DEFAULT 0,
  real_name VARCHAR(100),
  bank_name VARCHAR(100),
  bank_account VARCHAR(100),
  role ENUM('user', 'admin') DEFAULT 'user',
  admin_note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
--   내 지갑(USD) 잔액 관리
CREATE TABLE IF NOT EXISTS user_balances (
  user_id INT PRIMARY KEY,
  balance DECIMAL(10,2) DEFAULT 0.00,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--   내부 지갑 내 거래 이력만남김 (충전, 출금, 차감, 플랫폼이동)
CREATE TABLE IF NOT EXISTS site_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('charge', 'deduct', 'withdraw', 'platform_move') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255),
  approved_by_admin BOOLEAN DEFAULT FALSE, 
  password_verified BOOLEAN DEFAULT FALSE,
  admin_id INT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
);
ALTER TABLE site_transactions
ADD COLUMN status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
ADD COLUMN from_platform_id VARCHAR(10),
ADD COLUMN to_platform_id VARCHAR(10),
ADD COLUMN from_platform_user_id VARCHAR(50),
ADD COLUMN to_platform_user_id VARCHAR(50);
ADD COLUMN memo TEXT,
ADD COLUMN reject_reason TEXT,
ADD COLUMN from_type ENUM('wallet', 'platform') DEFAULT 'wallet' AFTER reason,
ADD COLUMN exchange_rate DECIMAL(18,6) DEFAULT NULL AFTER to_platform_user_id,
ADD COLUMN updated_at DATETIME DEFAULT NULL;



CREATE TABLE IF NOT EXISTS email_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE IF NOT EXISTS platforms (
  id VARCHAR(10) PRIMARY KEY
);

-- ✅ user_platforms 테이블 (플랫폼 정보 최대 4개)
CREATE TABLE IF NOT EXISTS user_platforms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  platform_id INT VARCHAR(10) NULL,
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
  template_key VARCHAR(50) UNIQUE,
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
--   모든 요청 기록을 이 테이블에 통합
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
 
-- 1. ENUM → VARCHAR(50)로 임시 변경0721
ALTER TABLE transactions MODIFY COLUMN type VARCHAR(50);

-- 2. 기존 데이터 타입 값 매핑 업데이트
UPDATE transactions SET type = 'wallet_charge' WHERE type = 'charge';
UPDATE transactions SET type = 'wallet_withdraw' WHERE type = 'withdraw';

-- 3. 새로운 ENUM 타입으로 재설정
ALTER TABLE transactions
MODIFY COLUMN type ENUM(
  'wallet_charge',     -- 내 지갑 충전
  'platform_charge',   -- 플랫폼으로 바로 충전
  'wallet_withdraw',   -- 내 지갑에서 출금
  'platform_withdraw', -- 플랫폼으로 출금
  'transfer',          -- 머니 이동 (내 지갑 → 플랫폼)
  'reward',            -- 보상
  'penalty'            -- 패널티 또는 차감
) NOT NULL;

-- 2. 머니 이동 관련 컬럼 추가
ALTER TABLE transactions
  ADD COLUMN from_type ENUM('wallet', 'platform') AFTER type,
  ADD COLUMN from_platform_id VARCHAR(10) AFTER from_type,
  ADD COLUMN from_platform_user_id VARCHAR(50) AFTER from_platform_id,
  ADD COLUMN to_platform_id VARCHAR(10) AFTER platform_user_id,
  ADD COLUMN to_platform_user_id VARCHAR(50) AFTER to_platform_id,
  ADD COLUMN exchange_rate DECIMAL(10,4) AFTER user_memo,
  ADD COLUMN expected_amount DECIMAL(10,2) AFTER exchange_rate;

ALTER TABLE transactions ADD COLUMN expected_amount DECIMAL(10,2) NULL;
ALTER TABLE transactions MODIFY COLUMN type VARCHAR(30);


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
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('signup', 'deposit', 'withdrawal') NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
