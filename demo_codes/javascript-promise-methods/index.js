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

// 문구를 여기서 만들지 않고 id·letter·ms만 넘긴다 — 문장 조립은 언어 사전(MSG)이 맡는다
function fakeApi(id, fail) {
	const delay = 400 + Math.random() * 800;
	const t0 = Date.now();
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			const ms = Date.now() - t0;
			if (fail) reject({ id, ms });
			else resolve({ id, letter: String.fromCharCode(64 + id), ms });
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

function addRow(list, cls, key, ...args) {
	const el = document.createElement('div');
	el.className = 'log-row ' + cls;
	setMsg(el, key, ...args);
	list.appendChild(el);
	return el;
}

function lock()   { allBtns.forEach(b => b.disabled = true); }
function unlock() { allBtns.forEach(b => b.disabled = false); }

async function runAll(panel) {
	const list = mkList(panel);
	const cfg  = configs();
	const rows = cfg.map((_, i) => addRow(list, 'pending', 'pending', i + 1));

	const promises = cfg.map((fail, i) =>
		fakeApi(i + 1, fail)
			.then(r => {
				rows[i].className = 'log-row ok';
				setMsg(rows[i], 'fulfilled', r.id, r.letter, r.ms);
				return r;
			})
			.catch(e => {
				rows[i].className = 'log-row err';
				setMsg(rows[i], 'rejected', e.id, e.ms);
				throw e;
			})
	);

	try {
		await Promise.all(promises);
		addRow(list, 'done-ok', 'allDone');
	} catch (err) {
		rows.forEach((r, i) => {
			if (r.className.includes('pending')) {
				r.className = 'log-row err';
				setMsg(r, 'cancelled', i + 1);
			}
		});
		addRow(list, 'done-err', 'allFailed', err.id);
	}
}

async function runSettled(panel) {
	const list = mkList(panel);
	const cfg  = configs();
	const rows = cfg.map((_, i) => addRow(list, 'pending', 'pending', i + 1));

	const results = await Promise.allSettled(cfg.map((fail, i) => fakeApi(i + 1, fail)));

	results.forEach((r, i) => {
		if (r.status === 'fulfilled') {
			const v = r.value;
			rows[i].className = 'log-row ok';
			setMsg(rows[i], 'fulfilled', v.id, v.letter, v.ms);
		} else {
			const e = r.reason;
			rows[i].className = 'log-row err';
			setMsg(rows[i], 'rejected', e.id, e.ms);
		}
	});

	const n = results.filter(r => r.status === 'fulfilled').length;
	addRow(list, 'done-ok', 'settledDone', n, results.length);
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

function emptyMarkup() {
	return '<div class="log-empty" data-i18n="empty">' + i18nText('empty') + '</div>';
}

document.getElementById('reset-btn').addEventListener('click', () => {
	allPanel.innerHTML     = emptyMarkup();
	settledPanel.innerHTML = emptyMarkup();
});
