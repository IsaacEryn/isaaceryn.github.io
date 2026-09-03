// 정적 import 그래프: entry → tla-a(300ms TLA) → sibling(동기) → tla-b(300ms TLA), 선언 순서 그대로
// 스펙(InnerModuleEvaluation)대로면 셋 다 한 번의 동기 순회 안에서 시작된다 — A의 await가 B나 sibling을 막지 않는다.
// 그래서 entry 본문은 max(300, 300) ≈ 300ms 뒤에 실행돼야 한다. 뒤 모듈이 앞 TLA를 기다리면 600ms가 된다.
import { a } from './tla-a.mjs'
import { sibling } from './sibling.mjs'
import { b } from './tla-b.mjs'

performance.mark('entry:evaluated')

const t = (name) => {
	const m = performance.getEntriesByName(name)[0]
	return m ? m.startTime : null
}
const base = t('a:start')
const rel = (name) => (t(name) === null || base === null ? null : Math.round(t(name) - base))

const r = {
	siblingAt: rel('sibling:evaluated'),
	bStartAt: rel('b:start'),
	aEndAt: rel('a:end'),
	bEndAt: rel('b:end'),
	entryAt: rel('entry:evaluated'),
	a, sibling, b
}
// 판정: B가 A의 await가 끝나기 전에 시작했으면 스펙대로(병렬), A가 끝난 뒤에야 시작했으면 직렬
r.parallel = r.bStartAt !== null && r.aEndAt !== null ? r.bStartAt < r.aEndAt : null
window.__staticResult = r
document.dispatchEvent(new CustomEvent('static-done', { detail: r }))
