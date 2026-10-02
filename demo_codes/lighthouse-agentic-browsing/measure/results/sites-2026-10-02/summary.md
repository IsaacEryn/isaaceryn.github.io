# 실제 사이트 실측 — 다수결 요약

- 실행 3회 · Lighthouse 13.5.0 · 데스크톱 설정 · 회차별 종료 시각 2026-10-02T05:25:38.577Z, 2026-10-02T05:30:53.018Z, 2026-10-02T05:34:10.633Z
- 표의 값은 실행 결과의 다수결입니다(점수가 모두 다르면 중앙값). 규칙은 절반 넘는 실행에서 나온 것만 적었습니다.
- 최종 주소의 호스트가 요청과 다른 사이트는 다른 페이지를 쟀을 수 있어 표에서 뺐습니다(아래 「표에서 뺀 사이트」).
- 이 폴더의 실행 파일은 모두 스크립트 개정 전에 잰 것이라 Lighthouse 경고(runWarnings)·시작 시각·전체 화면 캡처가 없습니다.

| 사이트 | 트리 감사 | 에이전트형 브라우징 | 접근성 점수 | 트리 감사에 걸린 규칙 | 그 밖에 점수에 든 실패 | 숨은 실패(가중치 0) |
|---|---|---|---|---|---|---|
| 국민건강보험공단 | 실패 | 1/2 | 71 | aria-allowed-attr, aria-required-children, aria-required-parent | color-contrast, heading-order, list, listitem, meta-viewport | 없음 |
| 국세청 | 실패 | 1/2 | 89 | aria-hidden-focus, aria-input-field-name | target-size, landmark-one-main | 없음 |
| 서울특별시 | 실패 | 1/4 | 87 | aria-hidden-focus | color-contrast, target-size, landmark-one-main | 없음 |
| 한국장애인고용공단 | 실패 | 1/2 | 96 | link-name | 없음 | label-content-name-mismatch |
| 네이버 | 통과 | 1/2 | 93 | 없음 | color-contrast, skip-link, target-size | 없음 |
| 다음 | 실패 | 1/2 | 78 | aria-allowed-attr, aria-required-children, aria-valid-attr-value, link-name, tabindex | color-contrast | 없음 |
| 11번가 | 통과 | 1/3 | 96 | 없음 | color-contrast | 없음 |
| G마켓 | 실패 | 1/2 | 81 | aria-allowed-attr, link-name | color-contrast, heading-order, image-alt | label-content-name-mismatch |
| 무신사 | 통과 | 2/3 | 93 | 없음 | color-contrast, target-size | label-content-name-mismatch |
| 코드슬로그 | 통과 | 3/3 | 100 | 없음 | 없음 | label-content-name-mismatch |

## 실행마다 달랐던 값

- 한국장애인고용공단 2회차: 에이전트형 0/2(cumulative-layout-shift=fail)
- G마켓 3회차: 접근성 86점 · -image-alt
- 무신사 2회차: 트리 감사 실패 · 에이전트형 1/3(agent-accessibility-tree=fail) · 접근성 89점 · +link-name

## 표에서 뺀 사이트

- 정부24: https://www.gov.kr → https://plus.gov.kr/mbuster/Mbuster_T (1·2·3회차)

## 에이전트형 브라우징 세부(다수결)

- 국민건강보험공단: agent-accessibility-tree=fail, webmcp-form-coverage=n/a, webmcp-registered-tools=n/a, webmcp-schema-validity=n/a, cumulative-layout-shift=pass, llms-txt=n/a, ard-schema=n/a
- 국세청: agent-accessibility-tree=fail, webmcp-form-coverage=n/a, webmcp-registered-tools=n/a, webmcp-schema-validity=n/a, cumulative-layout-shift=pass, llms-txt=n/a, ard-schema=n/a
- 서울특별시: agent-accessibility-tree=fail, webmcp-form-coverage=n/a, webmcp-registered-tools=n/a, webmcp-schema-validity=n/a, cumulative-layout-shift=pass, llms-txt=fail, ard-schema=fail
- 한국장애인고용공단: agent-accessibility-tree=fail, webmcp-form-coverage=n/a, webmcp-registered-tools=n/a, webmcp-schema-validity=n/a, cumulative-layout-shift=pass, llms-txt=n/a, ard-schema=n/a
- 네이버: agent-accessibility-tree=pass, webmcp-form-coverage=n/a, webmcp-registered-tools=n/a, webmcp-schema-validity=n/a, cumulative-layout-shift=fail, llms-txt=n/a, ard-schema=n/a
- 다음: agent-accessibility-tree=fail, webmcp-form-coverage=n/a, webmcp-registered-tools=n/a, webmcp-schema-validity=n/a, cumulative-layout-shift=pass, llms-txt=n/a, ard-schema=n/a
- 11번가: agent-accessibility-tree=pass, webmcp-form-coverage=n/a, webmcp-registered-tools=n/a, webmcp-schema-validity=n/a, cumulative-layout-shift=fail, llms-txt=n/a, ard-schema=fail
- G마켓: agent-accessibility-tree=fail, webmcp-form-coverage=n/a, webmcp-registered-tools=n/a, webmcp-schema-validity=n/a, cumulative-layout-shift=pass, llms-txt=n/a, ard-schema=n/a
- 무신사: agent-accessibility-tree=pass, webmcp-form-coverage=n/a, webmcp-registered-tools=n/a, webmcp-schema-validity=n/a, cumulative-layout-shift=fail, llms-txt=pass, ard-schema=n/a
- 코드슬로그: agent-accessibility-tree=pass, webmcp-form-coverage=n/a, webmcp-registered-tools=n/a, webmcp-schema-validity=n/a, cumulative-layout-shift=pass, llms-txt=pass, ard-schema=n/a
