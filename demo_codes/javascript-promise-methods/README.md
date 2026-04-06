# Promise.all vs Promise.allSettled 데모 가이드

> 배포: `https://isaaceryn.github.io/js-demos/promise-comparison/`
> 연결 포스트: `content/posts/javascript-promise-methods/index.ko.md`
> 우선순위: 선택적 (A-4, A-7보다 낮음)

---

## 데모 목적

비동기 동작 차이를 직접 실행해보면서 비교.

"하나 실패하면 전체가 날아간다"는 것을 버튼 하나로 체험하는 것이 목표.

---

## 데모 화면 구성

```
┌─────────────────────────────────────────────────────┐
│  Promise.all vs allSettled 비교 데모                 │
│  ← 블로그 포스트로 돌아가기                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  시뮬레이션 설정                                     │
│  API 1: [성공 ▼]  API 2: [실패 ▼]  API 3: [성공 ▼] │
│                                                     │
│  [▶ Promise.all 실행]  [▶ Promise.allSettled 실행]  │
│                                                     │
├─────────────────┬───────────────────────────────────┤
│  Promise.all    │  Promise.allSettled               │
│                 │                                   │
│  ⏳ API 1...   │  ⏳ API 1...                      │
│  ⏳ API 2...   │  ⏳ API 2...                      │
│  ❌ API 2 실패  │  ⏳ API 3...                      │
│  → 전체 실패!  │                                   │
│                 │  ✅ API 1: "데이터 A"             │
│  catch:         │  ❌ API 2: Error: 서버 오류       │
│  "서버 오류"   │  ✅ API 3: "데이터 C"             │
│                 │  → 부분 성공 처리 가능!           │
└─────────────────┴───────────────────────────────────┘
```

---

## 핵심 동작

- API 1~3의 성공/실패를 드롭다운으로 설정
- 두 버튼을 동시에 누르면 각 동작을 나란히 비교
- 각 API 응답에 랜덤 지연(300~1000ms)
- `Promise.all`: 실패 즉시 전체 취소 + catch 메시지
- `Promise.allSettled`: 모두 완료 후 개별 결과 표시

---

## 구현 방법

```javascript
// 설정에 따라 성공/실패하는 가짜 API
function fakeApi(id, shouldFail) {
  const delay = 300 + Math.random() * 700;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error(`API ${id} 서버 오류`));
      } else {
        resolve(`데이터 ${String.fromCharCode(64 + id)}`);
      }
    }, delay);
  });
}

async function runAll() {
  const promises = [1, 2, 3].map(id =>
    fakeApi(id, getConfig(id) === 'fail')
  );

  try {
    const results = await Promise.all(promises);
    showAllSuccess(results);
  } catch (error) {
    showAllFailed(error);
  }
}

async function runAllSettled() {
  const promises = [1, 2, 3].map(id =>
    fakeApi(id, getConfig(id) === 'fail')
  );

  const results = await Promise.allSettled(promises);
  showSettledResults(results);
}
```

---

## 블로그 포스트 연결

### 삽입 위치

"언제 뭘 써야 할까?" 섹션 직후

### 삽입 마크다운

```markdown
API 성공/실패 조합을 직접 설정해서 두 메서드의 동작 차이를 비교해보세요.

👉 [Promise.all vs allSettled 비교 데모](https://isaaceryn.github.io/js-demos/promise-comparison/)
```

---

## 작업 체크리스트

- [ ] `index.html` 작성
- [ ] 성공/실패 설정 UI
- [ ] 병렬 실행 + 시각적 진행 상태
- [ ] 로컬 확인
- [ ] `js-demos` 레포 배포
- [ ] 블로그 포스트 링크 추가

---

## 참고

- 배포 가이드: `_notes/demo-guides/GITHUB-PAGES-GUIDE.md`
