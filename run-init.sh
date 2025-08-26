#!/bin/bash

DB_USER="mypoint_user"       # 여기에 너의 실제 DB 유저명
DB_PASS="AriCat0321!"         # 여기에 실제 비밀번호
DB_NAME="mypoint"            # 여기에 실제 DB 이름

echo "⏳ 스키마 등록 중..."
mysql -u $DB_USER -p$DB_PASS $DB_NAME < /home/prod/project-il/schema/init.sql

if [ $? -eq 0 ]; then
  echo "✅ 스키마 등록 완료!"
else
  echo "❌ 오류 발생. 확인 필요."
fi
