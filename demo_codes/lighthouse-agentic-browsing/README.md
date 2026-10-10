# Lighthouse 에이전트 브라우징 실측

블로그 글 [「Lighthouse 에이전트 브라우징 실측: 2/2인데 키보드로 못 누르는 버튼」](https://www.codeslog.com/posts/lighthouse-agentic-browsing-accessibility/)([English](https://www.codeslog.com/en/posts/lighthouse-agentic-browsing-accessibility/))에서 쓴 테스트 페이지와 측정 스크립트입니다.
같은 쇼핑 화면에 접근성 결함을 넣은 케이스 8개(기준 1 + 결함 7)를 Lighthouse와 Playwright로 재고(측정 스크립트), 에이전트용 MCP 서버 두 가지로는 직접 찍고 눌러 비교했습니다(`tool-snapshots.md`).

## 구성

- `index.html` — 케이스 목록과 실측 결과
- `cases/` — 테스트 페이지 8개. `case.css`·`case.js`·`mug.svg`를 공유합니다. 02는 세 곳(alt·대비·lang), 06은 세 요소(버튼과 메뉴 링크 두 개)를 바꿨고 나머지는 한 곳씩 바꿨습니다
- `measure/` — 측정 스크립트
  - `measure.mjs` — 케이스 8개를 Lighthouse 판정, 역할·이름 조회, 키보드 조회, 스냅샷 기록으로 잽니다
  - `measure-sites.mjs` — `sites.txt`의 실제 사이트를 같은 기준으로 잽니다. 여러 번 재서 다수결로 요약합니다
  - `lib.mjs` — 두 스크립트가 같이 쓰는 판정 로직(트리 감사의 axe 규칙 33개 목록 포함)

## 준비물

- Node.js 22.19 이상 (Lighthouse 13.5.0 요구 사항)
- 설치된 Chrome. Playwright는 정식판 Chrome을 씁니다(`channel: 'chrome'`). Lighthouse는 npm의 13.5.0으로 재므로 크롬 버전과 상관없이 감사 7개를 봅니다(크롬 150 이상은 개발자 도구로 직접 돌릴 때의 조건). 맥에 Chrome Canary가 있으면 Lighthouse가 Canary로 도니, 정식판으로 맞추려면 `CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`을 주세요. 실제로 쓴 브라우저는 `summary.md` 둘째 줄에 남습니다
- `npm ci`는 `package-lock.json`대로 설치하므로 axe-core까지 같은 버전으로 잽니다

## 순서

```bash
git clone https://github.com/IsaacEryn/isaaceryn.github.io.git
cd isaaceryn.github.io/demo_codes/lighthouse-agentic-browsing/measure
npm ci
npm run measure                                             # 케이스 8개
npm run sites                                               # sites.txt의 사이트를 한 번
npm run sites -- --runs 3                                   # 세 번 재고 다수결로 요약
node measure-sites.mjs https://example.com                  # 사이트 하나만
node measure-sites.mjs --summarize results/sites-2026-10-02 # 저장된 실행 파일로 요약만 다시
```

`sites.txt`의 기본값은 이 블로그와 example.com뿐입니다. 글에 실린 사이트는 주석으로 남겨 두었습니다. 남의 사이트를 잴 때는 그 사이트의 접속 차단 정책과 이용약관을 먼저 확인하고, 차단을 우회하지 마세요.

## 결과 파일 (`measure/results/`)

- `summary.md`·`summary.json` — 케이스별 판정. 실행할 때마다 덮어씁니다
- `snapshots/<케이스>.default.yml` — Playwright 기본 aria 스냅샷(main 영역). 테스트 코드가 쓰는 형태입니다
- `snapshots/<케이스>.ai.yml` — Playwright AI 모드 스냅샷(main 영역). Playwright MCP의 `browser_snapshot`이 모델에게 주는 형태와 같습니다. 클릭할 수 있다는 표시(`cursor=pointer`)와, 화면에 보이는 `aria-hidden` 요소가 들어갑니다
- `tool-snapshots.md` — Playwright MCP와 Chrome DevTools MCP로 같은 케이스를 직접 찍고 눌러 본 기록(도구·버전·날짜·다시 찍는 법 포함). 측정 스크립트가 만드는 파일이 아닙니다
- `sites-<날짜>/` — 실제 사이트 측정. `run1.json`…은 실행별 원자료, `summary.md`·`summary.json`은 다수결 요약, `recheck-nodes.md`는 원측정이 남기지 않은 실패 요소를 검토 중 재측정으로 확인한 기록(2026-10-02 폴더만), `screens/`는 전체 화면 캡처(커밋하지 않음). 같은 날 다시 재면 `sites-<날짜>-2/`처럼 새 폴더가 생깁니다
- `reports/`·`screenshots/` — Lighthouse HTML 리포트와 점수 영역 캡처(커밋하지 않음)

## 읽는 법

- **케이스 페이지는 고정**이라 실행마다 결과가 같습니다. 실제 사이트는 배너·광고·팝업 때문에 실행마다 판정이 달라질 수 있어 여러 번 재고 다수결로 봅니다. 다수결과 다른 실행은 요약의 「실행마다 달랐던 값」에 적힙니다.
- **최종 주소의 호스트가 요청과 다르면**(앞의 `www.`는 무시) 다른 페이지를 쟀을 수 있어 요약 표에서 빼고 따로 적습니다. 2026-10-02 측정에서는 정부24가 자동 접속을 접속 차단 안내 페이지로 돌려보내 이 규칙으로 빠졌습니다. 실행 원자료(`run1~3.json`)에는 정부24 항목이 그대로 남아 있지만, 차단 안내 페이지를 잰 값이라 정부24 홈페이지의 결과가 아닙니다. 캡처를 보고 진짜 홈페이지라면 `sites.txt`의 주소를 최종 주소로 바꿔 다시 재세요. 같은 주소에서 봇 확인 화면을 주는 사이트는 이 규칙으로 걸러지지 않으니 `screens/`의 캡처도 확인하세요.
- **llms.txt와 ai-catalog.json**: Lighthouse는 사이트 루트의 `/llms.txt`와 `/.well-known/ai-catalog.json`을 봅니다. 없으면 "해당 없음"으로 빠집니다. 없는 주소에 404 대신 200을 돌려주는 사이트(소프트 404, 302로 오류 페이지에 보낸 뒤 200을 주는 경우 포함)는 그 HTML을 검사하다 실패로 잡힙니다.
- **역할·이름 조회**는 Playwright의 `getByRole`입니다. 이름으로 요소를 찾는 도구나 음성 제어에 가까운 방식이고, LLM 에이전트에게 과업을 시킨 결과가 아닙니다. MCP 에이전트는 스냅샷 속 ref를 골라 누르는데, 그 스냅샷이 도구마다 다릅니다(`tool-snapshots.md`).
- **개발자 도구 안의 Lighthouse 버전은 크롬 버전을 따라갑니다.** 리포트 맨 아래에서 버전을 확인하세요. 스크립트는 13.5.0을 고정해 씁니다(크롬 150은 13.3.0, 151은 13.4.0, 152부터 155까지는 13.4.1, 156부터 13.5.0). 케이스 판정은 13.3.0·13.4.1에서도 같았습니다.
- **에이전트형 브라우징은 구글이 아직 개발 중이라고 밝힌 카테고리입니다.** Lighthouse를 올리면 `lib.mjs`의 규칙 목록을 소스(`core/audits/agentic/agent-accessibility-tree.js`)와 대조하세요. 트리 감사가 실패했는데 목록과 맞는 규칙이 없으면 결과에 경고가 남습니다.

## 하지 않은 것

- 실제 LLM 에이전트(브라우저 에이전트 제품)에게 과업을 시키지 않았습니다.
- 스크린 리더와 음성 제어로 듣거나 말해 보지 않았습니다. 케이스 안내문의 사용자 영향은 접근성 트리와 WCAG 해설에 근거한 설명입니다.
- 데모는 아직 한국어만 있습니다(영문판은 글 번역 때 함께 만듭니다).
