// 파이썬(OpenSSL 3)에서 TLS 핸드셰이크가 거부된 호스트만, 크롬의 TLS로도 실패하는지 https:// 이동 한 번으로 확인한다.
// 사용법: node chrome-tls-check.mjs raw/tls-recheck.txt  (호스트 이름은 화면에 찍지 않고 결과 코드만 센다)
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('../lighthouse-agentic-browsing/measure/node_modules/playwright');
const hosts = readFileSync(process.argv[2], 'utf8').trim().split('\n');
const browser = await chromium.launch({ channel: 'chrome' });
const counts = {};
for (const host of hosts) {
	const page = await browser.newPage();
	let code;
	try {
		const res = await page.goto(`https://${host}/`, { waitUntil: 'commit', timeout: 20000 });
		code = `열림(HTTP ${res?.status()})`;
	} catch (e) {
		code = (e.message.match(/net::[A-Z_]+/) ?? ['기타 오류'])[0];
	}
	counts[code] = (counts[code] ?? 0) + 1;
	await page.close();
	await new Promise((r) => setTimeout(r, 3000));
}
await browser.close();
console.log('Chrome', browser.version?.() ?? '', counts);
