// 강제 색 모드에서 비활성 옵션이 구분되는지 계산된 색으로 확인한다(크롬)
// 대조군: 작성자 색을 지정하지 않은 base-select와, 평소 select의 비활성 옵션
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('../../lighthouse-agentic-browsing/measure/node_modules/playwright');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
await page.goto(process.env.URL ?? 'http://127.0.0.1:8733/index.html');
await page.evaluate(() => {
	// 대조군 두 개를 페이지 끝에 붙인다: 작성자 색이 없는 base-select, 평소 select
	const wrap = document.createElement('div');
	wrap.innerHTML = `<select id="plain" style="appearance:base-select"><option>하늘색</option><option disabled>민트(품절)</option></select>
	<style>#plain::picker(select){appearance:base-select}</style>
	<select id="native"><option>하늘색</option><option disabled>민트(품절)</option></select>`;
	document.querySelector('main').append(wrap);
});
for (const forced of ['none', 'active']) {
	await page.emulateMedia({ forcedColors: forced });
	const res = await page.evaluate(() => {
		const c = (sel) => { const o = document.querySelector(sel); return o ? getComputedStyle(o).color : null; };
		return {
			s6_enabled: c('#s6 option:not([disabled])'),
			s6_disabled: c('#s6 option[disabled]'),
			plain_enabled: c('#plain option:not([disabled])'),
			plain_disabled: c('#plain option[disabled]'),
			native_enabled: c('#native option:not([disabled])'),
			native_disabled: c('#native option[disabled]'),
		};
	});
	console.log(`forced-colors: ${forced}`, JSON.stringify(res));
}
// 해결책 확인: 강제 색 모드에서 비활성 옵션에 시스템 색 GrayText를 준다
await page.addStyleTag({ content: '@media (forced-colors: active) { option:disabled { color: GrayText; } }' });
await page.emulateMedia({ forcedColors: 'active' });
console.log('GrayText 규칙 추가 후', JSON.stringify(await page.evaluate(() => ({
	s6_enabled: getComputedStyle(document.querySelector('#s6 option:not([disabled])')).color,
	s6_disabled: getComputedStyle(document.querySelector('#s6 option[disabled]')).color,
}))));
await browser.close();
