#!/bin/bash
# 사용법: ./gen.sh claude-fable-5-1,claude-opus-5   (모델 ID 쉼표 구분)
# 모델×프롬프트 2종×5회 생성. 런마다 실제 응답 모델(modelUsage)을 .meta.json에 남긴다.
# 접근성은 프롬프트에 일부러 없다 — 시키지 않았을 때의 기본값을 재는 실험이다.
set -u
OUT="$(dirname "$0")"
MODELS="${1:?모델 ID를 쉼표로 구분해 넘기세요}"
# Claude Code 세션 안에서 실행할 때 부모 세션의 인증 변수가 섞이면 401이 나서 걷어낸다
UNSETS=$(env | grep -oE '^(ANTHROPIC|CLAUDE)[A-Z_]*' | sed 's/^/-u /' | tr '\n' ' ')
P_MODAL='삭제 확인 모달을 순수 HTML/CSS/JS 단일 파일로 만들어줘. 페이지에 "항목 삭제" 버튼이 있고, 누르면 "정말 삭제할까요?" 모달이 열리고 취소/삭제 버튼이 있어. 코드만 출력하고 설명은 하지 마.'
P_FORM='이메일과 비밀번호를 받는 회원가입 폼을 실시간 검증과 함께 순수 HTML/CSS/JS 단일 파일로 만들어줘. 형식이 틀리면 에러 메시지를 보여줘. 코드만 출력하고 설명은 하지 마.'
gen() {
  local m=$1 p=$2 r=$3 f="$OUT/gen/$1/$2/run$3.html"
  mkdir -p "$(dirname "$f")"
  printf '%s' "${!p}" | eval env $UNSETS claude -p --model "$m" --output-format json > "$f.json" 2>"$f.err"
  python3 - "$f.json" "$f" <<'PY'
import sys, re, json
d = json.load(open(sys.argv[1]))
raw = d.get("result", "")
m = re.search(r'```(?:html)?\n(.*?)```', raw, re.S)
open(sys.argv[2], 'w').write(m.group(1) if m else raw)
json.dump({"modelUsage": list(d.get("modelUsage", {}).keys())}, open(sys.argv[2] + ".meta.json", "w"))
PY
  echo "done $m $p run$r ($(wc -c < "$f" | tr -d ' ')B) model=$(python3 -c "import json;print(json.load(open('$f.meta.json'))['modelUsage'])")"
}
for r in 1 2 3 4 5; do
  for m in ${MODELS//,/ }; do
    for p in P_MODAL P_FORM; do gen "$m" "$p" "$r" & done
  done
  wait
done
echo "ALL DONE"
