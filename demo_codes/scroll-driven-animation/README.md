# Scroll-Driven Animation Demos

스크롤 기반 애니메이션의 3가지 구현 방식을 동일한 시각적 결과로 비교합니다.

## 목적

- **구현 방식 비교**: 동일한 시각 결과를 3가지 다른 기술로 구현
- **접근성 고려**: 각 방식에서 `prefers-reduced-motion` 대응 방법 제시
- **실무 적용**: Practical Examples를 통한 실제 사용 사례 제공

## 데모 구조

```
scroll-driven-animation/
├── index.html              # 데모 목록 페이지
├── styles/
│   ├── common.css          # 공통 기본 스타일
│   └── demo.css            # 데모 페이지 공통 스타일
└── examples/
    ├── native-*.html       # Native CSS 구현 (4종: basic, reverse, a11y, fallback)
    ├── io-*.html           # Intersection Observer 구현 (3종)
    ├── raf-*.html          # rAF + Scroll 구현 (3종)
    └── practical-*.html    # 실무 예제 (3종)
```

## 구현 방식

### 1. Native CSS Scroll-Driven Animation

CSS `animation-timeline: scroll()` 속성을 사용한 순수 CSS 구현입니다.

```css
@supports (animation-timeline: scroll()) {
  .element {
    animation: reveal linear both;
    animation-timeline: scroll();
    animation-range: 0% 50%;
  }
}
```

**특징**:
- JavaScript 없이 CSS만으로 구현
- 스크롤 위치에 따른 부드러운 연속 애니메이션
- GPU 가속으로 뛰어난 성능

**브라우저 지원**:
| 브라우저 | 지원 버전 |
|---------|----------|
| Chrome | 115+ |
| Edge | 115+ |
| Firefox | 미지원 (플래그 뒤) |
| Safari | 미지원 |

### 2. Intersection Observer

요소의 뷰포트 진입/이탈을 감지하여 클래스를 토글하는 방식입니다.

```javascript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    });
  },
  { threshold: 0.3 }
);
```

**특징**:
- 넓은 브라우저 지원
- 이벤트 기반으로 가벼운 성능
- 진입/이탈 시점에만 동작 (연속 진행률 없음)

**브라우저 지원**:
| 브라우저 | 지원 버전 |
|---------|----------|
| Chrome | 58+ |
| Edge | 16+ |
| Firefox | 55+ |
| Safari | 12.1+ |

### 3. rAF + Scroll

`requestAnimationFrame`과 스크롤 이벤트를 조합하여 프레임 단위로 제어합니다.

```javascript
function update() {
  const rect = element.getBoundingClientRect();
  const progress = clamp((viewportHeight - rect.top) / viewportHeight);
  element.style.transform = `translateY(${(1 - progress) * 60}px)`;
  element.style.opacity = progress;
}

window.addEventListener('scroll', () => {
  requestAnimationFrame(update);
}, { passive: true });
```

**특징**:
- 모든 브라우저 지원
- 세밀한 제어 가능
- 스크롤마다 JS 실행으로 성능 주의 필요

**브라우저 지원**:
| 브라우저 | 지원 버전 |
|---------|----------|
| Chrome | 10+ |
| Edge | 12+ |
| Firefox | 23+ |
| Safari | 6.1+ |

## 변형(Variant) 설명

각 구현 방식은 3가지 변형을 제공합니다:

### Basic (기본)
- 아래로 스크롤하면 요소가 나타남
- 위로 스크롤하면 요소가 사라짐
- 양방향 애니메이션

### Reverse / Bidirectional (반전 / 양방향)

**Native CSS (한계점 설명)**
- CSS scroll-driven animation은 **스크롤 방향을 감지할 수 없음**
- `animation-direction: reverse`는 애니메이션 재생 순서만 반전
- 페이지에서 CSS의 한계와 JavaScript 대안 안내

**IO / rAF (양방향 토글 구현)**
- 뷰포트 진입 시 요소가 애니메이션되며 나타남
- 뷰포트 이탈 시 요소가 리셋되어 숨겨짐
- 위/아래 스크롤 모두에서 동작 (방향 무관)
- Direction Indicator로 현재 스크롤 방향 표시 (시각적 피드백)

