const selects = [
	document.getElementById('api1'),
	document.getElementById('api2'),
	document.getElementById('api3'),
];

selects.forEach(s => s.addEventListener('change', () => {
	s.classList.toggle('fail', s.value === 'fail');
}));
selects.forEach(s => s.classList.toggle('fail', s.value === 'fail'));

const allPanel     = document.getElementById('all-panel');
const settledPanel = document.getElementById('settled-panel');
const allBtns = [
	document.getElementById('run-both'),
	document.getElementById('run-all'),
	document.getElementById('run-settled'),
];

function configs() {
	return selects.map(s => s.value === 'fail');
}

function fakeApi(id, fail) {
	const delay = 400 + Math.random() * 800;
	const t0 = Date.now();
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			const ms = Date.now() - t0;
			if (fail) reject({ id, msg: `API ${id} 오류`, ms });
			else resolve({ id, data: `데이터 ${String.fromCharCode(64 + id)}`, ms });
		}, delay);
	});
}

function mkList(panel) {
	panel.innerHTML = '';
	const list = document.createElement('div');
	list.className = 'log-list';
	panel.appendChild(list);
	return list;
}

function addRow(list, cls, text) {
	const el = document.createElement('div');
	el.className = 'log-row ' + cls;
	el.textContent = text;
	list.appendChild(el);
	return el;
}

function lock()   { allBtns.forEach(b => b.disabled = true); }
function unlock() { allBtns.forEach(b => b.disabled = false); }

async function runAll(panel) {
	const list = mkList(panel);
	const cfg  = configs();
	const rows = cfg.map((_, i) => addRow(list, 'pending', `API ${i + 1} — 요청 중`));

	const promises = cfg.map((fail, i) =>
		fakeApi(i + 1, fail)
			.then(r => {
				rows[i].className   = 'log-row ok';
				rows[i].textContent = `API ${r.id} — "${r.data}" (${r.ms}ms)`;
				return r;
			})
			.catch(e => {
				rows[i].className   = 'log-row err';
				rows[i].textContent = `API ${e.id} — ${e.msg} (${e.ms}ms)`;
				throw e;
			})
	);

	try {
		await Promise.all(promises);
		addRow(list, 'done-ok', '전체 성공 — 모든 결과 사용 가능');
	} catch (err) {
		rows.forEach(r => {
			if (r.className.includes('pending')) {
				r.className   = 'log-row err';
				r.textContent = r.textContent.replace('요청 중', '취소됨');
			}
		});
		addRow(list, 'done-err', `전체 실패 — "${err.msg}"`);
	}
}

async function runSettled(panel) {
	const list = mkList(panel);
	const cfg  = configs();
	const rows = cfg.map((_, i) => addRow(list, 'pending', `API ${i + 1} — 요청 중`));

	const results = await Promise.allSettled(cfg.map((fail, i) => fakeApi(i + 1, fail)));

	results.forEach((r, i) => {
		if (r.status === 'fulfilled') {
			const v = r.value;
			rows[i].className   = 'log-row ok';
			rows[i].textContent = `API ${v.id} — "${v.data}" (${v.ms}ms)`;
		} else {
			const e = r.reason;
			rows[i].className   = 'log-row err';
			rows[i].textContent = `API ${e.id} — ${e.msg} (${e.ms}ms)`;
		}
	});

	const n = results.filter(r => r.status === 'fulfilled').length;
	addRow(list, 'done-ok', `${n} / 3 성공 — 부분 성공도 처리 가능`);
}

document.getElementById('run-both').addEventListener('click', async () => {
	lock();
	await Promise.all([runAll(allPanel), runSettled(settledPanel)]);
	unlock();
});

document.getElementById('run-all').addEventListener('click', async () => {
	lock(); await runAll(allPanel); unlock();
});

document.getElementById('run-settled').addEventListener('click', async () => {
	lock(); await runSettled(settledPanel); unlock();
});

document.getElementById('reset-btn').addEventListener('click', () => {
	allPanel.innerHTML     = '<div class="log-empty">실행 버튼을 누르면 결과가 표시됩니다</div>';
	settledPanel.innerHTML = '<div class="log-empty">실행 버튼을 누르면 결과가 표시됩니다</div>';
});
