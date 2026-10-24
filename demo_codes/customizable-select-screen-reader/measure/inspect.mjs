// 커스터마이즈 select 실측(자동 부분)
// 1) 크롬 접근성 트리: select마다 역할·이름·값과 옵션 이름(CDP Accessibility.getFullAXTree)
// 2) 타이프어헤드: select에 포커스를 두고 글자를 쳤을 때 값이 바뀌는가(크롬)
// 3) 강제 색 모드(forced-colors: active) 화면: 닫힌 상태와 연 상태(크롬)
// 4) 파이어폭스 대체 동작: base-select 지원 여부, 옵션 안의 이미지가 파싱 뒤 남는가, 옵션 글자
// 준비: 데모 폴더에서 python3 -m http.server 8733 --bind 127.0.0.1
// 실행: node measure/inspect.mjs  (결과: measure/results/inspect.json, screenshots/)

import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require('../../lighthouse-agentic-browsing/measure/node_modules/playwright');
// 파이어폭스는 캐시에 있는 빌드(firefox-1555, 157.0)와 프로토콜이 맞는 playwright-core를 따로 쓴다. 경로는 환경 변수로 바꿀 수 있다
const { firefox } = require(process.env.PW_CORE_FOR_FIREFOX ?? `${process.env.HOME}/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core`);
const URL = process.env.URL ?? 'http://127.0.0.1:8733/index.html';
const IDS = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'];
const shots = join(here, 'results', 'screenshots');
mkdirSync(shots, { recursive: true });
const out = { measuredAt: new Date().toISOString() };

// ---- 크롬 ----
{
	const browser = await chromium.launch({ channel: 'chrome' });
	out.chrome = { version: browser.version(), selects: {} };
	const page = await browser.newPage({ viewport: { width: 900, height: 1400 } });
	await page.goto(URL);
	out.chrome.baseSelect = await page.evaluate(() => CSS.supports('appearance', 'base-select'));
	const cdp = await page.context().newCDPSession(page);

	async function axOf(id) {
		const { nodes } = await cdp.send('Accessibility.getFullAXTree');
		const { node } = await cdp.send('DOM.describeNode', { objectId: (await cdp.send('Runtime.evaluate', { expression: `document.getElementById('${id}')` })).result.objectId });
		const byId = new Map(nodes.map((n) => [n.nodeId, n]));
		const root = nodes.find((n) => n.backendDOMNodeId === node.backendNodeId);
		const flat = [];
		(function walk(n, depth) {
			if (!n) return;
			const prop = (k) => n.properties?.find((p) => p.name === k)?.value?.value;
			if (!n.ignored) flat.push({ depth, role: n.role?.value, name: n.name?.value ?? '', value: n.value?.value, disabled: prop('disabled') || undefined, expanded: prop('expanded'), selected: prop('selected') || undefined });
			for (const c of n.childIds ?? []) walk(byId.get(c), n.ignored ? depth : depth + 1);
		})(root, 0);
		return flat;
	}

	for (const id of IDS) {
		const closed = await axOf(id);
		// 열기: 클릭으로 연다(base-select는 페이지 안 팝오버라 접근성 트리에 옵션이 남는다)
		await page.click(`#${id}`);
		await page.waitForTimeout(300);
		const open = await axOf(id);
		await page.keyboard.press('Escape');
		await page.waitForTimeout(200);
		// 타이프어헤드: 포커스를 두고 셋째 옵션의 첫 글자를 친다
		await page.focus(`#${id}`);
		const before = await page.$eval(`#${id}`, (s) => s.value);
		const third = await page.$eval(`#${id}`, (s) => [...s.options].filter((o) => !o.disabled).at(-1));
		const typed = await page.$eval(`#${id}`, (s) => { const o = [...s.options].filter((x) => !x.disabled).at(-1); return (o.label || o.textContent).trim().slice(0, 1); });
		await page.keyboard.type(typed);
		await page.waitForTimeout(800);
		const after = await page.$eval(`#${id}`, (s) => s.value);
		await page.$eval(`#${id}`, (s) => { s.selectedIndex = 0; });
		out.chrome.selects[id] = { closed, open, typeahead: { typed, before, after, changed: before !== after } };
	}

	// 강제 색 모드 화면: 펼친 목록이 다음 케이스를 덮지 않게 간격을 벌리고 찍는다
	await page.addStyleTag({ content: '.case { margin-bottom: 240px; }' });
	await page.emulateMedia({ forcedColors: 'active' });
	const CASE_OF = { s2: 'icon-text', s3: 'icon-alt', s6: 'disabled', s8: 'selectedcontent', s9: 'icon-sronly' };
	for (const id of ['s2', 's3', 's6', 's8', 's9']) {
		const box = page.locator(`#case-${CASE_OF[id]}`);
		await box.screenshot({ path: join(shots, `chrome-forced-${id}-closed.png`) });
		await page.click(`#${id}`);
		await page.waitForTimeout(300);
		await page.screenshot({ path: join(shots, `chrome-forced-${id}-open.png`), clip: await box.boundingBox().then((b) => ({ x: b.x, y: b.y, width: b.width, height: b.height + 220 })) });
		await page.keyboard.press('Escape');
	}
	await page.emulateMedia({ forcedColors: 'none' });
	for (const id of ['s2', 's3', 's6', 's8', 's9']) {
		const box = page.locator(`#case-${CASE_OF[id]}`);
		await page.click(`#${id}`);
		await page.waitForTimeout(300);
		await page.screenshot({ path: join(shots, `chrome-normal-${id}-open.png`), clip: await box.boundingBox().then((b) => ({ x: b.x, y: b.y, width: b.width, height: b.height + 220 })) });
		await page.keyboard.press('Escape');
	}
	await browser.close();
}

