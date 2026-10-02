// 실제 사이트 홈페이지를 같은 기준으로 잰다.
// 사용법:
//   npm run sites                                      sites.txt의 사이트를 한 번
//   npm run sites -- --runs 3                          세 번 재고 다수결로 요약
//   node measure-sites.mjs https://example.com         주소를 직접 넘기기
//   node measure-sites.mjs --summarize results/sites-2026-10-02   저장된 실행 파일로 요약만 다시 만들기
// 결과는 실행할 때마다 results/sites-<날짜>/ 새 폴더에 쌓인다(run1.json … summary.md·summary.json).
// 측정 대상의 접속 차단 정책과 이용약관을 존중하고, 차단을 우회하지 마세요.
// sites.txt 형식: 한 줄에 "URL 이름", #으로 시작하면 주석

import { readFile, writeFile, mkdir, readdir, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import * as chromeLauncher from 'chrome-launcher';
import { judge, runLighthouse } from './lib.mjs';

const RESULTS = join(import.meta.dirname, 'results');

// 요청한 주소와 최종 주소의 호스트가 다르면(앞의 www.는 무시) 다른 페이지를 쟀을 수 있다.
// 접속 차단 안내 페이지로 넘어간 경우가 실제로 있었다 — 이런 사이트는 요약 표에서 빼고 따로 보여 준다
const bareHost = (url) => new URL(url).hostname.replace(/^www\./, '');
const hostChanged = (r) => Boolean(r.finalUrl) && bareHost(r.url) !== bareHost(r.finalUrl);

function parseArgs(args) {
	const opts = { runs: 1, summarize: null, urls: [] };
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--runs') opts.runs = Number(args[++i]);
		else if (args[i] === '--summarize') opts.summarize = resolve(args[++i] ?? '');
		else opts.urls.push(args[i]);
	}
	if (!Number.isInteger(opts.runs) || opts.runs < 1) throw new Error('--runs에는 1 이상의 정수를 주세요');
	return opts;
}

async function readSites(urls) {
	if (urls.length) return urls.map((url) => ({ url, name: new URL(url).hostname }));
	return (await readFile(join(import.meta.dirname, 'sites.txt'), 'utf8'))
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith('#'))
		.map((line) => {
			const [url, ...name] = line.split(/\s+/);
			return { url, name: name.join(' ') || new URL(url).hostname };
		});
}

// 같은 날 다시 재도 이전 결과를 덮어쓰지 않도록 새 폴더를 만든다
async function newRunDir() {
	const d = new Date();
	const day = [d.getFullYear(), d.getMonth() + 1, d.getDate()].map((n) => String(n).padStart(2, '0')).join('-');
	for (let n = 1; ; n++) {
		const dir = join(RESULTS, n === 1 ? `sites-${day}` : `sites-${day}-${n}`);
		try {
			await access(dir);
		} catch {
			await mkdir(join(dir, 'screens'), { recursive: true });
			return dir;
		}
	}
}

async function measureOnce(sites, port, dir, runNo) {
	const startedAt = new Date().toISOString();
	const results = [];
	let lighthouseVersion = '';
	let lighthouseUserAgent = '';
	for (const site of sites) {
		process.stdout.write(`[${runNo}회차] ${site.name} … `);
		try {
			const { lhr } = await runLighthouse(site.url, port);
			lighthouseVersion = lhr.lighthouseVersion;
			lighthouseUserAgent = lhr.environment.hostUserAgent;
			if (lhr.runtimeError) throw new Error(`${lhr.runtimeError.code} ${lhr.runtimeError.message}`);
			const r = {
				...site,
				finalUrl: lhr.finalDisplayedUrl,
				mainDocumentUrl: lhr.mainDocumentUrl,
				runWarnings: lhr.runWarnings,
				...judge(lhr),
			};
			// 어떤 화면을 쟀는지 나중에 확인할 수 있게 전체 화면 캡처를 남긴다(커밋하지 않음)
			const [, ext, data] = lhr.fullPageScreenshot?.screenshot?.data?.match(/^data:image\/(\w+);base64,(.+)$/) ?? [];
			if (data) await writeFile(join(dir, 'screens', `${new URL(site.url).hostname}-run${runNo}.${ext}`), Buffer.from(data, 'base64'));
			results.push(r);
			console.log(r.error
				? `측정 오류: ${r.error}`
				: `에이전트형 ${r.agentic.passed}/${r.agentic.total} · 접근성 ${r.a11yScore}${hostChanged(r) ? ` · 최종 주소가 다른 호스트(${r.finalUrl})` : ''}`);
		} catch (err) {
			results.push({ ...site, error: String(err.message ?? err).slice(0, 200) });
			console.log(`측정 실패: ${results.at(-1).error}`);
		}
	}
	return { lighthouseVersion, lighthouseUserAgent, startedAt, measuredAt: new Date().toISOString(), results };
}

