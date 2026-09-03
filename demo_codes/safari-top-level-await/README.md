# Safari top-level await 재현

블로그 포스트 [Safari 27이 고친 top-level await 버그, 재봤더니 뒤 모듈까지 멈췄다](https://www.codeslog.com/posts/safari-top-level-await-fix/)의 데모.

## 구성

| 파일 | 역할 |
|---|---|
| `main.mjs` + `test-module.mjs` | WebKit 블로그 "Fixing top-level await in Safari"의 재현 코드를 브라우저용으로 옮김 — 같은 TLA 모듈을 동적 import 3회. 판정은 완료 순서가 아니라 **초기화 전 접근 실패 횟수**(순서는 Chrome도 반복하면 가끔 뒤바뀐다) |
| `static-entry.mjs` + `tla-a.mjs` + `sibling.mjs` + `tla-b.mjs` | 정적 import 그래프 `entry → tla-a(300ms) → sibling(동기) → tla-b(300ms)`. 뒤에 선언된 모듈이 앞 TLA가 끝나기를 기다리는지 `performance.mark`로 측정 — 판정은 `tla-b` 시작 < `tla-a` 완료 여부 |
| `index.html` | 두 결과를 화면 판정으로 표시하고 `document.title`에 짧게 씀(AppleScript `name of front document`로 자동 수집용). UA는 화면 하단에만 |

## 실측 결과 (2026-09-03)

| 환경 | 초기화 전 접근 실패 | 완료 순서 | TLA 두 개 정적 import 시 entry 실행 |
|---|---|---|---|
| Chrome 148·152 (가시 탭) | 0회 | 대체로 1,2,3 — 반복 시 2,1,3·3,1,2도 나옴 | 302ms — 병렬 (sibling 0 / tla-b 시작 0) |
| Safari 26.6 (macOS) | 2회 | 2,3,1 | 602ms — 직렬 |
| iOS 26.5 시뮬레이터 Safari | 2회 | 2,3,1 | 603ms — 직렬 (sibling 302 / tla-b 시작 302 / tla-a 완료 302) |

추가 대조 실험(같은 날, 변형 파일): sibling을 TLA보다 앞에 선언하면 Safari도 0ms에 평가 / TLA 1000ms면 뒤 모듈 지연도 1000ms / 다이아몬드 정적 그래프(b·c가 같은 TLA 모듈 t를 import)는 정상. 즉 옛 WebKit은 **선언 순서대로 직렬 평가**한다.

Safari 27 / Safari Technology Preview 243+에서는 WebKit 블로그·릴리스 노트 기준으로 스펙대로 동작한다(직접 확인 환경 없음).

## 주의

- Chrome은 탭이 백그라운드면 타이머가 늦춰져 시간값이 부풀 수 있다(1초 경계 정렬). 가시 탭에서 잴 것.
- 로컬 Safari를 자동화 권한 없이 읽으려면 `osascript -e 'tell application "Safari" to get name of front document'` 한 줄이면 된다.
