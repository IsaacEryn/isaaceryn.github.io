# ACT 규칙 테스트 케이스로 접근성 검사 도구 비교

블로그 글 「axe와 IBM 검사 결과가 다른 이유, ACT Rules 1.1로 재봤습니다」에서 쓴 스크립트입니다. (상태: 글 발행 준비 중, 2026-10-07)
W3C가 승인한 ACT 규칙 37개의 테스트 케이스(558개, 그중 측정 가능한 556개)를 axe-core와 IBM Equal Access에 **기본 설정 그대로** 돌리고,
규칙이 기대하는 결과(passed·failed·inapplicable)와 비교합니다.

## 준비물

- Node.js 20 이상, Python 3 (표준 라이브러리만 씀)
- Google Chrome (Playwright가 `channel: 'chrome'`으로 설치된 크롬을 씁니다. 따로 브라우저를 내려받지 않습니다)

## 순서

```bash
npm install
npm run run       # 558개 케이스 실행 → results.jsonl (크롬 탭 8개 병렬, 케이스마다 새 브라우저 컨텍스트, M 계열 Mac에서 2분 남짓)
npm run analyze   # 규칙 단위 집계
node check-act-rule.mjs 6cfa84   # 규칙 하나를 axe로만 빠르게 확인 (W3C 최신 파일을 직접 받아 씀)
```

`results.jsonl`은 2026년 10월 7일 실행 결과(axe-core 4.14.0, accessibility-checker-engine 4.0.34)입니다. 다시 돌리면 덮어씁니다.

`testcases.json`은 같은 날 W3C 게시 파일에서 `approved: true`인 558개만 남긴 스냅숏입니다(원본 sha256은 파일 안 `sourceSha256`). W3C가 승인 예제를 늘리면 결과가 달라지니, 최신 파일로 다시 재고 싶을 때만 `npm run fetch`로 덮어쓰세요. `npm run run`은 시작할 때 대상 건수를 출력합니다.
실행 중 오류가 난 케이스가 있으면 `npm run run`이 0이 아닌 코드로 끝나고, `analyze.py`는 집계를 멈춥니다.

## 판정 방식

- **기본 설정 기준입니다.** axe는 기본으로 꺼진 규칙(`enabled: false`, 예: AAA 대비 `color-contrast-enhanced`)과
  실험 규칙(experimental)을 돌리지 않습니다. IBM은 기본 정책 `IBM_Accessibility`에 든 규칙만 씁니다.
  ACT 규칙에 대응하는 도구 규칙이 있어도 기본 설정에서 안 돌면 "꺼짐"으로 따로 셉니다.
- 어떤 도구 규칙이 어떤 ACT 규칙에 대응하는지는 **도구가 스스로 밝힌 매핑**을 씁니다.
  axe는 규칙 메타데이터의 `actIds`, IBM은 규칙의 `act` 필드입니다.
  IBM은 실패 이유(reasonId)별로 ACT 결과를 따로 매핑하기도 하는데, 그 경우 이유 단위 매핑을 따릅니다.
- 대응 규칙 중 하나라도 위반을 내면 `failed`, 위반 없이 '검토 필요'(axe `incomplete`, IBM `POTENTIAL`·`MANUAL`)만 있으면 `cantTell`,
  둘 다 없으면 `notFailed`(통과와 해당 없음을 구분하지 않음)로 셉니다.
  단, IBM이 실패 이유별로 ACT 결과를 매핑해 둔 규칙은 그 매핑을 따릅니다. 예를 들어 화면 확대를 막는 viewport 설정(`b4f0c3`)은
  IBM이 '검토 필요'(`potential_zoomable`)로 내지만, IBM 스스로 그 이유를 ACT 실패로 매핑해 두었으므로 `failed`로 셉니다.
- 테스트 대상 문서 밖으로 이동하는 내비게이션(meta refresh 등)은 `route.abort('aborted')`로 막고, 모든 프레임에 axe를 넣습니다.
  기본값 `abort()`를 쓰면 크롬이 오류 페이지로 넘어가 빈 문서를 검사하게 되니 주의하세요. 검사 직전에 주소가 테스트 문서 그대로인지 확인합니다.
- 스타일시트가 없는 XML 문서는 크롬이 자체 XML 뷰어 화면으로 바꿔 보여 줍니다. 주소는 그대로라 주소 확인으로는 못 잡으니,
  뷰어 화면(`#xml-viewer-style`)이 감지되면 `skipped`로 남기고 집계에서 뺍니다. 2026-10-07 기준 2건(`b5c3f8` 해당 없음 2, `6a7281` 해당 없음 4)입니다.
- 웹 폰트를 쓰는 예제가 있어 `document.fonts.ready`까지 기다린 뒤 검사합니다.

## 규칙 분류 (analyze.py)

W3C ACT 구현 보고서의 '일관됨(consistent)' 정의를 본뜬 근사입니다(성공 기준 보고 검사는 뺐습니다). 판정은 페이지 단위라, 도구가 ACT 규칙이 보는 바로 그 요소를 짚었는지까지는 맞춰 보지 않습니다.

| 분류 | 뜻 |
|---|---|
| 일관됨 | 통과·해당 없음 예제를 실패로 판정한 적이 없고, 실패 예제는 모두 실패 또는 판단 보류이며 하나 이상은 실패 |
| 부분 | 기대와 다른 실패 판정은 없지만 실패 예제 일부를 놓침 |
| 실패로 확정 못 함 | 기대와 다른 실패 판정은 없지만 실패 예제를 하나도 실패로 확정하지 못함(모두 판단 보류이거나 놓침) |
| 기대와 다름 | 통과·해당 없음 예제를 실패로 판정한 적이 있음 (도구가 ACT보다 넓게 검사하는 경우 포함) |
| 꺼짐 | 대응 규칙은 있지만 기본 설정에서 실행되지 않음 |
| 미구현 | 대응하는 도구 규칙이 없음 |

## 읽는 법

- 공식 [ACT 구현 보고서](https://www.w3.org/WAI/standards-guidelines/act/implementations/)는 도구 제작사가 제출한 결과를 쓰고,
  도구가 보고하는 성공 기준까지 맞는지 따집니다. 이 집계와 숫자가 같을 필요는 없습니다.
- 테스트 케이스는 기능 하나만 떼어 낸 작은 HTML입니다. 실제 사이트에서 어느 도구가 오류를 더 많이 찾는지를 뜻하지 않습니다.
- `cantTell`이 많다는 건 나쁜 게 아니라 "확신 없으면 사람에게 넘긴다"는 설계일 수 있습니다.
