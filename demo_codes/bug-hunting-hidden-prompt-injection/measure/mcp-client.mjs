// 아주 작은 MCP stdio 클라이언트
// 에이전트 없이 MCP 서버의 도구를 직접 불러, 에이전트가 받는 글자를 그대로 남기려고 쓴다.
// 서버를 띄우고 initialize → tools/call 순서로 줄 단위 JSON-RPC를 주고받는다.

import { spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

const NPX = join(homedir(), '.npm/_npx');

// 실측에 쓴 서버. 버전을 바꾸려면 경로만 바꾸면 된다(npx로 한 번 받아 두면 캐시에 생긴다).
export const SERVERS = {
	playwright: {
		name: 'Playwright MCP 0.0.83',
		cmd: process.execPath,
		args: [join(NPX, '9833c18b2d85bc59/node_modules/@playwright/mcp/cli.js'), '--headless', '--isolated', '--browser', 'chrome'],
		navigate: (url) => ['browser_navigate', { url }],
		snapshot: () => ['browser_snapshot', {}],
	},
	devtools: {
		name: 'Chrome DevTools MCP 1.11.0',
		cmd: process.execPath,
		args: [join(NPX, '053a863a8198098a/node_modules/chrome-devtools-mcp/build/src/bin/chrome-devtools-mcp.js'), '--headless', '--isolated'],
		// 1.11.0부터 pageId가 필수다. --isolated로 띄우면 처음 열린 탭이 1번이다
		navigate: (url) => ['navigate_page', { pageId: 1, type: 'url', url }],
		snapshot: () => ['take_snapshot', { pageId: 1 }],
	},
};

export async function connect(key) {
	const def = SERVERS[key];
	const child = spawn(def.cmd, def.args, { stdio: ['pipe', 'pipe', 'pipe'] });
	let buf = '';
	let nextId = 1;
	const waiting = new Map();
	child.stdout.on('data', (chunk) => {
		buf += chunk;
		let i;
		while ((i = buf.indexOf('\n')) >= 0) {
			const line = buf.slice(0, i).trim();
			buf = buf.slice(i + 1);
			if (!line) continue;
			let msg;
			try { msg = JSON.parse(line); } catch { continue; }
			if (msg.id && waiting.has(msg.id)) {
				waiting.get(msg.id)(msg);
				waiting.delete(msg.id);
			}
		}
	});
	child.stderr.on('data', () => {});

	function request(method, params, timeoutMs = 60000) {
		const id = nextId++;
		child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
		return new Promise((resolve, reject) => {
			const t = setTimeout(() => reject(new Error(`${method} 시간 초과`)), timeoutMs);
			waiting.set(id, (msg) => {
				clearTimeout(t);
				msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
			});
		});
	}

	await request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'codeslog-measure', version: '1.0.0' } });
	child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

	async function call(name, args) {
		const result = await request('tools/call', { name, arguments: args });
		return (result.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
	}

	return {
		name: def.name,
		listTools: async () => (await request('tools/list', {})).tools,
		call,
		navigate: (url) => call(...def.navigate(url)),
		snapshot: () => call(...def.snapshot()),
		close: () => child.kill(),
	};
}
