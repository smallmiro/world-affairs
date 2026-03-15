#!/usr/bin/env bash
# db/data.sqlite 파일에 변경이 있으면 commit + push
# Usage: crontab -e → 0 * * * * /path/to/scripts/commit-data.sh

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

# 변경 감지
if git diff --quiet -- db/data.sqlite; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] db/data.sqlite: 변경 없음, 스킵"
  exit 0
fi

git add db/data.sqlite
git commit -m "data: 최신 데이터 스냅샷"
git push

echo "[$(date '+%Y-%m-%d %H:%M:%S')] db/data.sqlite: commit & push 완료"
