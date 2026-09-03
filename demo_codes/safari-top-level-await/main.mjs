// WebKit 블로그 "Fixing top-level await in Safari"의 main.js를 브라우저용으로 옮긴 것.
// 같은 모듈을 동적 import로 세 번 불러, 어느 순서로 끝나고 export에 접근할 수 있는지 본다.
const lines = []
const out = document.getElementById('dyn-log')

function print(...args) {
	const line = args.join(' ')
	lines.push(line)
	const li = document.createElement('li')
	li.textContent = line
	out.appendChild(li)
}

async function load(index) {
	try {
		print('Importing', index)
		const module = await import('./test-module.mjs')
		print('Imported', index)
		try {
			print(`Keys for ${index}:`, Object.keys(module).join(','))
		} catch (e) {
			print('Accessing', index, 'failed:', e.message)
		}
	} catch (e) {
		print('Importing', index, 'failed:', e.message)
	}
}

const imports = Array.from({ length: 3 }, (_, i) => load(i + 1))
await Promise.all(imports)

// 판정: Imported 순서와 실패 횟수
const order = lines.filter((l) => l.startsWith('Imported')).map((l) => l.split(' ')[1]).join(',')
const failed = lines.filter((l) => l.includes('failed')).length
window.__dynResult = { order, failed }
document.dispatchEvent(new CustomEvent('dyn-done', { detail: window.__dynResult }))
