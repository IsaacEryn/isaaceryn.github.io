// W3C가 게시한 ACT 승인 규칙 테스트 케이스에 axe-core와 IBM Equal Access를 "기본 설정 그대로" 돌린다.
// 결과: results.jsonl (케이스마다 도구별 판정과, 그 판정을 낸 도구 규칙·이유)
import { chromium } from 'playwright';
import fs from 'node:fs';

const AXE = fs.readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const ACE = fs.readFileSync('node_modules/accessibility-checker-engine/ace.js', 'utf8');
const { testcases } = JSON.parse(fs.readFileSync('testcases.json', 'utf8'));
// W3C가 승인한 테스트 케이스만 (규칙이 승인됐어도 나중에 추가된 예제는 approved 표시가 없다)
const targets = testcases.filter((t) => t.approved === true);
console.log(`Targets: ${targets.length} test cases (${new Set(targets.map((t) => t.ruleId)).size} rules)`);
const out = fs.createWriteStream('results.jsonl');

async function axeOutcome(page, rid) {
  // iframe 안까지 검사하려면 모든 프레임에 axe를 넣어야 한다
  for (const f of page.frames()) {
    await f.evaluate(AXE + ';0').catch((e) => console.warn(`axe injection failed (${f.url()}): ${e.message}`));
  }
  return page.evaluate(async (rid) => {
    // 공개 API axe.getRules()에는 enabled 값이 없어 내부 목록(_audit.rules)을 읽는다
    const all = axe._audit.rules;
    const mapped = all.filter((r) => (r.actIds || []).includes(rid));
    if (!mapped.length) return { status: 'unmapped' };
    // 기본 설정: 꺼진 규칙(enabled=false)과 실험 규칙(experimental)은 돌리지 않는다
    const active = mapped.filter((r) => r.enabled && !(r.tags || []).includes('experimental')).map((r) => r.id);
    if (!active.length) return { status: 'off', mapped: mapped.map((r) => r.id) };
    const res = await axe.run(document, { runOnly: { type: 'rule', values: active } });
    const failedBy = res.violations.map((v) => v.id);
    const cantBy = res.incomplete.map((v) => v.id);
    return { status: 'ran', rules: active,
      outcome: failedBy.length ? 'failed' : cantBy.length ? 'cantTell' : 'notFailed', failedBy, cantBy };
  }, rid);
}

async function ibmOutcome(page, rid) {
  await page.evaluate(ACE + ';0');
  return page.evaluate(async (rid) => {
    // act 필드: "규칙ID" 문자열, 또는 {규칙ID: {reasonId: 결과}} 처럼 실패 이유별 매핑
    const mapOf = (a) => {
      for (const x of !a ? [] : typeof a === 'string' ? [a] : a) {
        if (x === rid) return 'rule';
        if (x && typeof x === 'object' && x[rid]) return x[rid];
      }
      return null;
    };
    const c = new ace.Checker();
    const POLICY = 'IBM_Accessibility'; // Equal Access 확장·npm 체커의 기본 정책
    const mapped = Object.values(c.engine.ruleMap).filter((r) => mapOf(r.act));
    if (!mapped.length) return { status: 'unmapped' };
    const inPolicy = (r) => (r.rulesets || []).some((s) => [].concat(s.id).includes(POLICY));
    const active = mapped.filter(inPolicy);
    if (!active.length) return { status: 'off', mapped: mapped.map((r) => r.id) };
    const res = await c.check(document, [POLICY]);
    const failedBy = [], cantBy = [];
    for (const x of res.results) {
      const r = active.find((a) => a.id === x.ruleId);
      if (!r) continue;
      const m = mapOf(r.act);
      let o;
      if (m === 'rule') o = x.value[1] === 'FAIL' ? 'fail' : (x.value[1] === 'POTENTIAL' || x.value[1] === 'MANUAL') ? 'cantTell' : 'pass';
      else o = m[x.reasonId] ?? 'pass'; // 매핑에 없는 이유는 이 ACT 규칙과 무관
      if (o === 'fail') failedBy.push(`${x.ruleId}:${x.reasonId}`);
      else if (o === 'cantTell') cantBy.push(`${x.ruleId}:${x.reasonId}`);
    }
    return { status: 'ran', rules: active.map((r) => r.id),
      outcome: failedBy.length ? 'failed' : cantBy.length ? 'cantTell' : 'notFailed', failedBy, cantBy };
  }, rid);
}

const browser = await chromium.launch({ channel: 'chrome' });
const queue = [...targets];
let done = 0, errors = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (queue.length) {
    const tc = queue.shift();
    // 케이스마다 새 브라우저 컨텍스트를 연다. 앞 케이스가 연 리소스(예: object의 mp3)가
    // 다음 케이스 렌더링에 남아 판정이 바뀌는 일이 실제로 있었다(8fc3b6 실패 예제 5)
    const ctx = await browser.newContext({ bypassCSP: true });
    const page = await ctx.newPage();
    // 테스트 대상 문서만 연다. meta refresh·스크립트 이동으로 다른 문서로 넘어가지 않게 막는다
    await page.route('**/*', (route) => {
      const req = route.request();
      // 'aborted'로 막아야 크롬이 오류 페이지로 넘어가지 않고 원래 문서에 머문다
      if (req.isNavigationRequest() && req.frame() === page.mainFrame() && req.url() !== tc.url) return route.abort('aborted');
      return route.continue();
    });
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    const r = { id: tc.testcaseId, rule: tc.ruleId, title: tc.testcaseTitle, expected: tc.expected, url: tc.url };
    try {
      await page.goto(tc.url, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(300);
      await page.evaluate(() => document.fonts.ready); // 웹 폰트가 늦게 뜨면 대비·크기 판정이 흔들린다
      if (page.url() !== tc.url) throw new Error(`left the test document: ${page.url()}`);
      // 스타일시트 없는 XML 문서는 크롬이 자체 XML 뷰어 화면으로 바꿔 보여 준다. 그 화면은 테스트 문서가 아니므로 측정에서 뺀다
      if (await page.evaluate(() => !!document.getElementById('xml-viewer-style'))) {
        r.skipped = 'not measurable (Chrome XML viewer)';
      } else {
        r.axe = await axeOutcome(page, tc.ruleId);
        r.ibm = await ibmOutcome(page, tc.ruleId);
      }
    } catch (e) {
      r.error = String(e).slice(0, 200);
      errors++;
    }
    await ctx.close();
    out.write(JSON.stringify(r) + '\n');
    if (++done % 100 === 0) console.log(done);
  }
}));
await browser.close();
out.end();
console.log(`Done: ${done} test cases, ${errors} errors`);
if (errors) process.exitCode = 1; // 오류가 있으면 집계 전에 알 수 있게