// ── 다수결 ──────────────────────────────────────────────────
function mode(values) {
	const counts = new Map();
	for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
	const top = Math.max(...counts.values());
	const winners = [...counts].filter(([, c]) => c === top).map(([v]) => v);
	return { value: winners[0], tie: winners.length > 1 };
}
const median = (nums) => [...nums].sort((a, b) => a - b)[Math.floor(nums.length / 2)];

// 절반 넘는 실행에서 나온 규칙만 남긴다(처음 나온 순서 유지)
function majorityRules(lists) {
	const counts = new Map();
	for (const list of lists) for (const id of list) counts.set(id, (counts.get(id) ?? 0) + 1);
	return [...counts].filter(([, c]) => c > lists.length / 2).map(([id]) => id);
}

function partsMap(parts) {
	return Object.fromEntries(parts.map((p) => p.split('=')));
}

function summarizeSite(valid) {
	const tree = mode(valid.map((r) => r.agentTree));
	const frac = mode(valid.map((r) => `${r.agentic.passed}/${r.agentic.total}`));
	const score = mode(valid.map((r) => r.a11yScore));
	const failedAgentRules = majorityRules(valid.map((r) => r.failedAgentRules));
	const failedA11y = majorityRules(valid.map((r) => r.failedA11y));
	const failedHidden = majorityRules(valid.map((r) => r.failedHidden));
	const auditIds = [...new Set(valid.flatMap((r) => Object.keys(partsMap(r.agentic.parts))))];
	const parts = Object.fromEntries(auditIds.map((id) => [id, mode(valid.map((r) => partsMap(r.agentic.parts)[id])).value]));
	return {
		agentTree: tree.tie ? 'split' : tree.value,
		agentic: frac.value,
		agenticTie: frac.tie,
		a11yScore: score.tie ? median(valid.map((r) => r.a11yScore)) : score.value,
		failedAgentRules,
		otherFailures: failedA11y.filter((id) => !failedAgentRules.includes(id)),
		failedHidden,
		parts,
	};
}

// 다수결과 다른 실행을 한 줄로 적는다 — 판정이 어떤 요소 하나로 뒤집히는지 보이게
function variation(run, sum) {
	const diffs = [];
	if (run.agentTree !== sum.agentTree) diffs.push(`트리 감사 ${run.agentTree === 'pass' ? '통과' : '실패'}`);
	const frac = `${run.agentic.passed}/${run.agentic.total}`;
	if (frac !== sum.agentic) {
		const changed = Object.entries(partsMap(run.agentic.parts)).filter(([id, v]) => sum.parts[id] !== v).map(([id, v]) => `${id}=${v}`);
		diffs.push(`에이전트형 ${frac}(${changed.join(', ')})`);
	}
	if (run.a11yScore !== sum.a11yScore) diffs.push(`접근성 ${run.a11yScore}점`);
	const majority = new Set([...sum.failedAgentRules, ...sum.otherFailures, ...sum.failedHidden]);
	const mine = new Set([...run.failedA11y, ...run.failedHidden]);
	for (const id of mine) if (!majority.has(id)) diffs.push(`+${id}`);
	for (const id of majority) if (!mine.has(id)) diffs.push(`-${id}`);
	return diffs;
}

