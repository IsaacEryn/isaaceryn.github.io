// 숨김 통로별로 "누가 그 글자를 받는가"를 잰다.
// 1) Playwright MCP browser_snapshot  2) Chrome DevTools MCP take_snapshot
// 3) 크롬 접근성 트리(CDP Accessibility.getFullAXTree, 무시되지 않은 노드)  4) innerText  5) HTML 원문
// 준비: pages/에서 정적 서버를 띄운다. python3 -m http.server 8731 --bind 127.0.0.1
// 실행: node channels.mjs  (결과: results/channels.json, results/snapshots/*.txt)

import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHANNELS } from '../pages/build.mjs';
import { connect } from './mcp-client.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
// Playwright는 lighthouse-agentic-browsing/measure에 깔린 1.63.0을 빌려 쓴다
const { chromium } = require('../../lighthouse-agentic-browsing/measure/node_modules/playwright');

const BASE = process.env.BASE ?? 'http://127.0.0.1:8731';
const MARK = '90%';
const out = join(here, 'results');
mkdirSync(join(out, 'snapshots'), { recursive: true });

const rows = [];
const pw = await connect('playwright');
const dt = await connect('devtools');
const browser = await chromium.launch({ channel: 'chrome', headless: true });

for (const c of CHANNELS) {
	const url = `${BASE}/${c.id}.html`;

	await pw.navigate(url);
	const pwSnap = await pw.snapshot();
	await dt.navigate(url);
	const dtSnap = await dt.snapshot();
	writeFileSync(join(out, 'snapshots', `${c.id}.playwright-mcp.txt`), pwSnap);
	writeFileSync(join(out, 'snapshots', `${c.id}.devtools-mcp.txt`), dtSnap);

	const page = await browser.newPage();
	await page.goto(url);
	const cdp = await page.context().newCDPSession(page);
	const { nodes } = await cdp.send('Accessibility.getFullAXTree');
	const text = (n) => [n.name?.value, n.description?.value, n.value?.value, ...(n.properties ?? []).map((p) => p.value?.value)]
		.filter((v) => typeof v === 'string').join(' ');
	const axHit = nodes.filter((n) => !n.ignored && text(n).includes(MARK));
	const axIgnoredHit = nodes.filter((n) => n.ignored && text(n).includes(MARK));
	const innerText = await page.evaluate(() => document.body.innerText);
	const html = await page.content();
	await page.close();

	const row = {
		id: c.id,
		channel: c.channel,
		label: c.label,
		playwrightMcp: pwSnap.includes(MARK),
		devtoolsMcp: dtSnap.includes(MARK),
		axTree: axHit.length > 0,
		axTreeRoles: axHit.map((n) => `${n.role?.value}`),
		axTreeIgnoredOnly: axHit.length === 0 && axIgnoredHit.length > 0,
		innerText: innerText.includes(MARK),
		html: html.includes(MARK),
		// 스냅샷 크기(글자 수). 토큰 대신 글자 수로 남긴다
		playwrightMcpChars: pwSnap.length,
		devtoolsMcpChars: dtSnap.length,
	};
	rows.push(row);
	console.log(`${c.id} ${c.channel.padEnd(18)} PW-MCP=${row.playwrightMcp} DT-MCP=${row.devtoolsMcp} AX=${row.axTree}${row.axTreeIgnoredOnly ? '(ignored만)' : ''} innerText=${row.innerText} html=${row.html}`);
}

await browser.close();
pw.close();
dt.close();

writeFileSync(join(out, 'channels.json'), JSON.stringify({
	measuredAt: new Date().toISOString(),
	tools: { playwrightMcp: pw.name, devtoolsMcp: dt.name, chrome: browser.version?.() ?? 'chrome channel' },
	mark: MARK,
	rows,
}, null, '\t'));
console.log('results/channels.json에 저장했습니다.');
