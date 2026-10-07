// check-act-rule.mjs: ACT 규칙 하나의 W3C 승인 테스트 케이스에 axe-core를 돌려 본다
// 준비: npm i playwright@1.63.0 axe-core@4.14.0 (크롬이 설치돼 있어야 합니다)
// 실행: node check-act-rule.mjs 6cfa84
import { chromium } from 'playwright';
import fs from 'node:fs';

const RULE = process.argv[2] ?? '6cfa84';
const AXE = fs.readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const res = await fetch('https://www.w3.org/WAI/content-assets/wcag-act-rules/testcases.json');
const { testcases } = await res.json();
const browser = await chromium.launch({ channel: 'chrome' });

for (const tc of testcases.filter((t) => t.ruleId === RULE && t.approved)) {
  // 케이스마다 새 컨텍스트를 연다. 앞 케이스가 남긴 리소스가 다음 판정에 섞이지 않게
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  // meta refresh 같은 페이지 이동을 막아 테스트 문서에 머물게 한다
  await page.route('**/*', (route) => {
    const req = route.request();
    const leaving = req.isNavigationRequest() && req.frame() === page.mainFrame() && req.url() !== tc.url;
    return leaving ? route.abort('aborted') : route.continue();
  });
  await page.goto(tc.url);

  let outcome;
  if (await page.evaluate(() => !!document.getElementById('xml-viewer-style'))) {
    // 스타일시트 없는 XML 문서는 크롬이 자체 뷰어 화면으로 바꿔 보여 주므로 검사하지 않는다
    outcome = '측정 불가(크롬 XML 뷰어)';
  } else {
    // iframe 안까지 axe 주입(그사이 사라진 프레임은 건너뜀)
    for (const f of page.frames()) await f.evaluate(AXE + ';0').catch(() => {});
    outcome = await page.evaluate(async (rid) => {
      // 이 ACT 규칙에 대응한다고 axe가 밝힌 규칙 중 기본 설정에서 켜진 것만 돌린다
      // (공개 API axe.getRules()에는 켜짐 여부가 없어 내부 목록 _audit.rules를 읽는다)
      const ids = axe._audit.rules
        .filter((r) => (r.actIds ?? []).includes(rid))
        .filter((r) => r.enabled && !r.tags.includes('experimental'))
        .map((r) => r.id);
      if (ids.length === 0) return '미구현 또는 꺼짐';
      const r = await axe.run(document, { runOnly: { type: 'rule', values: ids } });
      if (r.violations.length) return 'failed';
      if (r.incomplete.length) return 'cantTell';
      return 'passed/inapplicable';
    }, RULE);
  }
  console.log(`${tc.testcaseTitle.padEnd(24)} 기대: ${tc.expected.padEnd(13)} axe: ${outcome}`);
  await ctx.close();
}

await browser.close();
