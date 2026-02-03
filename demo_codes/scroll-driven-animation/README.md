# Scroll-Driven Animation Demos

Status: Draft

- These demos are still in draft.
- Content and structure may change.

## 목적 (구현 목표)

- 구현 방식이 달라도 **동일한 시각 결과**를 만들 수 있는지 비교한다.
- 스크롤로 제어되는 애니메이션의 대표 패턴을 **한 페이지 안에서 통일된 콘텐츠**로 보여준다.
- 각 구현 방식의 **지원 범위와 성능 특성**을 명확히 기록해 블로그 포스트로 확장 가능하게 한다.

## 데모 구성 개요

### 공통 UI/콘텐츠

- 상단 진행률 바 + 스크롤 연동된 페이지 콘텐츠 애니메이션
- “커버가 올라가며 고정된 뒤 화면이 드러나는” 연출
- Info rail 카드가 단계적으로 등장하는 연출
- 동일한 콘텐츠 구조를 3가지 구현 방식에 그대로 적용

### 구현 방식별 3종 세트

- Basic: 단계 토글(step) 방식
- Reverse: 마우스 스크롤 반대 방향 토글
- A11y: 각 구현방식에서 웹접근성 확보된 버전

## 구현 방식별 설계/동작

### 1) Native CSS Scroll-Driven Animation

- `animation-timeline: scroll()` 기반
- 단계 토글을 위해 `steps()` 타이밍 사용
- **지원 브라우저에서만 동작**, 미지원 환경은 정적 상태 유지

### 2) IntersectionObserver

- 요소 진입/이탈을 기준으로 클래스 토글
- **연속 진행률은 없음**, 단계 토글만 제공
- 스크롤과 직접적으로 동기화되지 않음 (entry/exit 이벤트 기반)

### 3) rAF + scroll

- 스크롤 위치를 읽어 임계값(threshold)로 단계 토글
- IO와 동일한 “step 결과”를 JS로 재현
- JS가 스크롤마다 실행되므로 성능 영향 가능

## 구현 방식별 지원/성능 정리

- Native CSS
  - 지원: CSS scroll-driven animation 지원 필요
  - 미지원: 정적 상태 (애니메이션 없음)
  - 성능: CSS 타임라인 (JS 없음)
- IntersectionObserver
  - 지원: IO API 지원 필요
  - 동작: step 토글 (연속 진행률 없음)
  - 성능: 이벤트 기반, 가벼움
- rAF
  - 지원: JS + rAF
  - 동작: step 토글 (임계값 기반)
  - 성능: 스크롤마다 JS 실행

## Styles

- Shared demo baseline: `demo_codes/assets/styles/demo-common.css`
- Demo layout baseline: `demo_codes/scroll-driven-animation/styles/demo-shared.css`
- Implementation styles: `demo_codes/scroll-driven-animation/styles/native-css.css`, `demo_codes/scroll-driven-animation/styles/intersection-observer.css`, `demo_codes/scroll-driven-animation/styles/raf.css`
- Practical styles: `demo_codes/scroll-driven-animation/styles/practical.css`
- Page-specific tweaks live in each demo HTML `<style>` block.

## Implementation demos

Each implementation uses the same content and layout:

- Native CSS: `native-basic.html`, `native-reverse.html`, `native-a11y.html`
- IntersectionObserver: `io-basic.html`, `io-reverse.html`, `io-a11y.html`
- rAF mapping: `raf-basic.html`, `raf-reverse.html`, `raf-a11y.html`

## Practical examples

- `practical-cover-lift.html`
- `practical-sticky-chapters.html`
- `practical-metric-sweep.html`

## 추가 메모

- 이 데모는 “동일한 시각 결과”를 우선으로 맞췄다.
- 구현 방식이 지원되지 않을 경우 **동작하지 않는 상태를 그대로 유지**한다 (fallback 없음).
