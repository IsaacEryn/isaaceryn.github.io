// 크롬에서 http:// 주소를 열었을 때 "HTTPS 미지원" 경고 화면이 뜨는지 확인한다(사이트당 이동 한 번).
// 사용법: node chrome-warning.mjs http.badssl.com example.ac.kr ...
// 결과는 호스트 이름이 들어가므로 화면에만 찍고, 집계는 손으로 옮긴다.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('../lighthouse-agentic-browsing/measure/node_modules/playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: process.env.HEADED ? false : true });
console.log('Chrome', browser.version());
for (const host of process.argv.slice(2)) {
	const page = await browser.newPage();
	let result;
	try {
		await page.goto(`http://${host}/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
		await page.waitForTimeout(1500);
		const text = (await page.evaluate(() => document.body?.innerText ?? '')).replace(/\s+/g, ' ');
		const warn = /doesn.t support a secure connection|안전한 연결을 지원하지 않습니다|HTTPS를 지원하지/i.test(text);
		result = `${warn ? 'WARNING' : 'no-warning'} final=${page.url().slice(0, 60)} | ${text.slice(0, 140)}`;
	} catch (e) {
		result = `error ${e.message.split('\n')[0].slice(0, 120)} final=${page.url().slice(0, 60)}`;
	}
	console.log(host, '→', result);
	await page.close();
	await new Promise((r) => setTimeout(r, 3000));
}
await browser.close();
