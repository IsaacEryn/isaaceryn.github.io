// 글의 권장 코드(아이콘 + 숨긴 글자 + selectedcontent)가 크롬에서 버튼에 아이콘만 보이고, 값과 옵션 이름은 글자로 남는지 확인한다
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require('../../lighthouse-agentic-browsing/measure/node_modules/playwright');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 520, height: 300 }, deviceScaleFactor: 2 });
await page.goto(process.env.URL ?? 'http://127.0.0.1:8733/index.html');
await page.evaluate(() => {
	document.querySelector('main').innerHTML = `<div class="case" id="rec"><label for="r">머그 색상</label>
	<select id="r" class="custom"><button><selectedcontent></selectedcontent></button>
	<option value="sky"><img src="sky.svg" alt=""><span class="sr-only">하늘색</span></option>
	<option value="mint" disabled><img src="mint.svg" alt=""><span class="sr-only">민트(품절)</span></option>
	<option value="white"><img src="white.svg" alt=""><span class="sr-only">흰색</span></option></select></div>`;
});
await page.waitForTimeout(300);
const cdp = await page.context().newCDPSession(page);
const { nodes } = await cdp.send('Accessibility.getFullAXTree');
const combo = nodes.find((n) => n.role?.value === 'combobox');
const options = nodes.filter((n) => n.role?.value === 'option' && !n.ignored).map((n) => n.name?.value);
const buttonText = await page.evaluate(() => document.querySelector('#r button').innerText.trim());
await page.screenshot({ path: join(here, 'results', 'screenshots', 'post-recommended-closed.png') });
console.log(JSON.stringify({ comboName: combo?.name?.value, comboValue: combo?.value?.value, options, visibleButtonText: buttonText }));
await browser.close();
