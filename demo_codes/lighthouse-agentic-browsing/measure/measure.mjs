// Lighthouse 에이전트 브라우징 실측 — 케이스 8개
// 같은 페이지를 네 갈래로 본다.
//   1) Lighthouse 13.5.0 — 에이전트형 브라우징·접근성 카테고리 판정
//   2) 역할·이름 조회 — Playwright getByRole로 "버튼, 장바구니 담기"와 "검색창, 상품 검색"을 찾는다.
//      이름으로 요소를 찾는 도구나 음성 제어에 가까운 방식이다. LLM 에이전트에게 과업을 시킨 결과가 아니다
//   3) 키보드 조회 — Tab으로 장바구니 요소까지 가서 Enter로 누른다
//   4) 스냅샷 기록 — Playwright 기본 aria 스냅샷과 AI 모드 스냅샷(Playwright MCP의 browser_snapshot이 쓰는 형태),
//      그리고 크롬 접근성 트리가 장바구니 요소에 매긴 역할·이름
// 사용법: npm ci && npm run measure   (설치된 Chrome 필요)

import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import * as chromeLauncher from 'chrome-launcher';
import { chromium } from 'playwright';
import { judge, runLighthouse, captureScores, reportFile } from './lib.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(import.meta.dirname, 'results');
const CART = '장바구니 담기';
const SEARCH = '상품 검색';
const DONE = '장바구니에 담았습니다.';

const CASES = [
	['01-baseline', '기준 페이지'],
	['02-missing-alt-contrast-lang', 'alt·대비·lang 누락'],
	['03-div-button', 'div 버튼'],
	['04-unnamed-icon-button', '이름 없는 아이콘 버튼'],
	['05-label-in-name-mismatch', '보이는 글자 ≠ aria-label'],
	['06-aria-keyword-stuffing', 'aria-label 키워드 채우기'],
	['07-aria-hidden-mistake', '카드 전체에 aria-hidden'],
	['08-unlabeled-search', '레이블 없는 검색창'],
];

// ── 정적 서버 ───────────────────────────────────────────────
// llms.txt·ai-catalog.json은 일부러 두지 않는다 → Lighthouse가 "해당 없음"으로 뺀다.
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
	let path;
	try {
		path = decodeURIComponent(new URL(req.url, 'http://local').pathname);
	} catch {
		return res.writeHead(400).end('bad request'); // 깨진 퍼센트 인코딩
	}
	if (path.endsWith('/')) path += 'index.html';
	const file = join(ROOT, path);
	if (!file.startsWith(ROOT + sep)) return res.writeHead(403).end();
	try {
		const body = await readFile(file);
		res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body);
	} catch {
		res.writeHead(404).end('not found');
	}
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const BASE = `http://127.0.0.1:${server.address().port}`;
const urlOf = (id) => `${BASE}/cases/${id}.html`;

// 크롬 접근성 트리가 요소에 매긴 역할·이름. 스크린 리더 같은 보조기술이 받는 쪽이다
async function axOf(page, selector) {
	const cdp = await page.context().newCDPSession(page);
	try {
		const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
		const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
		const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
		const n = nodes[0];
		return {
			role: n.role?.value ?? '',
			name: n.name?.value ?? '',
			ignored: Boolean(n.ignored),
			ignoredReasons: (n.ignoredReasons ?? []).map((r) => r.name),
		};
	} finally {
		await cdp.detach();
	}
}

// 스냅샷에서 상품 카드(article) 부분만 잘라 낸다. 카드가 트리에서 빠졌으면 빈 배열
function cardLines(snapshot) {
	const lines = snapshot.split('\n');
	const start = lines.findIndex((line) => /^\s*- article\b/.test(line));
	if (start === -1) return [];
	const indent = lines[start].search(/\S/);
	const out = [lines[start]];
	for (const line of lines.slice(start + 1)) {
		if (line.search(/\S/) <= indent) break;
		out.push(line);
	}
	return out;
}

// 카드 안에서 장바구니 요소에 해당하는 줄. 이름 없는 버튼(04)은 "- button"만 남는다
const cartLine = (lines) => lines.find((line) => /장바구니|카트|- button/.test(line))?.trim() ?? null;

async function probe(page, id) {
	const statusText = async () => (await page.locator('.status').textContent()).trim();

	await page.goto(urlOf(id));
	const ax = await axOf(page, '[data-cart]');
	const main = page.locator('main');
	const snapshot = { default: await main.ariaSnapshot(), ai: await main.ariaSnapshot({ mode: 'ai' }) };
	await writeFile(join(OUT, 'snapshots', `${id}.default.yml`), snapshot.default + '\n');
	await writeFile(join(OUT, 'snapshots', `${id}.ai.yml`), snapshot.ai + '\n');
	const card = { default: cardLines(snapshot.default), ai: cardLines(snapshot.ai) };

	// 역할·이름 조회: 버튼은 이름 부분 일치(Playwright 기본), 검색창은 이름이 있는지만 본다
	const byRole = page.getByRole('button', { name: CART });
	const roleCount = await byRole.count();
	let roleClick = false;
	if (roleCount === 1) {
		await byRole.click();
		roleClick = (await statusText()) === DONE;
	}
	const searchFound = (await page.getByRole('searchbox', { name: SEARCH }).count()) === 1;

	// 보이는 글자로 찾아 클릭: 마우스로 화면 글자를 누르는 것과 같다
	await page.goto(urlOf(id));
	const byText = page.getByText(CART, { exact: true });
	let textClick = false;
	if ((await byText.count()) === 1) {
		await byText.click();
		textClick = (await statusText()) === DONE;
	}

	// 키보드 조회: Tab으로 이동해 Enter
	await page.goto(urlOf(id));
	let focused = false;
	for (let i = 0; i < 20 && !focused; i++) {
		await page.keyboard.press('Tab');
		focused = await page.evaluate(() => document.activeElement?.hasAttribute('data-cart') ?? false);
	}
	let keyboard = false;
	if (focused) {
		await page.keyboard.press('Enter');
		keyboard = (await statusText()) === DONE;
	}

	return {
		ax,
		snapshotCart: { default: cartLine(card.default), ai: cartLine(card.ai) },
		cardInSnapshot: { default: card.default.length > 0, ai: card.ai.length > 0 },
		roleCount, roleClick, searchFound, textClick, keyboard,
	};
}

