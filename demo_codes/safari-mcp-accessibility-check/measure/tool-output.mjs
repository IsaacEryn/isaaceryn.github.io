// AI 없이 MCP 서버의 '페이지 읽기' 도구를 직접 불러, 에이전트가 받는 글자를 케이스별로 저장한다.
// Safari MCP: get_page_content(기본값), Chrome DevTools MCP: take_snapshot, Playwright MCP: browser_snapshot
// 준비: Safari 설정 > Developer > "Allow remote automation and external agents" 켜기, cases/ 정적 서버(8734)
// 실행: node tool-output.mjs  (결과: results/tool-output/<케이스>.<도구>.txt, results/tool-output.json)

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const NPX = join(homedir(), '.npm/_npx');
const BASE = process.env.BASE ?? 'http://127.0.0.1:8734';
const CASES = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'];
const outDir = join(here, 'results', 'tool-output');
mkdirSync(outDir, { recursive: true });

const SERVERS = {
	safari: {
		cmd: '/usr/bin/safaridriver', args: ['--mcp'],
		read: async (call, url) => { await call('navigate_to_url', { url }); return call('get_page_content', { region: 'entire_page' }); },
		readListeners: async (call) => call('get_page_content', { region: 'entire_page', includeEventListeners: true }),
	},
	devtools: {
		cmd: process.execPath, args: [join(NPX, '053a863a8198098a/node_modules/chrome-devtools-mcp/build/src/bin/chrome-devtools-mcp.js'), '--headless', '--isolated'],
		read: async (call, url) => { await call('navigate_page', { pageId: 1, type: 'url', url }); return call('take_snapshot', { pageId: 1 }); },
	},
	playwright: {
		cmd: process.execPath, args: [join(NPX, '9833c18b2d85bc59/node_modules/@playwright/mcp/cli.js'), '--headless', '--isolated', '--browser', 'chrome'],
		read: async (call, url) => { await call('browser_navigate', { url }); return call('browser_snapshot', {}); },
	},
};

async function connect(def) {
	const child = spawn(def.cmd, def.args, { stdio: ['pipe', 'pipe', 'pipe'] });
	let buf = '';
	let id = 0;
	const waiting = new Map();
	child.stdout.on('data', (d) => {
		buf += d;
		let i;
		while ((i = buf.indexOf('\n')) >= 0) {
			const line = buf.slice(0, i).trim();
			buf = buf.slice(i + 1);
			if (!line) continue;
			try {
				const m = JSON.parse(line);
				if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
			} catch { /* 로그 줄은 건너뛴다 */ }
		}
	});
	const request = (method, params) => new Promise((resolve, reject) => {
		const myId = ++id;
		waiting.set(myId, (m) => (m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)));
		child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: myId, method, params }) + '\n');
		setTimeout(() => reject(new Error(`${method} 시간 초과`)), 60000);
	});
	await request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'codeslog', version: '1' } });
	child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
	const call = async (name, args) => {
		const r = await request('tools/call', { name, arguments: args });
		return (r.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
	};
	return { call, close: () => child.kill() };
}

const sizes = {};
for (const [tool, def] of Object.entries(SERVERS)) {
	const { call, close } = await connect(def);
	for (const c of CASES) {
		const text = await def.read(call, `${BASE}/${c}.html`);
		writeFileSync(join(outDir, `${c}.${tool}.txt`), text);
		sizes[`${c}.${tool}`] = text.length;
		if (def.readListeners && c === 'c3') writeFileSync(join(outDir, `c3.${tool}.listeners.txt`), await def.readListeners(call));
	}
	close();
	console.log(tool, '완료');
}
// 보너스: 숨김 통로 페이지(bug-hunting-hidden-prompt-injection, 8731번 포트)를 Safari MCP가 어떻게 읽는지
if (process.env.HIDDEN_BASE) {
	const { call, close } = await connect(SERVERS.safari);
	const hidden = {};
	for (const id of ['p00', 'p01', 'p02', 'p03', 'p04', 'p05', 'p06', 'p07', 'p08']) {
		const text = await SERVERS.safari.read(call, `${process.env.HIDDEN_BASE}/${id}.html`);
		writeFileSync(join(outDir, `hidden-${id}.safari.txt`), text);
		hidden[id] = text.includes('90%');
	}
	close();
	sizes.hiddenChannels = hidden;
	console.log('숨김 통로(Safari MCP get_page_content에 지시문이 있나):', hidden);
}
writeFileSync(join(here, 'results', 'tool-output.json'), JSON.stringify(sizes, null, '\t'));
console.log(sizes);
