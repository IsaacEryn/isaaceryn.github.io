// 타이프어헤드 실측: 같은 옵션을 기본 select와 base-select로 만들고 글자를 쳐서 값이 바뀌는지 본다.
// 한글 옵션은 자모 조합(IME) 때문에 자동화로 칠 수 없어서, 영문 옵션으로 메커니즘만 확인한다.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('../../lighthouse-agentic-browsing/measure/node_modules/playwright');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
await page.setContent(`<style>.c,.c::picker(select){appearance:base-select}</style>
<select id="n"><option>Sky</option><option>White</option><option>Black</option></select>
<select id="c" class="c"><option>Sky</option><option>White</option><option>Black</option></select>
<select id="ci" class="c"><option value="sky"><img alt="Sky" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'/%3E"></option><option value="white"><img alt="White" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'/%3E"></option><option value="black"><img alt="Black" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'/%3E"></option></select>
<style>.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}</style>
<select id="cs" class="c"><option value="sky"><img alt=""><span class="sr">Sky</span></option><option value="white"><img alt=""><span class="sr">White</span></option><option value="black"><img alt=""><span class="sr">Black</span></option></select>
<select id="cl" class="c"><option value="sky" label="Sky"><img alt=""></option><option value="white" label="White"><img alt=""></option><option value="black" label="Black"><img alt=""></option></select>`);
for (const id of ['n', 'c', 'ci', 'cl', 'cs']) {
	await page.focus('#' + id);
	await page.keyboard.press('b');
	await page.waitForTimeout(700);
	const closed = await page.$eval('#' + id, (s) => s.value);
	await page.$eval('#' + id, (s) => { s.selectedIndex = 0; });
	// 연 상태에서 치기
	await page.focus('#' + id);
	await page.keyboard.press('Enter');
	await page.waitForTimeout(300);
	await page.keyboard.press('w');
	await page.waitForTimeout(700);
	const active = await page.evaluate(() => document.activeElement?.textContent?.trim() || document.activeElement?.label || document.activeElement?.tagName);
	await page.keyboard.press('Escape');
	console.log(id, '닫힘에서 b →', closed, '| 열고 w → 포커스', active);
}
await browser.close();
