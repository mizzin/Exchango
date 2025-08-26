#!/bin/bash
LOG_DIR="/root/.pm2/logs"
BACKUP_DIR="/home/prod/project-il/logs_backup"
DATE=$(date +%Y-%m-%d)

mkdir -p "$BACKUP_DIR"

# project-il 로그 백업
cp "$LOG_DIR/project-il-out.log" "$BACKUP_DIR/project-il-out_$DATE.log"
cp "$LOG_DIR/project-il-error.log" "$BACKUP_DIR/project-il-error_$DATE.log"

# zakumdoor 로그 백업 (원하면 주석 해제)
# cp "$LOG_DIR/zakumdoor-out.log" "$BACKUP_DIR/zakumdoor-out_$DATE.log"
# cp "$LOG_DIR/zakumdoor-error.log" "$BACKUP_DIR/zakumdoor-error_$DATE.log"

# 7일 이상된 백업 삭제
find "$BACKUP_DIR" -type f -name "*.log" -mtime +7 -exec rm {} \;


