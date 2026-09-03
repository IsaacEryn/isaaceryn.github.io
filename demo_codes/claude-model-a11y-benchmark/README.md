# Claude 모델별 생성 코드 접근성 벤치마크

블로그 글 「Claude 4모델 생성 코드 접근성 실측」에서 쓴 스크립트 그대로입니다.
접근성을 언급하지 않은 프롬프트로 모달·폼을 생성시키고, 자동 검사와 패턴 집계로 비교합니다.

## 준비물

- Claude Code CLI (로그인 상태). `claude -p "OK"`가 답하면 준비된 것
- Python 3 (표준 라이브러리만 씀)
- 자동 검사: [A11y Check](https://www.a11ychk.com/) 또는 `npx @axe-core/cli`

## 순서

```bash
# 1) 생성 — 모델 ID를 쉼표로. 모델당 10개 파일(모달 5·폼 5)이 gen/ 아래에 쌓인다
./gen.sh claude-fable-5-1,claude-opus-5,claude-sonnet-5

# 2) 자동 검사 — 정적 HTML이라 로컬 서버 하나 띄우고 검사기에 넘기면 된다
npx serve gen            # http://localhost:3000/claude-opus-5/P_MODAL/run1.html 처럼 열림
npx @axe-core/cli http://localhost:3000/claude-opus-5/P_MODAL/run1.html

# 3) 패턴 집계 — 자동 검사가 못 보는 동작 코드(포커스 트랩·복원·검증 타이밍)를 센다
python3 check.py claude-fable-5-1,claude-opus-5,claude-sonnet-5

# 4) (선택) 터미널 캡처 이미지
python3 render-terminal.py 30 out.svg && rsvg-convert -w 1200 out.svg -o out.png
```

## 읽는 법

- `gen/<모델>/<프롬프트>/runN.html.meta.json`의 `modelUsage`가 실제 응답 모델입니다. 요청한 모델과 다르면 그 런은 버리세요.
- `check.py`의 정규식은 이 실험의 생성물에 맞춰 조정한 것이라, 다른 프롬프트에선 오탐이 납니다. **숫자를 믿기 전에 파일을 직접 읽으세요.** 글에서도 정규식이 두 번 틀렸고, 코드를 읽어서 잡았습니다.
- 자동 검사 100%는 "정적으로 볼 수 있는 건 통과"라는 뜻이지 "접근성 문제 없음"이 아닙니다. 닫힌 모달은 검사기 눈에 보이지도 않습니다.
