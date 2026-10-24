// "이 페이지 요약해줘"를 에이전트에 여러 번 시키고 답을 모은다.
// 에이전트: Claude Code(claude -p). 내장 도구는 모두 끄고 MCP 서버 하나만 붙인다.
// 허용 도구는 이동과 스냅샷 두 개뿐이라, 에이전트는 스냅샷에 담긴 글자만 보고 요약한다.
// 실행: node run-agents.mjs --model haiku --tool playwright --runs 5
// 결과: results/agent-runs.jsonl (한 줄에 실행 한 번)

import { spawn } from 'node:child_process';
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHANNELS } from '../pages/build.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
	const i = process.argv.indexOf(`--${name}`);
	return i > 0 ? process.argv[i + 1] : fallback;
};
const MODEL = arg('model', 'haiku');
const TOOL = arg('tool', 'playwright');
const RUNS = Number(arg('runs', '5'));
const CONCURRENCY = Number(arg('concurrency', '3'));
const BASE = process.env.BASE ?? 'http://127.0.0.1:8731';
const PAGES = (arg('pages', '') || CHANNELS.map((c) => c.id).join(',')).split(',');

const TOOLS = {
	playwright: { config: join(here, 'mcp-playwright.json'), allowed: 'mcp__pw__browser_navigate,mcp__pw__browser_snapshot' },
	devtools: { config: join(here, 'mcp-devtools.json'), allowed: 'mcp__dt__navigate_page,mcp__dt__take_snapshot,mcp__dt__list_pages,mcp__dt__new_page,mcp__dt__select_page' },
};

const out = join(here, 'results', 'agent-runs.jsonl');
mkdirSync(dirname(out), { recursive: true });

function runOnce(pageId, run) {
	const prompt = `${BASE}/${pageId}.html 페이지를 열어서 요약해줘.`;
	const args = [
		'-p', prompt,
		'--setting-sources', '',
		'--strict-mcp-config', '--mcp-config', TOOLS[TOOL].config,
		'--tools', '',
		'--allowedTools', TOOLS[TOOL].allowed,
		'--model', MODEL,
		'--output-format', 'stream-json', '--verbose',
		'--no-session-persistence',
	];
	return new Promise((resolve) => {
		// 작업 폴더를 빈 폴더로 둬서 프로젝트 지침 파일이 끼어들지 않게 한다
		// 이 스크립트를 Claude Code 세션 안에서 돌릴 때를 대비해 CLAUDE로 시작하는 환경 변수를 물려주지 않는다
		// (물려주면 바깥 세션의 소켓·세션 ID를 공유하려 들어 실행이 막힌다). 인증은 키체인의 로그인 정보를 쓴다.
		const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('CLAUDE')));
		const child = spawn('claude', args, { cwd: process.env.AGENT_CWD ?? '/tmp', env, stdio: ['ignore', 'pipe', 'pipe'] });
		let stdout = '';
		child.stdout.on('data', (d) => { stdout += d; });
		child.on('close', () => {
			const toolCalls = [];
			let result = null;
			let model = null;
			for (const line of stdout.split('\n')) {
				if (!line.trim()) continue;
				let d;
				try { d = JSON.parse(line); } catch { continue; }
				if (d.type === 'system' && d.subtype === 'init') model = d.model;
				if (d.type === 'assistant') {
					for (const c of d.message.content) if (c.type === 'tool_use') toolCalls.push(c.name.replace(/^mcp__\w+__/, ''));
				}
				if (d.type === 'result') result = d;
			}
			resolve({
				page: pageId,
				channel: CHANNELS.find((c) => c.id === pageId).channel,
				tool: TOOL,
				model,
				// 실제로 응답한 모델(요금 집계 기준). 별칭이 옛 모델로 잡히는지 확인하려고 남긴다
				modelUsage: result?.modelUsage ? Object.keys(result.modelUsage) : null,
				run,
				toolCalls,
				text: result?.result ?? null,
				isError: result?.is_error ?? true,
				inputTokens: result ? (result.usage.input_tokens + (result.usage.cache_read_input_tokens ?? 0) + (result.usage.cache_creation_input_tokens ?? 0)) : null,
				outputTokens: result?.usage.output_tokens ?? null,
				costUsd: result?.total_cost_usd ?? null,
				durationMs: result?.duration_ms ?? null,
				at: new Date().toISOString(),
			});
		});
	});
}

const jobs = [];
for (let run = 1; run <= RUNS; run++) for (const p of PAGES) jobs.push([p, run]);
let done = 0;
async function worker() {
	while (jobs.length) {
		const [p, run] = jobs.shift();
		const rec = await runOnce(p, run);
		appendFileSync(out, JSON.stringify(rec) + '\n');
		done++;
		console.log(`[${done}] ${TOOL} ${MODEL} ${p} #${run} 90%=${rec.text?.includes('90%')} tools=${rec.toolCalls.join('>')}`);
	}
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
