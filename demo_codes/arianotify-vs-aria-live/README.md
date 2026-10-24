# ariaNotify와 aria-live 낭독 비교

블로그 글 「ariaNotify가 Baseline이 됐다, aria-live와 VoiceOver로 나란히 재 보기」(codeslog, 초안)의 데모와 측정 스크립트입니다.

## 데모

`index.html`을 열고 위쪽에서 방식(aria-live / ariaNotify)을 고른 뒤 스크린 리더를 켜고 눌러 보세요.

- 장바구니 담기: `role="status"` 대 버튼에서 `ariaNotify()`
- 검증 실패: 틀린 칸으로 포커스를 옮기며 `role="alert"` 대 그 칸에서 `ariaNotify(…, { priority: 'high' })`
- 필터 결과 수: `role="status"` 대 체크박스에서 `ariaNotify()`

실측용 숨은 방식 두 가지는 주소로만 고릅니다: `?method=notify-normal`(우선순위 normal), `?method=describedby`(알림 없이 aria-describedby 연결).

## 자동 측정(맥)

1. VoiceOver 유틸리티 > General > "Allow VoiceOver to be controlled with AppleScript" 켜기
2. `python3 -I measure/serve.py 8732` (데모 폴더 최상위에서)
3. VoiceOver를 켜고 `python3 -I measure/vo-run.py` (조합마다 72초, 그동안 마우스·키보드를 건드리지 않기)
4. `python3 -I measure/analyze.py <태그>` → `measure/results/summary-<태그>.md`

`measure/vo-record.js`가 VoiceOver의 '마지막 문구'를 0.05초마다 읽고, 페이지는 상태를 바꾼 시각을 `/log`로 보냅니다. 두 기록을 시각으로 맞춰 읽음·끊김·누락을 셉니다(판정 기준은 `analyze.py` 맨 위 주석).

검증 실패 칸에는 `data-1p-ignore`가 붙어 있습니다. 1Password 확장이 입력란마다 자기 안내를 읽어 알림과 겹치기 때문입니다.
