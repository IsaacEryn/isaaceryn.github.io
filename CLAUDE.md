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
  assets/styles/shared.css       # 새 데모용 공통 스타일 (현행)
  assets/styles/demo-common.css  # scroll-driven-animation 계열용
  [주제]/                         # 주제별 데모 폴더
    index.html                   # 데모 목록 페이지
    README.md                    # 설계 노트, 구현 상세
    styles/                      # 주제별 공통 스타일
    examples/                    # 개별 데모 HTML 파일
```

## 데모 페이지 작성 규칙

### 언어

블로그가 한/영 이중 언어이므로 데모도 두 언어를 지원하는 것이 원칙입니다.
`browser-features-accessibility/`가 참고 구현입니다.

- **한국어를 HTML에 그대로** 적어둡니다 — JS가 죽어도 읽힙니다.
- 번역 대상 요소에 `data-i18n="키"`를 붙이고, 스크립트 상단 `EN` 사전에 영어를 모읍니다.
  한 파일에 두 언어가 나란히 있어야 수정할 때 어긋나지 않습니다.
- JS가 만들어내는 동적 문구는 `MSG.ko` / `MSG.en`에 함수로 둡니다.
- 언어를 바꿀 때 **`<html lang>`을 함께 바꿔야** 스크린 리더가 발음을 전환합니다.
  토글 버튼은 `aria-pressed`로 현재 언어를 알리고, 각 버튼에는 자기 언어의 `lang`을 답니다.
- 우선순위: `?lang=` 딥링크 > `localStorage` > 브라우저 언어.
  블로그 영문판에서는 `?lang=en`으로 연결합니다.
- 언어 전환 버튼의 라벨(`한국어`, `English`)은 번역하지 않고 각자 언어로 둡니다.

### 들여쓰기
- 모든 데모 HTML 파일에서 **탭(Tab)** 사용 (1 레벨 = 1 탭)

### 스타일 계층

공용 스타일시트가 **두 개**이고 서로 토큰 이름이 다릅니다. 새 데모는 `shared.css`를 씁니다.

| 파일 | 쓰는 곳 | 비고 |
|---|---|---|
| `assets/styles/shared.css` | 새 데모 (브라우저 신기능·폼 접근성·Promise) | 이쪽이 현행 |
| `assets/styles/demo-common.css` | `scroll-driven-animation` 계열 | 토큰 이름이 다름(`--text` vs `--tx`) |
| `[주제]/styles/` | 주제별 공통 | |
| 페이지 내 `<style>` | 페이지별 세부 조정 | |

⚠️ **두 파일에 있는 클래스가 서로 다릅니다.** 한쪽에만 정의된 클래스를 다른 쪽 페이지에서 쓰면
스타일이 통째로 빠진 채 렌더됩니다(`.skip-link`가 실제로 이 사고를 냈습니다 — `demo-common.css`에만
있는데 `shared.css`를 쓰는 페이지에서 사용해, 건너뛰기 링크가 화면에 그대로 노출됐습니다).
새 클래스를 쓰기 전에 **로드하는 스타일시트에 그 정의가 있는지** 확인하세요.

### 색과 명도 대비

데모가 접근성을 다루는 만큼 검사에서 걸리면 곤란합니다. 실제로 한 번 걸렸고, 원인은 대부분 하나였습니다.

**강조색은 텍스트용과 배경용을 나눠 씁니다.** 같은 색이 배경일 때는 통과하고 텍스트일 때는 떨어집니다.

```css
--accent:    #5558e3;   /* 배경·테두리 — 흰 글씨를 얹으면 5.4:1로 통과 */
--accent-tx: #818cf8;   /* 어두운 배경 위 텍스트 — #5558e3은 3.5:1로 미달 */
```

- 링크·라벨·활성 탭처럼 **글자에 쓰는 색**은 `--accent-tx`.
- 버튼 배경, 포커스 링, 테두리는 `--accent`.
- `scroll-driven-animation`도 같은 규칙(`--accent` / `--accent-tx: #60a5fa`).

그 밖에 반복해서 걸렸던 것들:

- **스타일을 주지 않은 `<a>`** — 어두운 배경에서 브라우저 기본 파랑(`#0000ee`)이 1.9:1까지 떨어집니다.
  본문 안에 링크를 넣었다면 색을 반드시 지정하세요.
- **작은 글씨의 옅은 회색** — 4.2~4.3:1처럼 간발의 차로 미달하는 값은 눈으로 못 잡습니다. 계산하세요.
- **좁은 화면 가로 스크롤(WCAG 1.4.10)** — `minmax(300px, 1fr)`은 320px 폭에서 넘칩니다.
  `minmax(min(300px, 100%), 1fr)`로 씁니다.

발행 전 점검은 a11ychk MCP의 `scan_pages`로 합니다. **목록·데모 페이지만 보지 말고 `examples/` 하위까지**
넣으세요 — 위반의 절반이 거기서 나왔습니다.

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
