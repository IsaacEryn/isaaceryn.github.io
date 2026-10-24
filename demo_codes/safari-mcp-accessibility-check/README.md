# Safari MCP 접근성 점검 실측

블로그 글 「Safari MCP로 접근성 점검이 될까, MCP 세 가지에 같은 페이지 맡겨 보기」(codeslog, 초안)의 케이스와 측정 스크립트입니다.

## 케이스

`cases/c1.html`~`c8.html`은 [Lighthouse 에이전트 브라우징 실측](../lighthouse-agentic-browsing/)의 결함 페이지 8개를 복사한 것입니다.
에이전트가 답을 읽지 못하게 안내문(case-note), 결함을 설명하는 제목과 CSS·JS 주석을 지웠습니다. 결함 자체는 원본과 같습니다.

| 케이스 | 결함 |
|---|---|
| c1 | 없음(기준 페이지) |
| c2 | 이미지 alt 누락, 가격·설명 대비 약 2.4:1, html lang 누락 |
| c3 | div로 만든 장바구니 버튼 |
| c4 | 이름 없는 아이콘 버튼 |
| c5 | 보이는 글자와 다른 aria-label |
| c6 | aria-label 키워드 채우기 |
| c7 | 카드 전체 aria-hidden |
| c8 | 검색창 label 삭제 |

## 측정

```bash
python3 -m http.server 8734 --bind 127.0.0.1 -d cases   # 다른 터미널
node measure/tool-output.mjs                            # AI 없이 세 도구의 페이지 읽기 결과 저장
node measure/run-audit.mjs --tool safari --runs 2       # safari | devtools | playwright
node measure/run-audit.mjs --tool safari --mode readonly --runs 1   # 이동·읽기 도구만 남긴 변형
node measure/score.mjs                                  # 결함별 검출 집계(results/audit-summary.md)
```

- Safari MCP는 사파리 설정 > Advanced > "Show features for web developers", 설정 > Developer > "Allow remote automation and external agents"를 켜야 합니다. 자동화 세션이 하나씩만 열려 차례로 돕니다
- 에이전트는 Claude Code(`claude -p`), 모델은 Claude Sonnet 5.5. 내장 도구는 끄고 MCP 서버 하나만 붙입니다
- `score.mjs`는 정규식으로 1차 채점하고, 사람이 읽고 뒤집은 판정은 `results/overrides.json`에 둡니다
- `tool-output.mjs`에 `HIDDEN_BASE=http://127.0.0.1:8731`을 주면 숨김 통로 실측 페이지(`../bug-hunting-hidden-prompt-injection/pages`)도 Safari MCP로 읽습니다
