// measure.mjs와 measure-sites.mjs가 같이 쓰는 판정 로직

import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';

// Lighthouse agent-accessibility-tree 감사가 보는 axe 규칙 33개
// (core/audits/agentic/agent-accessibility-tree.js, v13.2.0~v13.5.0 동일)
export const AGENT_RULES = new Set([
	'button-name', 'input-button-name', 'input-image-alt', 'label', 'link-name', 'select-name',
	'document-title', 'aria-allowed-attr', 'aria-allowed-role', 'aria-command-name',
	'aria-conditional-attr', 'aria-dialog-name', 'aria-hidden-body', 'aria-hidden-focus',
	'aria-input-field-name', 'aria-prohibited-attr', 'aria-required-attr', 'aria-required-children',
	'aria-required-parent', 'aria-roles', 'aria-text', 'aria-toggle-field-name', 'aria-tooltip-name',
	'aria-treeitem-name', 'aria-valid-attr', 'aria-valid-attr-value', 'duplicate-id-aria',
	'definition-list', 'table-duplicate-name', 'tabindex', 'autocomplete-valid',
	'presentation-role-conflict', 'svg-img-alt',
]);

// 두 스크립트가 같은 설정으로 재도록 Lighthouse 실행을 한곳에 둔다
export function runLighthouse(url, port, output = 'json') {
	return lighthouse(
		url,
		{ port, output, logLevel: 'error', onlyCategories: ['accessibility', 'agentic-browsing'] },
		desktopConfig,
	);
}

// 리포트의 분수 표기(예: 2/2)와 같은 규칙: 해당 없음·수동·정보성 감사는 세지 않고, 점수 0.9 이상이면 통과
export function fraction(lhr, categoryId) {
	let passed = 0;
	let total = 0;
	const parts = [];
	for (const ref of lhr.categories[categoryId].auditRefs) {
		const audit = lhr.audits[ref.id];
		if (['notApplicable', 'manual', 'informative'].includes(audit.scoreDisplayMode)) {
			parts.push(`${ref.id}=n/a`);
			continue;
		}
		total++;
		const ok = audit.score !== null && audit.score >= 0.9;
		if (ok) passed++;
		parts.push(`${ref.id}=${ok ? 'pass' : 'fail'}`);
	}
	return { passed, total, parts };
}

// 실패한 감사의 요소를 몇 개 남긴다 — 실행마다 판정이 바뀌면 어떤 요소 때문인지 찾을 수 있게
function failingNodes(audit, limit = 3) {
	return (audit?.details?.items ?? []).slice(0, limit).map((item) => ({
		selector: item.node?.selector ?? '',
		snippet: (item.node?.snippet ?? '').slice(0, 200),
	}));
}

// 한 번의 Lighthouse 결과(lhr)에서 글에 필요한 값만 뽑는다
export function judge(lhr) {
	const a11y = lhr.categories.accessibility;
	const tree = lhr.audits['agent-accessibility-tree'];

	// 감사가 오류를 내면 점수가 비어 '0점·실패'처럼 보인다. 측정값이 아니라 측정 오류로 돌려준다
	const errors = [];
	if (!tree) errors.push('agent-accessibility-tree 감사가 없음(Lighthouse 13.3 이상인지 확인)');
	else if (tree.scoreDisplayMode === 'error') errors.push(`agent-accessibility-tree 오류: ${tree.errorMessage ?? ''}`);
	if (a11y.score === null) errors.push('접근성 카테고리 점수 없음(감사 오류)');
	if (errors.length) return { error: errors.join(' · ') };

	// 점수에 반영되는 실패와, 가중치 0이라 리포트에도 숨겨지는 실패를 나눈다
	const isFailed = (ref) => lhr.audits[ref.id].scoreDisplayMode === 'binary' && lhr.audits[ref.id].score === 0;
	const refs = a11y.auditRefs;
	const failedA11y = refs.filter((ref) => isFailed(ref) && ref.weight > 0).map((ref) => ref.id);
	const failedHidden = refs.filter((ref) => isFailed(ref) && ref.weight === 0).map((ref) => ref.id);
	const failedAgentRules = [...failedA11y, ...failedHidden].filter((id) => AGENT_RULES.has(id));
	const agentTree = tree.score === 1 ? 'pass' : 'fail';

	const warnings = [];
	if (agentTree === 'fail' && failedAgentRules.length === 0) {
		warnings.push('트리 감사가 실패했는데 33개 목록과 맞는 규칙이 없음 — 새 Lighthouse에서 목록이 바뀌었는지 소스와 대조하세요');
	}
	if (agentTree === 'pass' && failedAgentRules.length > 0) {
		warnings.push(`트리 감사는 통과인데 33개 목록 규칙(${failedAgentRules.join(', ')})이 실패 — 목록에서 규칙이 빠졌는지 소스와 대조하세요`);
	}

	const nodes = {};
	for (const id of [...failedA11y, ...failedHidden]) nodes[id] = failingNodes(lhr.audits[id]);

	return {
		agentTree,
		agentic: fraction(lhr, 'agentic-browsing'),
		a11yScore: Math.round(a11y.score * 100),
		failedA11y,
		failedHidden,
		failedAgentRules,
		nodes,
		warnings,
	};
}

// Lighthouse HTML 리포트에서 점수 게이지 부분만 잘라 2배 해상도로 저장
export async function captureScores(browser, reportPath, outPath) {
	const context = await browser.newContext({ viewport: { width: 900, height: 600 }, deviceScaleFactor: 2 });
	try {
		const page = await context.newPage();
		await page.goto(pathToFileURL(reportPath).href);
		const items = page.locator('.lh-scores-header > *');
		await items.first().waitFor();
		await page.waitForTimeout(800); // 게이지 애니메이션이 끝날 때까지
		const boxes = await items.evaluateAll((els) => els.map((el) => {
			const r = el.getBoundingClientRect();
			return { x: r.left, y: r.top, right: r.right, bottom: r.bottom };
		}).filter((b) => b.right > b.x));
		if (boxes.length === 0) throw new Error(`점수 영역을 찾지 못함: ${reportPath}`);
		const pad = 20;
		const x = Math.max(0, Math.min(...boxes.map((b) => b.x)) - pad);
		const y = Math.max(0, Math.min(...boxes.map((b) => b.y)) - pad);
		const clip = {
			x, y,
			width: Math.max(...boxes.map((b) => b.right)) + pad - x,
			height: Math.max(...boxes.map((b) => b.bottom)) + pad - y,
		};
		await page.screenshot({ path: outPath, clip });
	} finally {
		await context.close();
	}
}

export const reportFile = (out, id) => join(out, 'reports', `${id}.html`);
