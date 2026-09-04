/* ─ 검증 규칙 ─ */
const rules = {
	name:  v => (!v || v.trim().length < 2) ? '이름은 2자 이상이어야 합니다' : null,
	email: v => (!v || !v.includes('@'))    ? '유효한 이메일 주소를 입력해주세요' : null,
	pw:    v => (!v || v.length < 8)        ? '비밀번호는 8자 이상이어야 합니다' : null,
};

/* ─ SR 로그 ─ */
function logSR(side, msg, announce = false) {
	const log = document.getElementById(`${side}-sr-log`);
	const el  = document.createElement('div');
	el.className   = 'sr-entry' + (announce ? ' announce' : '');
	el.textContent = `"${msg}"`;
	log.insertAdjacentElement('afterbegin', el);
	while (log.children.length > 12) log.removeChild(log.lastChild);
}

/* ─ 나쁜 UX ─ */
const badFields = [
	{ id: 'bad-name',  rule: rules.name,  label: '이름' },
	{ id: 'bad-email', rule: rules.email, label: '이메일' },
	{ id: 'bad-pw',    rule: rules.pw,    label: '비밀번호' },
];

badFields.forEach(({ id, rule, label }) => {
	const input = document.getElementById(id);
	const errEl = document.getElementById(`${id}-err`);
	input.addEventListener('focus', () => {
		logSR('bad', `${label} 편집 가능`);
		const err = rule(input.value);
		if (err) {
			errEl.textContent = err;
			input.classList.add('has-error');
			logSR('bad', `(오류 표시됐지만 스크린 리더에 전달 안 됨) "${err}"`);
		}
	});
});

document.getElementById('bad-form').addEventListener('submit', e => {
	e.preventDefault();
	let hasError = false;
	badFields.forEach(({ id, rule }) => {
		const input = document.getElementById(id);
		const errEl = document.getElementById(`${id}-err`);
		const err   = rule(input.value);
		if (err) { errEl.textContent = err; input.classList.add('has-error'); hasError = true; }
	});
	const result = document.getElementById('bad-submit-result');
	if (hasError) {
		result.className   = 'submit-result err';
		result.textContent = '오류가 있습니다 (포커스 이동 없음)';
		logSR('bad', '(오류 있음. 포커스 이동 없음. 어느 필드인지 모름)');
	} else {
		result.className   = 'submit-result ok';
		result.textContent = '제출 완료';
		logSR('bad', '폼 제출 완료');
	}
});

document.getElementById('bad-reset').addEventListener('click', () => {
	document.getElementById('bad-form').reset();
	badFields.forEach(({ id }) => {
		document.getElementById(id).classList.remove('has-error');
		document.getElementById(`${id}-err`).textContent = '';
	});
	document.getElementById('bad-submit-result').className   = 'submit-result';
	document.getElementById('bad-submit-result').textContent = '';
	document.getElementById('bad-sr-log').innerHTML = '';
});

/* ─ 좋은 UX ─ */
const goodFields = [
	{ id: 'good-name',  rule: rules.name,  label: '이름' },
	{ id: 'good-email', rule: rules.email, label: '이메일' },
	{ id: 'good-pw',    rule: rules.pw,    label: '비밀번호' },
];

function validateGoodField({ id, rule, label }) {
	const input = document.getElementById(id);
	const errEl = document.getElementById(`${id}-err`);
	const okEl  = document.getElementById(`${id}-ok`);
	const err   = rule(input.value);
	if (err) {
		errEl.textContent = err;
		okEl.textContent  = '';
		input.classList.add('has-error');
		input.classList.remove('is-valid');
		input.setAttribute('aria-invalid', 'true');
		logSR('good', `${label}: ${err}`, true);
		return false;
	} else if (input.value) {
		errEl.textContent = '';
		okEl.textContent  = '올바릅니다';
		input.classList.remove('has-error');
		input.classList.add('is-valid');
		input.removeAttribute('aria-invalid');
		logSR('good', `${label}: 올바릅니다`);
		return true;
	} else {
		errEl.textContent = '';
		okEl.textContent  = '';
		input.classList.remove('has-error', 'is-valid');
		input.removeAttribute('aria-invalid');
		return true;
	}
}

goodFields.forEach(field => {
	const input = document.getElementById(field.id);
	const errEl = document.getElementById(`${field.id}-err`);
	input.addEventListener('focus', () => {
		const errMsg = errEl.textContent ? `, 오류: ${errEl.textContent}` : '';
		logSR('good', `${field.label} 편집 가능${errMsg}`, !!errMsg);
	});
	input.addEventListener('blur', () => { input._blurred = true; validateGoodField(field); });
	input.addEventListener('input', () => { if (input._blurred) validateGoodField(field); });
});

document.getElementById('good-form').addEventListener('submit', e => {
	e.preventDefault();
	let firstError = null;
	let hasError   = false;
	goodFields.forEach(field => {
		const input = document.getElementById(field.id);
		input._blurred = true;
		const ok = validateGoodField(field);
		if (!ok && !firstError) firstError = input;
		if (!ok) hasError = true;
	});
	const result = document.getElementById('good-submit-result');
	if (hasError) {
		result.className   = 'submit-result err';
		result.textContent = '입력 오류를 확인해주세요';
		if (firstError) { firstError.focus(); logSR('good', '첫 번째 오류 필드로 포커스 이동됨', true); }
	} else {
		result.className   = 'submit-result ok';
		result.textContent = '제출 완료';
		logSR('good', '폼 제출 성공');
	}
});

document.getElementById('good-reset').addEventListener('click', () => {
	document.getElementById('good-form').reset();
	goodFields.forEach(({ id }) => {
		const input = document.getElementById(id);
		input.classList.remove('has-error', 'is-valid');
		input.removeAttribute('aria-invalid');
		input._blurred = false;
		document.getElementById(`${id}-err`).textContent = '';
		document.getElementById(`${id}-ok`).textContent  = '';
	});
	document.getElementById('good-submit-result').className   = 'submit-result';
	document.getElementById('good-submit-result').textContent = '';
	document.getElementById('good-sr-log').innerHTML = '';
});