### A11y (접근성)
- `prefers-reduced-motion` 미디어 쿼리 존중
- 모션 감소 설정 시 즉시 표시
- 한 번 나타난 요소는 고정 (스크롤해도 사라지지 않음)
- 깜빡임 방지로 읽기 편의성 향상

### Fallback (Native CSS 전용)
- `CSS.supports('animation-timeline', 'scroll()')` 로 지원 여부 감지
- 미지원 브라우저에서 IntersectionObserver로 유사한 효과 제공
- 점진적 향상(Progressive Enhancement) 패턴 적용
- 브라우저 지원과 관계없이 100% 사용자 도달

## 성능 비교

| 방식 | 메인 스레드 | GPU 가속 | 배터리 |
|-----|-----------|---------|-------|
| Native CSS | 최소 | 자동 | 우수 |
| Intersection Observer | 낮음 | CSS 의존 | 우수 |
| rAF + Scroll | 스크롤당 실행 | 수동 설정 | 보통 |

### 권장 사용 사례

- **Native CSS**: 최신 브라우저 타겟, 성능 중시
- **Intersection Observer**: 넓은 호환성, 간단한 토글 애니메이션
- **rAF + Scroll**: 복잡한 커스텀 애니메이션, 세밀한 제어 필요

## Practical Examples

실제 웹사이트에서 활용할 수 있는 예제입니다.

### Hero Reveal (`practical-hero-reveal.html`)
- `clip-path` 애니메이션으로 전체 화면 커버 공개
- 랜딩 페이지, 제품 소개에 적합
- Native CSS scroll-driven animation 사용

### Parallax Cards (`practical-parallax-cards.html`)
- 가격표 카드가 다른 속도로 스크롤
- 깊이감과 시각적 흥미 유발
- rAF + scroll 기반 parallax 효과

### Progress Story (`practical-progress-story.html`)
- 상단 진행률 바 + 챕터 내비게이션
- 스토리텔링, 연간 보고서에 적합
- Intersection Observer로 챕터 감지
- 숫자 카운터 애니메이션 포함

## 공통 UI 요소

모든 데모 페이지에 포함된 공통 요소:

1. **상단 진행률 바**: 페이지 스크롤 진행률 표시
2. **히어로 섹션**: 커버가 올라가며 콘텐츠 공개
3. **피처 카드**: 단계적으로 등장하는 3개 카드
4. **스탯 카드**: 숫자와 함께 나타나는 통계 카드
5. **구현 정보**: 페이지 하단 기술 설명

## 접근성 (A11y) 구현 패턴

### Native CSS
```css
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none !important;
    opacity: 1;
    transform: none;
  }
}
```

### Intersection Observer
```javascript
if (prefersReducedMotion) {
  elements.forEach(el => el.classList.add('is-visible'));
} else {
  observer.observe(element);
  // 한 번 나타나면 unobserve()
}
```

### rAF + Scroll
```javascript
if (prefersReducedMotion) {
  element.style.opacity = '1';
  element.style.transform = 'none';
  return; // 애니메이션 루프 종료
}

// 임계값 도달 시 잠금
if (progress >= 0.95) {
  lockedElements.add(element);
  element.classList.add('is-locked');
}
```

## 개발 참고

### 파일 구조
- `styles/common.css`: CSS 변수, 타이포그래피, 버튼 등 기본 스타일
- `styles/demo.css`: 히어로, 피처 카드, 스탯 카드 등 데모 레이아웃
- 각 HTML: 페이지별 미세 조정 `<style>` 블록

### CSS 변수
```css
:root {
  --accent: #3b82f6;
  --surface: rgba(30, 41, 59, 0.8);
  --text: #f1f5f9;
  --text-muted: #94a3b8;
  --radius-md: 8px;
  --radius-lg: 16px;
}
```

## 참고 자료

- [MDN: Scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline)
- [MDN: Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [web.dev: Scroll-driven animations](https://developer.chrome.com/docs/css-ui/scroll-driven-animations)
- [WCAG 2.3.3: Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
