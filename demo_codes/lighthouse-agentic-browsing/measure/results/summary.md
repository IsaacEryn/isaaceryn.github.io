# 실측 결과

- Lighthouse 13.5.0 · Chrome 154.0.8037.95 · Playwright 1.63.0
- Lighthouse 실행 브라우저 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/154.0.0.0 Safari/537.36
- 측정 시각 2026-10-02T10:23:20.472Z

| 케이스 | 트리 감사 | 에이전트형 브라우징 | 접근성 점수 | 점수에 든 실패 | 숨은 실패(가중치 0) | 역할·이름 조회(버튼) | 역할·이름 조회(검색창) | 보이는 글자로 클릭 | 키보드 | 크롬 접근성 트리의 장바구니 요소 |
|---|---|---|---|---|---|---|---|---|---|---|
| 01-baseline 기준 페이지 | 통과 | 2/2 | 100 | 없음 | 없음 | O | O | O | O | button "장바구니 담기" |
| 02-missing-alt-contrast-lang alt·대비·lang 누락 | 통과 | 2/2 | 87 | color-contrast, html-has-lang, image-alt | 없음 | O | O | O | O | button "장바구니 담기" |
| 03-div-button div 버튼 | 통과 | 2/2 | 100 | 없음 | 없음 | X (0개) | O | O | X | generic "" |
| 04-unnamed-icon-button 이름 없는 아이콘 버튼 | 실패 (button-name) | 1/2 | 95 | button-name | 없음 | X (0개) | O | X | O | button "" |
| 05-label-in-name-mismatch 보이는 글자 ≠ aria-label | 통과 | 2/2 | 100 | 없음 | label-content-name-mismatch | X (0개) | O | O | O | button "상품을 카트에 추가" |
| 06-aria-keyword-stuffing aria-label 키워드 채우기 | 통과 | 2/2 | 100 | 없음 | 없음 | O | O | O | O | button "장바구니 담기 최저가 무료배송 오늘출발 한정특가 쿠폰할인" |
| 07-aria-hidden-mistake 카드 전체에 aria-hidden | 실패 (aria-hidden-focus) | 1/2 | 96 | aria-hidden-focus | 없음 | X (0개) | O | O | O | 트리에서 숨겨짐(ariaHiddenSubtree) |
| 08-unlabeled-search 레이블 없는 검색창 | 실패 (label) | 1/2 | 95 | label | 없음 | O | X | O | O | button "장바구니 담기" |

## 스냅샷 속 장바구니 요소

main 영역 스냅샷에서 상품 카드 안의 해당 줄. 전체는 `snapshots/<케이스>.default.yml`·`.ai.yml`

| 케이스 | Playwright 기본 aria 스냅샷 | Playwright AI 모드 스냅샷 |
|---|---|---|
| 01-baseline | `- button "장바구니 담기"` | `- button "장바구니 담기" [ref=e14] [cursor=pointer]` |
| 02-missing-alt-contrast-lang | `- button "장바구니 담기"` | `- button "장바구니 담기" [ref=f3e14] [cursor=pointer]` |
| 03-div-button | `- text: 장바구니 담기` | `- generic [ref=f6e14] [cursor=pointer]: 장바구니 담기` |
| 04-unnamed-icon-button | `- button` | `- button [ref=f9e14] [cursor=pointer]` |
| 05-label-in-name-mismatch | `- button "상품을 카트에 추가": 장바구니 담기` | `- button "상품을 카트에 추가" [ref=f12e14] [cursor=pointer]: 장바구니 담기` |
| 06-aria-keyword-stuffing | `- button "장바구니 담기 최저가 무료배송 오늘출발 한정특가 쿠폰할인": 장바구니 담기` | `- button "장바구니 담기 최저가 무료배송 오늘출발 한정특가 쿠폰할인" [ref=f15e14] [cursor=pointer]: 장바구니 담기` |
| 07-aria-hidden-mistake | 카드 없음 | `- button [ref=f18e14] [cursor=pointer]: 장바구니 담기` |
| 08-unlabeled-search | `- button "장바구니 담기"` | `- button "장바구니 담기" [ref=f21e13] [cursor=pointer]` |

## 에이전트형 브라우징 세부

- 01-baseline: agent-accessibility-tree=pass, webmcp-form-coverage=n/a, webmcp-registered-tools=n/a, webmcp-schema-validity=n/a, cumulative-layout-shift=pass, llms-txt=n/a, ard-schema=n/a
- 02-missing-alt-contrast-lang: agent-accessibility-tree=pass, webmcp-form-coverage=n/a, webmcp-registered-tools=n/a, webmcp-schema-validity=n/a, cumulative-layout-shift=pass, llms-txt=n/a, ard-schema=n/a
- 03-div-button: agent-accessibility-tree=pass, webmcp-form-coverage=n/a, webmcp-registered-tools=n/a, webmcp-schema-validity=n/a, cumulative-layout-shift=pass, llms-txt=n/a, ard-schema=n/a
- 04-unnamed-icon-button: agent-accessibility-tree=fail, webmcp-form-coverage=n/a, webmcp-registered-tools=n/a, webmcp-schema-validity=n/a, cumulative-layout-shift=pass, llms-txt=n/a, ard-schema=n/a
- 05-label-in-name-mismatch: agent-accessibility-tree=pass, webmcp-form-coverage=n/a, webmcp-registered-tools=n/a, webmcp-schema-validity=n/a, cumulative-layout-shift=pass, llms-txt=n/a, ard-schema=n/a
- 06-aria-keyword-stuffing: agent-accessibility-tree=pass, webmcp-form-coverage=n/a, webmcp-registered-tools=n/a, webmcp-schema-validity=n/a, cumulative-layout-shift=pass, llms-txt=n/a, ard-schema=n/a
- 07-aria-hidden-mistake: agent-accessibility-tree=fail, webmcp-form-coverage=n/a, webmcp-registered-tools=n/a, webmcp-schema-validity=n/a, cumulative-layout-shift=pass, llms-txt=n/a, ard-schema=n/a
- 08-unlabeled-search: agent-accessibility-tree=fail, webmcp-form-coverage=n/a, webmcp-registered-tools=n/a, webmcp-schema-validity=n/a, cumulative-layout-shift=pass, llms-txt=n/a, ard-schema=n/a
