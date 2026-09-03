// 정적 import 그래프용 TLA 모듈 A — 300ms 기다린다
performance.mark('a:start')
await new Promise((resolve) => setTimeout(resolve, 300))
performance.mark('a:end')
export const a = true
