// 같은 접근성 점검 지시를 MCP 서버 세 가지에 맡긴다.
// 에이전트: Claude Code(claude -p). 내장 도구는 끄고 MCP 서버 하나만 붙이며, 그 서버의 도구는 모두 허용한다.
// 실행: node run-audit.mjs --tool safari --runs 2   (tool: safari | devtools | playwright)
// 결과: results/audit-runs.jsonl

import { spawn } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
	const i = process.argv.indexOf(`--${name}`);
	return i > 0 ? process.argv[i + 1] : fallback;
};
const TOOL = arg('tool', 'safari');
const MODEL = arg('model', 'claude-sonnet-5-5');
const RUNS = Number(arg('runs', '2'));
const CONCURRENCY = Number(arg('concurrency', TOOL === 'safari' ? '1' : '3'));
const CASES = arg('cases', 'c1,c2,c3,c4,c5,c6,c7,c8').split(',');
// --mode readonly: 이동과 '페이지 읽기' 도구만 남기고 나머지(자바스크립트 실행, Lighthouse, 스크린샷 등)는 모델에게서 뺀다.
// 도구가 건네는 글자만으로 무엇을 찾는지 보려는 변형이다
const MODE = arg('mode', 'full');
const ALL_TOOLS = {
	safari: ['browser_console_messages', 'browser_dialogs', 'close_tab', 'create_tab', 'evaluate_javascript', 'get_network_request', 'get_page_content', 'list_network_requests', 'list_tabs', 'navigate_to_url', 'page_info', 'page_interactions', 'screenshot', 'set_emulated_media', 'set_viewport_size', 'switch_tab', 'wait_for_navigation'],
	devtools: ['click', 'close_page', 'drag', 'emulate', 'evaluate_script', 'fill', 'fill_form', 'get_console_message', 'get_css_styles', 'get_network_request', 'handle_dialog', 'hover', 'lighthouse_audit', 'list_console_messages', 'list_network_requests', 'list_pages', 'navigate_page', 'new_page', 'performance_analyze_insight', 'performance_start_trace', 'performance_stop_trace', 'press_key', 'resize_page', 'screencast_start', 'screencast_stop', 'select_page', 'take_heapsnapshot', 'take_screenshot', 'take_snapshot', 'type_text', 'upload_file', 'wait_for'],
	playwright: ['browser_close', 'browser_resize', 'browser_console_messages', 'browser_handle_dialog', 'browser_emulate_media', 'browser_evaluate', 'browser_file_upload', 'browser_drop', 'browser_find', 'browser_fill_form', 'browser_press_key', 'browser_type', 'browser_navigate', 'browser_navigate_back', 'browser_network_requests', 'browser_network_request', 'browser_run_code_unsafe', 'browser_take_screenshot', 'browser_snapshot', 'browser_click', 'browser_drag', 'browser_hover', 'browser_select_option', 'browser_tabs', 'browser_wait_for'],
};
const READ_TOOLS = {
	safari: ['navigate_to_url', 'get_page_content', 'page_info'],
	devtools: ['list_pages', 'new_page', 'navigate_page', 'select_page', 'take_snapshot'],
	playwright: ['browser_navigate', 'browser_snapshot'],
};
const BASE = process.env.BASE ?? 'http://127.0.0.1:8734';
const NPX = join(homedir(), '.npm/_npx');

const SERVERS = {
	safari: { name: 'safari', command: '/usr/bin/safaridriver', args: ['--mcp'] },
	devtools: { name: 'dt', command: process.execPath, args: [join(NPX, '053a863a8198098a/node_modules/chrome-devtools-mcp/build/src/bin/chrome-devtools-mcp.js'), '--headless', '--isolated'] },
	playwright: { name: 'pw', command: process.execPath, args: [join(NPX, '9833c18b2d85bc59/node_modules/@playwright/mcp/cli.js'), '--headless', '--isolated', '--browser', 'chrome'] },
};
const server = SERVERS[TOOL];
const configPath = join(here, `mcp-${TOOL}.json`);
writeFileSync(configPath, JSON.stringify({ mcpServers: { [server.name]: { command: server.command, args: server.args } } }, null, '\t'));

const out = join(here, 'results', 'audit-runs.jsonl');
mkdirSync(dirname(out), { recursive: true });

function runOnce(caseId, run) {
	const prompt = `${BASE}/${caseId}.html 페이지의 웹 접근성 문제를 찾아서 목록으로 알려줘.`;
	const args = [
		'-p', prompt,
		'--setting-sources', '',
		'--strict-mcp-config', '--mcp-config', configPath,
		'--tools', '',
		'--allowedTools', `mcp__${server.name}`,
		...(MODE === 'readonly' ? ['--disallowedTools', ALL_TOOLS[TOOL].filter((t) => !READ_TOOLS[TOOL].includes(t)).map((t) => `mcp__${server.name}__${t}`).join(',')] : []),
		'--model', MODEL,
		'--output-format', 'stream-json', '--verbose',
		'--no-session-persistence',
	];
	// 바깥 Claude Code 세션의 환경 변수(CLAUDE*)는 물려주지 않는다. 인증은 키체인의 로그인 정보를 쓴다
	const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('CLAUDE')));
	return new Promise((resolve) => {
		const child = spawn('claude', args, { cwd: process.env.AGENT_CWD ?? '/tmp', env, stdio: ['ignore', 'pipe', 'pipe'] });
		let stdout = '';
		child.stdout.on('data', (d) => { stdout += d; });
		child.on('close', () => {
			const toolCalls = [];
			let result = null;
			for (const line of stdout.split('\n')) {
				if (!line.trim()) continue;
				let d;
				try { d = JSON.parse(line); } catch { continue; }
				// 도구 이름과 함께 이동한 주소를 남긴다(에이전트가 어떤 경로로 원문을 읽었는지 보려고)
				if (d.type === 'assistant') for (const c of d.message.content) if (c.type === 'tool_use') toolCalls.push(c.name.replace(/^mcp__\w+__/, '') + (c.input?.url ? `(${c.input.url})` : ''));
				if (d.type === 'result') result = d;
			}
			resolve({
				case: caseId, tool: MODE === 'readonly' ? `${TOOL}-readonly` : TOOL, model: MODEL, run, toolCalls,
				text: result?.result ?? null,
				isError: result?.is_error ?? true,
				inputTokens: result ? result.usage.input_tokens + (result.usage.cache_read_input_tokens ?? 0) + (result.usage.cache_creation_input_tokens ?? 0) : null,
				outputTokens: result?.usage.output_tokens ?? null,
				costUsd: result?.total_cost_usd ?? null,
				durationMs: result?.duration_ms ?? null,
				numTurns: result?.num_turns ?? null,
				at: new Date().toISOString(),
			});
		});
	});
}

const jobs = [];
for (let run = 1; run <= RUNS; run++) for (const c of CASES) jobs.push([c, run]);
let done = 0;
async function worker() {
	while (jobs.length) {
		const [c, run] = jobs.shift();
		const rec = await runOnce(c, run);
		appendFileSync(out, JSON.stringify(rec) + '\n');
		console.log(`[${++done}] ${TOOL} ${c} #${run} turns=${rec.numTurns} in=${rec.inputTokens} tools=${rec.toolCalls.join('>')}`);
	}
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
