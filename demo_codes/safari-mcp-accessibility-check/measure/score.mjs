// audit-runs.jsonl의 답에서 케이스별 결함을 짚었는지 채점한다.
// 정규식은 1차 거르기다. 걸린 답과 안 걸린 답을 사람이 읽어 확인하고, 뒤집을 판정은 overrides.json에 적는다.
// 실행: node score.mjs  (결과: results/audit-summary.md)

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const rows = readFileSync(join(here, 'results', 'audit-runs.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const ovPath = join(here, 'results', 'overrides.json');
const overrides = existsSync(ovPath) ? JSON.parse(readFileSync(ovPath, 'utf8')) : {};

// 케이스마다 넣은 결함과, 그 결함을 짚었다고 볼 표현
export const DEFECTS = {
	c2: [
		['이미지 alt 누락', /alt|대체 ?텍스트|대체텍스트/i],
		['글자 대비 부족', /대비|명암비|contrast/i],
		['문서 lang 누락', /\blang\b|언어 속성|문서 언어|주 언어/i],
	],
	c3: [['div로 만든 버튼', /div/i]],
	c4: [['이름 없는 아이콘 버튼', /(이름|레이블|라벨|label|텍스트).{0,30}(없|누락)|(없|누락).{0,20}(이름|레이블|라벨|label)|button-name|접근 가능한 이름/i]],
	c5: [['보이는 글자와 다른 이름', /2\.5\.3|label.in.name|보이는 (텍스트|글자|레이블|라벨).{0,40}(일치|다르|불일치|포함)|(일치|다르|불일치).{0,40}보이는/i]],
	c6: [['aria-label 키워드 채우기', /키워드|스팸|SEO|과도|불필요|장황|길게|광고/i]],
	c7: [['카드 전체 aria-hidden', /aria-hidden/i]],
	c8: [['검색창 레이블 없음', /(검색|search).{0,60}(레이블|라벨|label|이름)|(레이블|라벨|label|이름).{0,60}(검색|search)/i]],
};

const key = (r, d) => `${r.tool}|${r.case}|${r.run}|${d}`;
const tools = [...new Set(rows.map((r) => r.tool))];
const table = {};
for (const r of rows) {
	for (const [name, re] of DEFECTS[r.case] ?? []) {
		const k = `${r.case}|${name}`;
		table[k] ??= {};
		table[k][r.tool] ??= { hit: 0, n: 0 };
		const hit = overrides[key(r, name)] ?? re.test(r.text ?? '');
		table[k][r.tool].hit += hit ? 1 : 0;
		table[k][r.tool].n += 1;
	}
}

let md = `# 결함별 검출 횟수\n\n| 케이스 | 결함 | ${tools.join(' | ')} |\n|---|---|${tools.map(() => '---').join('|')}|\n`;
for (const [k, v] of Object.entries(table)) {
	const [c, name] = k.split('|');
	md += `| ${c} | ${name} | ${tools.map((t) => (v[t] ? `${v[t].hit}/${v[t].n}` : '-')).join(' | ')} |\n`;
}
md += '\n| 도구 | 평균 입력 토큰 | 평균 출력 토큰 | 평균 시간(초) | 평균 비용(USD, API 환산) |\n|---|---|---|---|---|\n';
for (const t of tools) {
	const rs = rows.filter((r) => r.tool === t);
	const avg = (f) => rs.reduce((a, r) => a + f(r), 0) / rs.length;
	md += `| ${t} | ${Math.round(avg((r) => r.inputTokens))} | ${Math.round(avg((r) => r.outputTokens))} | ${avg((r) => r.durationMs / 1000).toFixed(1)} | ${avg((r) => r.costUsd).toFixed(3)} |\n`;
}
writeFileSync(join(here, 'results', 'audit-summary.md'), md);
console.log(md);
