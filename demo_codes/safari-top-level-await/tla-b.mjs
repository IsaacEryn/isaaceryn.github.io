// 정적 import 그래프용 TLA 모듈 B — A와 아무 관계 없이 300ms 기다린다
performance.mark('b:start')
await new Promise((resolve) => setTimeout(resolve, 300))
performance.mark('b:end')
export const b = true
