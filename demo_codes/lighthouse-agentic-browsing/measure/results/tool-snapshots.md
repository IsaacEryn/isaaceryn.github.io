# 에이전트 도구가 받는 스냅샷 비교 (2026-10-02)

같은 케이스 페이지를 에이전트용 MCP 서버 두 가지로 직접 찍은 결과에서 상품 카드 부분만 옮겼습니다.
페이지는 로컬 정적 서버(127.0.0.1)에서 열었습니다. 카드 밖(머리글·메뉴·검색창)은 06(메뉴 링크 두 개의 이름에 키워드)과 08(검색창 이름 없음)을 빼면 두 도구 모두 케이스 사이에 차이가 없습니다. 아래는 모두 페이지를 연 직후 상태입니다.

| 도구 | 버전 | 호출 |
|---|---|---|
| Playwright MCP | @playwright/mcp 0.0.83 (playwright-core 1.64.0-alpha) | `browser_snapshot` (target: main) |
| Chrome DevTools MCP | chrome-devtools-mcp 1.9.0, Chrome 154 | `take_snapshot` (verbose 끔) |

Playwright MCP의 출력은 측정 스크립트가 남기는 `snapshots/<케이스>.ai.yml`(playwright 1.63.0의 `ariaSnapshot({ mode: 'ai' })`)과 줄 단위로 같았습니다(ref 번호만 다름).
테스트 코드에서 쓰는 기본 스냅샷은 `snapshots/<케이스>.default.yml`, 크롬 접근성 트리가 매긴 역할·이름은 `summary.json`의 `ax`에 있습니다.

## 02 alt·대비·lang 누락 — 사진이 두 도구 모두에서 사라진다

Playwright MCP

```yaml
- article [ref=f3e23]:
  - generic [ref=f3e25]:
    - heading "하늘색 머그컵" [level=2] [ref=f3e26]
    - paragraph [ref=f3e27]: 12,000원
    - paragraph [ref=f3e28]: 350ml · 전자레인지 사용 가능
    - button "장바구니 담기" [ref=f3e29] [cursor=pointer]
    - status [ref=f3e30]
```

Chrome DevTools MCP

```text
uid=8_24 heading "하늘색 머그컵" level="2"
uid=8_25 StaticText "12,000원"
uid=8_26 StaticText "350ml · 전자레인지 사용 가능"
uid=8_27 button "장바구니 담기"
uid=8_28 status atomic live="polite" relevant="additions text"
```

## 03 div 버튼

Playwright MCP — 클릭할 수 있다는 표시(`cursor=pointer`)와 ref가 붙는다

```yaml
- generic [ref=e29] [cursor=pointer]: 장바구니 담기
```

Chrome DevTools MCP — 그냥 글자

```text
uid=5_28 StaticText "장바구니 담기"
```

## 04 이름 없는 아이콘 버튼

Playwright MCP

```yaml
- button [ref=f4e29] [cursor=pointer]
```

Chrome DevTools MCP

```text
uid=9_28 button
```

## 05 보이는 글자와 다른 이름

Playwright MCP — 이름과 화면 글자를 함께 준다

```yaml
- button "상품을 카트에 추가" [ref=f1e29] [cursor=pointer]: 장바구니 담기
```

Chrome DevTools MCP — 이름만 준다

```text
uid=6_28 button "상품을 카트에 추가"
```

## 07 카드 전체에 aria-hidden

Playwright MCP — 화면에 보이는 요소라 `[aria-hidden]` 표시를 달고 남긴다(Playwright PR #42268에서 의도한 동작)

```yaml
- article [aria-hidden] [ref=f2e23]:
  - generic [ref=f2e25]:
    - heading [level=2] [ref=f2e26]: 하늘색 머그컵
    - paragraph [ref=f2e27]: 12,000원
    - paragraph [ref=f2e28]: 350ml · 전자레인지 사용 가능
    - button [ref=f2e29] [cursor=pointer]: 장바구니 담기
    - status [ref=f2e30]
```

Chrome DevTools MCP — 카드가 없다(main 안에는 제목과 검색창만 남음). 단, 크롬은 Tab으로 이 안의 버튼에 포커스가 들어가면 `aria-hidden`을 무시하고 카드를 트리에 되돌린다(콘솔에 'Blocked aria-hidden on an element because its descendant retained focus' 경고, Chrome 154에서 확인). 그 뒤에 찍으면 카드가 나온다

```text
uid=7_18 main
  uid=7_19 heading "오늘의 상품" level="1"
  uid=7_20 search
    uid=7_21 StaticText "상품 검색"
    uid=7_22 searchbox "상품 검색"
    uid=7_23 button "검색"
```

## 눌러 보기 (2026-10-02)

스냅샷에서 장바구니 요소를 골라 눌렀을 때 상태 문구가 '장바구니에 담았습니다.'로 바뀌었는지입니다. 측정 스크립트가 아니라 MCP 서버로 직접 누른 기록입니다.

| 케이스 | Playwright MCP (`browser_click`, ref) | Chrome DevTools MCP (`click`, uid) |
|---|---|---|
| 03 div 버튼 | 담김 (`generic [cursor=pointer]`의 ref) | 담김 (`StaticText "장바구니 담기"`의 uid) |
| 04 이름 없는 아이콘 버튼 | 담김 (이름 없는 `button`의 ref — 카드 안 버튼이라 사람이 골랐습니다) | (누르지 않음) |
| 07 aria-hidden 실수 | 담김 (`article [aria-hidden]` 아래 `button`의 ref) | 카드가 스냅샷에 없어 고를 요소가 없음 |

LLM이 이 요소들을 스스로 고를지는 이 기록이 말하지 않습니다(특히 이름 없는 04, 표시 없는 03).

## 다시 찍으려면

1. `demo_codes` 폴더에서 `python3 -m http.server 8765 --bind 127.0.0.1`
2. MCP 클라이언트에 `npx @playwright/mcp@0.0.83 --headless --isolated`와 `npx chrome-devtools-mcp@1.9.0 --headless --isolated --usageStatistics=false`를 등록합니다(chrome-devtools-mcp는 기본값으로 사용 통계를 보내니 끄는 옵션을 붙였습니다).
3. 각 서버로 `http://127.0.0.1:8765/lighthouse-agentic-browsing/cases/<케이스>.html`을 열고 위 호출을 실행합니다. Chrome DevTools MCP 1.9.0의 `take_snapshot`·`click`에는 `list_pages`로 받은 `pageId`를 함께 넘깁니다.

도구 버전이 바뀌면 결과가 달라질 수 있습니다. Playwright의 `[aria-hidden]` 표시는 1.63.0부터 들어갔습니다.
