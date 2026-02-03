# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

블로그(codeslog) 포스팅용 데모 코드, 공부/강의용 예제 코드를 위한 정적 HTML 저장소.
GitHub Pages(isaaceryn.github.io)에서 호스팅. 빌드 시스템 없이 순수 HTML/CSS/JS 파일만 사용.

## 로컬 실행

브라우저에서 HTML 파일을 직접 열거나 로컬 서버 사용:
```bash
npx serve .
# 또는
python3 -m http.server
```

## 저장소 구조

```
index.html                       # 루트 랜딩 페이지
demo_codes/
  assets/styles/demo-common.css  # 모든 데모 공통 기본 스타일
  [주제]/                         # 주제별 데모 폴더
    index.html                   # 데모 목록 페이지
    README.md                    # 설계 노트, 구현 상세
    styles/                      # 주제별 공통 스타일
    examples/                    # 개별 데모 HTML 파일
```

## 데모 페이지 작성 규칙

### 언어
- 데모 페이지는 **영어**를 기본 언어로 사용
- 영어는 간결하고 명확하게 작성 (비영어권 사용자 고려)
- 긴 문장은 다음 줄에 괄호로 한국어 번역 추가
  - 한국어 번역은 `<span lang="ko">` 로 감싸기
- HTML 언어 속성: `<html lang="en">`

### 들여쓰기
- 모든 데모 HTML 파일에서 **탭(Tab)** 사용 (1 레벨 = 1 탭)

### 스타일 계층
1. `demo_codes/assets/styles/demo-common.css` — 모든 데모 페이지에서 로드
2. `demo_codes/[주제]/styles/` — 주제별 공통 스타일
3. 페이지 내 `<style>` 블록 — 페이지별 세부 조정

### 상태 표시
- 초안(Draft) 상태는 index/README에 명시적으로 표기

## 현재 데모: Scroll-Driven Animation

동일한 시각적 결과를 3가지 구현 방식으로 비교:

| 방식 | 기술 | 특징 |
|------|------|------|
| Native CSS | `animation-timeline: scroll()` + `steps()` | CSS만 사용, 지원 브라우저 필요 |
| IntersectionObserver | 요소 진입/이탈 기반 클래스 토글 | 이벤트 기반, 가벼움 |
| rAF + scroll | 임계값 기반 단계 토글 | JS 스크롤마다 실행 |

각 방식별 3종 세트:
- **Basic**: 스크롤 내리면 활성화
- **Reverse**: 스크롤 반대 방향 토글
- **A11y**: 한 번 활성화되면 상태 유지 (접근성)

상세 설계는 `demo_codes/scroll-driven-animation/README.md` 참조.
