#!/usr/bin/env bash
set -euo pipefail

# 사용법:
#   _sh_scripts/publish.sh "feat: update demos"
#   _sh_scripts/publish.sh --skip-build "fix: typo"
#   _sh_scripts/publish.sh              # 자동 메시지

MSG=""
SKIP_BUILD="false"

for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD="true" ;;
    *) MSG="$arg" ;;
  esac
done

if [[ -z "${MSG}" ]]; then
  MSG="chore: publish $(date +'%Y-%m-%d %H:%M:%S %Z')"
fi

# 1) (선택) 로컬 체크
if [[ "${SKIP_BUILD}" != "true" ]]; then
  echo "No build step for this repo. (skip-build not required)"
fi

# 2) 깃 커밋/푸시
echo "Staging changes..."
git add -A

# 변경 사항 없으면 종료
if git diff --cached --quiet; then
  echo "No changes to commit."
  exit 0
fi

echo "Committing..."
git commit -m "${MSG}"

# 현재 브랜치 이름 자동 추출
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "Pushing to origin/${BRANCH}..."
git push origin "${BRANCH}"

echo "Done. GitHub Pages will deploy from ${BRANCH} if configured."
