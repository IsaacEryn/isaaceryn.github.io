# 커스터마이즈 select 스크린 리더 실측

블로그 글 「커스터마이즈 select, 스크린 리더로 크롬과 사파리 27 비교」(codeslog, 초안)의 데모와 측정 스크립트입니다.

`index.html`에 같은 "머그 색상" select를 옵션 모양만 바꿔 열 개 두었습니다(s0 기본 select, s1~s9 `appearance: base-select`).
아이콘만 있는 옵션의 이름을 이미지 alt(s3), option의 label(s4), 화면에서만 숨긴 글자(s9)로 준 경우를 비교합니다.

## 측정

```bash
python3 -m http.server 8733 --bind 127.0.0.1    # 다른 터미널
node measure/inspect.mjs         # 크롬 접근성 트리, 강제 색 모드 화면
node measure/typeahead.mjs       # 타이프어헤드(영문 옵션으로)
node measure/forced-colors.mjs   # 강제 색 모드에서 비활성 옵션 색
python3 -I measure/vo-select.py  # VoiceOver 낭독(맥, AppleScript 제어 허용). 사파리 목록 안 이동은 --nav right
node measure/recommended.mjs     # 권장 조합(아이콘 + 숨긴 글자 + selectedcontent) 확인
node measure/shots.mjs           # 글에 넣은 화면 캡처
```

자동화 도구로 조종하기 어려운 브라우저는 `index.html?report=1`로 열면 select마다 파싱 결과가 맨 위에 글자로 나옵니다.
글의 파이어폭스 결과는 정식판 158.0.1을 헤드리스 스크린숏(`firefox -headless -screenshot`)으로 찍어 읽었습니다.