// ---- 파이어폭스(대체 동작) ----
// 파이어폭스가 없거나 띄우지 못하면 건너뛴다(크롬 결과는 그대로 남긴다)
try {
	const executablePath = process.env.FIREFOX_PATH;
	const browser = await firefox.launch(executablePath ? { executablePath } : {});
	out.firefox = { version: browser.version(), selects: {} };
	const page = await browser.newPage({ viewport: { width: 900, height: 1400 } });
	await page.goto(URL);
	out.firefox.baseSelect = await page.evaluate(() => CSS.supports('appearance', 'base-select'));
	for (const id of IDS) {
		out.firefox.selects[id] = await page.$eval(`#${id}`, (s) => ({
			options: [...s.options].map((o) => ({ text: o.text, label: o.label, hasImg: !!o.querySelector('img'), disabled: o.disabled })),
			hasButton: !!s.querySelector('button'),
			hasSelectedcontent: !!s.querySelector('selectedcontent'),
		}));
	}
	await page.screenshot({ path: join(shots, 'firefox-page.png'), fullPage: true });
	await browser.close();
} catch (e) {
	out.firefox = { error: e.message.split('\n')[0] };
}

writeFileSync(join(here, 'results', 'inspect.json'), JSON.stringify(out, null, '\t'));
console.log(JSON.stringify({ chrome: out.chrome.version, chromeBase: out.chrome.baseSelect, firefox: out.firefox.version ?? out.firefox.error, firefoxBase: out.firefox.baseSelect }));
for (const id of IDS) {
	const c = out.chrome.selects[id];
	const top = c.closed[0];
	console.log(id, `크롬 닫힘: ${top?.role} "${top?.name}" 값="${top?.value ?? ''}"`, '| 옵션:', c.open.filter((n) => n.role === 'option' || n.role === 'MenuListOption' || n.role === 'listboxoption').map((n) => `${n.name}${n.disabled ? '(비활성)' : ''}`).join(', '), '| 타이프어헤드', c.typeahead.typed, c.typeahead.changed);
	if (out.firefox.selects) console.log('   파이어폭스:', out.firefox.selects[id].options.map((o) => `${o.text || '∅'}${o.hasImg ? '[img]' : ''}`).join(', '));
}