for (const dir of ['reports', 'snapshots', 'screenshots']) await mkdir(join(OUT, dir), { recursive: true });

let browser;
let chrome;
const results = [];
const versions = {};
try {
	// ── Playwright: 역할·이름 조회, 키보드 조회, 스냅샷 ───────────
	browser = await chromium.launch({ channel: 'chrome' });
	const page = await browser.newPage();
	const probes = {};
	for (const [id] of CASES) probes[id] = await probe(page, id);
	await page.close();

	// ── Lighthouse ──────────────────────────────────────────
	chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new'] });
	for (const [id, label] of CASES) {
		const run = await runLighthouse(urlOf(id), chrome.port, 'html');
		await writeFile(reportFile(OUT, id), run.report);
		results.push({ id, label, ...judge(run.lhr), ...probes[id] });
		versions.lighthouse = run.lhr.lighthouseVersion;
		versions.lighthouseUserAgent = run.lhr.environment.hostUserAgent;
	}

	// Lighthouse 리포트 상단(점수 게이지) 캡처 — 글에 실을 증거 이미지
	for (const [id] of CASES) {
		await captureScores(browser, reportFile(OUT, id), join(OUT, 'screenshots', `${id}-scores.png`));
	}

	const pw = JSON.parse(await readFile(new URL('./node_modules/playwright/package.json', import.meta.url), 'utf8'));
	Object.assign(versions, { chrome: browser.version(), playwright: pw.version, measuredAt: new Date().toISOString() });
} finally {
	await chrome?.kill();
	await browser?.close();
	server.close();
}

// ── 결과 ────────────────────────────────────────────────────
await writeFile(join(OUT, 'summary.json'), JSON.stringify({ versions, results }, null, 2) + '\n');

const ox = (b) => (b ? 'O' : 'X');
const axText = (ax) => (ax.ignored ? `트리에서 숨겨짐(${ax.ignoredReasons.join(', ')})` : `${ax.role} "${ax.name}"`);
const snap = (line) => (line ? `\`${line}\`` : '카드 없음');
const row = (r) => r.error
	? `| ${r.id} ${r.label} | 측정 오류: ${r.error} |` + ' |'.repeat(9)
	: '| ' + [
		`${r.id} ${r.label}`,
		r.agentTree === 'pass' ? '통과' : `실패 (${r.failedAgentRules.join(', ')})`,
		`${r.agentic.passed}/${r.agentic.total}`,
		r.a11yScore,
		r.failedA11y.join(', ') || '없음',
		r.failedHidden.join(', ') || '없음',
		r.roleClick ? 'O' : `X (${r.roleCount}개)`,
		ox(r.searchFound),
		ox(r.textClick),
		ox(r.keyboard),
		axText(r.ax),
	].join(' | ') + ' |';

const warnings = results.flatMap((r) => (r.warnings ?? []).map((w) => `- ${r.id}: ${w}`));
const lines = [
	'# 실측 결과',
	'',
	`- Lighthouse ${versions.lighthouse} · Chrome ${versions.chrome} · Playwright ${versions.playwright}`,
	`- Lighthouse 실행 브라우저 ${versions.lighthouseUserAgent}`,
	`- 측정 시각 ${versions.measuredAt}`,
	'',
	'| 케이스 | 트리 감사 | 에이전트형 브라우징 | 접근성 점수 | 점수에 든 실패 | 숨은 실패(가중치 0) | 역할·이름 조회(버튼) | 역할·이름 조회(검색창) | 보이는 글자로 클릭 | 키보드 | 크롬 접근성 트리의 장바구니 요소 |',
	'|---|---|---|---|---|---|---|---|---|---|---|',
	...results.map(row),
	'',
	'## 스냅샷 속 장바구니 요소',
	'',
	'main 영역 스냅샷에서 상품 카드 안의 해당 줄. 전체는 `snapshots/<케이스>.default.yml`·`.ai.yml`',
	'',
	'| 케이스 | Playwright 기본 aria 스냅샷 | Playwright AI 모드 스냅샷 |',
	'|---|---|---|',
	...results.map((r) => `| ${r.id} | ${snap(r.snapshotCart?.default)} | ${snap(r.snapshotCart?.ai)} |`),
	'',
	'## 에이전트형 브라우징 세부',
	'',
	...results.filter((r) => !r.error).map((r) => `- ${r.id}: ${r.agentic.parts.join(', ')}`),
	'',
	...(warnings.length ? ['## 경고', '', ...warnings, ''] : []),
];
await writeFile(join(OUT, 'summary.md'), lines.join('\n'));
console.log(lines.join('\n'));
