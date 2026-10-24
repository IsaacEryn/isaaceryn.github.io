// 글에 넣을 화면: 케이스 하나만 남기고 펼친 목록이 아래로 열리게 해서 찍는다(크롬)
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require('../../lighthouse-agentic-browsing/measure/node_modules/playwright');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 520, height: 420 }, deviceScaleFactor: 2 });
for (const [id, box] of [['s3', 'case-icon-alt'], ['s9', 'case-icon-sronly']]) {
	await page.goto(process.env.URL ?? 'http://127.0.0.1:8733/index.html');
	await page.addStyleTag({ content: `main > *:not(#${box}) { display: none !important; } main { padding-top: 8px; } #${box} { margin: 0; }` });
	await page.click(`#${id}`);
	await page.waitForTimeout(400);
	await page.screenshot({ path: join(here, 'results', 'screenshots', `post-${id}-open.png`) });
	await page.keyboard.press('Escape');
}
await browser.close();