async function summarize(dir) {
	const files = (await readdir(dir))
		.filter((f) => /^run\d+\.json$/.test(f))
		.sort((a, b) => parseInt(a.slice(3), 10) - parseInt(b.slice(3), 10));
	if (files.length === 0) throw new Error(`실행 파일(run1.json …)이 없음: ${dir}`);
	const runs = await Promise.all(files.map(async (f) => JSON.parse(await readFile(join(dir, f), 'utf8'))));

	const sites = new Map();
	runs.forEach((run, k) => {
		for (const r of run.results) {
			if (!sites.has(r.url)) sites.set(r.url, { name: r.name, url: r.url, runs: [] });
			sites.get(r.url).runs.push({ runNo: k + 1, ...r });
		}
	});

	const rows = [];
	const variations = [];
	const excluded = [];
	const failed = [];
	const notes = [];
	for (const site of sites.values()) {
		const changed = site.runs.filter((r) => !r.error && hostChanged(r));
		if (changed.length) {
			excluded.push({ name: site.name, url: site.url, finalUrls: [...new Set(changed.map((r) => r.finalUrl))], runs: changed.map((r) => r.runNo) });
			continue;
		}
		const valid = site.runs.filter((r) => !r.error);
		if (valid.length === 0) {
			failed.push({ name: site.name, url: site.url, errors: site.runs.map((r) => r.error) });
			continue;
		}
		const sum = summarizeSite(valid);
		rows.push({ name: site.name, url: site.url, measured: valid.length, total: site.runs.length, ...sum });
		// 규칙별 과반으로 합치면 어느 실행과도 다른 행이 나올 수 있다 — 그럴 땐 알린다
		if (valid.length > 1 && valid.every((r) => variation(r, sum).length > 0)) {
			notes.push(`${site.name}: 다수결 요약 행이 어느 실행과도 같지 않습니다(값을 항목별 과반으로 합쳤습니다)`);
		}
		for (const r of valid) {
			const diffs = variation(r, sum);
			if (diffs.length) variations.push({ name: site.name, runNo: r.runNo, diffs });
			for (const w of r.runWarnings ?? []) notes.push(`${site.name} ${r.runNo}회차 Lighthouse 경고: ${w}`);
			for (const w of r.warnings ?? []) notes.push(`${site.name} ${r.runNo}회차: ${w}`);
		}
	}

	const isLegacy = (run) => run.results.some((r) => !r.error && !('runWarnings' in r));
	const legacy = runs.every(isLegacy) ? 'all' : runs.some(isLegacy) ? 'some' : null;
	const times = runs.map((run) => run.measuredAt).sort();
	const starts = runs.map((run) => run.startedAt).filter(Boolean).sort();
	const summary = {
		runs: runs.length,
		lighthouseVersion: runs.at(-1).lighthouseVersion,
		lighthouseUserAgent: runs.at(-1).lighthouseUserAgent ?? null,
		measuredFrom: starts.length === runs.length ? starts[0] : null,
		measuredTo: times.at(-1),
		runEndTimes: times,
		rows, variations, excluded, failed, notes,
	};
	await writeFile(join(dir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');

	const tree = (v) => ({ pass: '통과', fail: '실패', split: '갈림' })[v];
	const lines = [
		'# 실제 사이트 실측 — 다수결 요약',
		'',
		summary.measuredFrom
			? `- 실행 ${summary.runs}회 · Lighthouse ${summary.lighthouseVersion} · 데스크톱 설정 · ${summary.measuredFrom} ~ ${summary.measuredTo}`
			: `- 실행 ${summary.runs}회 · Lighthouse ${summary.lighthouseVersion} · 데스크톱 설정 · 회차별 종료 시각 ${summary.runEndTimes.join(', ')}`,
		'- 표의 값은 실행 결과의 다수결입니다(점수가 모두 다르면 중앙값). 규칙은 절반 넘는 실행에서 나온 것만 적었습니다.',
		'- 최종 주소의 호스트가 요청과 다른 사이트는 다른 페이지를 쟀을 수 있어 표에서 뺐습니다(아래 「표에서 뺀 사이트」).',
		...(legacy ? [`- 이 폴더의 실행 파일${legacy === 'all' ? '은 모두' : ' 일부는'} 스크립트 개정 전에 잰 것이라 Lighthouse 경고(runWarnings)·시작 시각·전체 화면 캡처가 없습니다.`] : []),
		'',
		'| 사이트 | 트리 감사 | 에이전트형 브라우징 | 접근성 점수 | 트리 감사에 걸린 규칙 | 그 밖에 점수에 든 실패 | 숨은 실패(가중치 0) |',
		'|---|---|---|---|---|---|---|',
		...rows.map((r) => '| ' + [
			r.measured < r.total ? `${r.name} (${r.total}회 중 ${r.measured}회 측정)` : r.name,
			tree(r.agentTree),
			r.agenticTie ? `${r.agentic} (갈림)` : r.agentic,
			r.a11yScore,
			r.failedAgentRules.join(', ') || '없음',
			r.otherFailures.join(', ') || '없음',
			r.failedHidden.join(', ') || '없음',
		].join(' | ') + ' |'),
		'',
		'## 실행마다 달랐던 값',
		'',
		...(variations.length ? variations.map((v) => `- ${v.name} ${v.runNo}회차: ${v.diffs.join(' · ')}`) : ['- 없음']),
		'',
		'## 표에서 뺀 사이트',
		'',
		...(excluded.length
			? excluded.map((e) => `- ${e.name}: ${e.url} → ${e.finalUrls.join(', ')} (${e.runs.join('·')}회차)`)
			: ['- 없음']),
		'',
		...(failed.length ? ['## 측정 실패', '', ...failed.map((f) => `- ${f.name}: ${f.errors.join(' / ')}`), ''] : []),
		...(notes.length ? ['## 경고', '', ...notes.map((n) => `- ${n}`), ''] : []),
		'## 에이전트형 브라우징 세부(다수결)',
		'',
		...rows.map((r) => `- ${r.name}: ${Object.entries(r.parts).map(([id, v]) => `${id}=${v}`).join(', ')}`),
		'',
	];
	await writeFile(join(dir, 'summary.md'), lines.join('\n'));
	console.log('\n' + lines.join('\n'));
}

// ── 실행 ────────────────────────────────────────────────────
const opts = parseArgs(process.argv.slice(2));
if (opts.summarize) {
	await summarize(opts.summarize);
} else {
	const sites = await readSites(opts.urls);
	if (sites.length === 0) throw new Error('잴 사이트가 없음 — sites.txt에 주소를 적거나 인자로 넘기세요');
	const dir = await newRunDir();
	const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new'] });
	try {
		for (let k = 1; k <= opts.runs; k++) {
			const run = await measureOnce(sites, chrome.port, dir, k);
			await writeFile(join(dir, `run${k}.json`), JSON.stringify(run, null, 2) + '\n');
		}
	} finally {
		await chrome.kill();
	}
	await summarize(dir);
}
