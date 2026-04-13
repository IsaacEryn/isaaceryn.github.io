/* ─ Tab switching ─ */
const tabBtns = document.querySelectorAll('[role="tab"]');
tabBtns.forEach(btn => {
	btn.addEventListener('click', () => {
		tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
		document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
		btn.classList.add('active');
		btn.setAttribute('aria-selected', 'true');
		document.getElementById(btn.getAttribute('aria-controls')).classList.add('active');
	});
});
document.querySelector('[role="tablist"]').addEventListener('keydown', e => {
	const tabs = [...tabBtns];
	const idx  = tabs.indexOf(document.activeElement);
	if (e.key === 'ArrowRight' && idx < tabs.length - 1) { tabs[idx + 1].focus(); tabs[idx + 1].click(); }
	if (e.key === 'ArrowLeft'  && idx > 0)               { tabs[idx - 1].focus(); tabs[idx - 1].click(); }
});

/* ─ Bad form ─ */
function submitBad(e) {
	e.preventDefault();
	['bad-name', 'bad-email', 'bad-pw'].forEach(id => {
		const el = document.getElementById(id);
		if (!el.value.trim()) { el.classList.add('has-error'); el.style.borderColor = 'var(--red)'; }
		else { el.classList.remove('has-error'); el.style.borderColor = ''; }
	});
	return false;
}

/* ─ Good form ─ */
function setErr(inputId, errId, msg) {
	const input = document.getElementById(inputId);
	const err   = document.getElementById(errId);
	if (msg) { input.setAttribute('aria-invalid', 'true'); err.textContent = msg; }
	else     { input.removeAttribute('aria-invalid');       err.textContent = ''; }
}

function submitGood(e) {
	e.preventDefault();
	const errs    = [];
	const name    = document.getElementById('good-name').value.trim();
	const email   = document.getElementById('good-email').value.trim();
	const pw      = document.getElementById('good-pw').value;
	const payment = document.querySelector('input[name="good-pay"]:checked');
	const agree   = document.getElementById('good-agree').checked;

	if (!name)  { setErr('good-name',  'good-name-err',  '이름을 입력해주세요.');            errs.push({ msg: '이름: 필수 항목입니다.',           href: '#good-name' }); }
	else          setErr('good-name',  'good-name-err',  '');

	if (!email) { setErr('good-email', 'good-email-err', '이메일을 입력해주세요.');           errs.push({ msg: '이메일: 필수 항목입니다.',          href: '#good-email' }); }
	else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		setErr('good-email', 'good-email-err', '올바른 이메일 형식으로 입력해주세요. 예: hello@example.com');
		errs.push({ msg: '이메일: 올바른 형식으로 입력해주세요.', href: '#good-email' });
	} else setErr('good-email', 'good-email-err', '');

	if (!pw || pw.length < 8) { setErr('good-pw', 'good-pw-err', '비밀번호는 8자 이상이어야 합니다.'); errs.push({ msg: '비밀번호: 8자 이상 입력해주세요.', href: '#good-pw' }); }
	else setErr('good-pw', 'good-pw-err', '');

	if (!payment) { document.getElementById('good-pay-err').textContent = '결제 수단을 선택해주세요.'; errs.push({ msg: '결제 수단: 1개를 선택해주세요.', href: '#good-card' }); }
	else document.getElementById('good-pay-err').textContent = '';

	if (!agree) { setErr('good-agree', 'good-agree-err', '이용약관에 동의해주세요.'); errs.push({ msg: '이용약관: 동의가 필요합니다.', href: '#good-agree' }); }
	else setErr('good-agree', 'good-agree-err', '');

	const summary = document.getElementById('good-summary');
	const success = document.getElementById('good-success');
	if (errs.length > 0) {
		document.getElementById('summary-ttl').textContent  = errs.length + '개의 입력 오류가 있습니다.';
		document.getElementById('summary-list').innerHTML   = errs.map(e => `<li><a href="${e.href}">${e.msg}</a></li>`).join('');
		summary.hidden = false; success.classList.remove('show'); summary.focus();
	} else {
		summary.hidden = true; success.classList.add('show');
		document.getElementById('good-form').reset();
		document.querySelectorAll('#good-form [aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
		success.focus();
	}
	return false;
}

document.getElementById('good-email').addEventListener('blur', function () {
	if (this.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value)) setErr('good-email', 'good-email-err', '올바른 이메일 형식이 아닙니다.');
	else if (this.value) setErr('good-email', 'good-email-err', '');
});
document.getElementById('good-pw').addEventListener('blur', function () {
	if (this.value && this.value.length < 8) setErr('good-pw', 'good-pw-err', '8자 이상 입력해주세요.');
	else if (this.value) setErr('good-pw', 'good-pw-err', '');
});

/* ─ Error demo panel ─ */
function addEntry(logId, text, isAnnounce) {
	const log = document.getElementById(logId);
	if (log.querySelector('.sr-entry')?.textContent === '버튼을 눌러보세요') log.innerHTML = '';
	const el = document.createElement('div');
	el.className = 'sr-entry' + (isAnnounce ? ' announce' : '');
	el.textContent = text;
	log.appendChild(el);
	log.scrollTop = log.scrollHeight;
}

function triggerBadError() {
	document.getElementById('err-bad-input').style.borderColor = 'var(--red)';
	document.getElementById('err-bad-msg').textContent = '이메일 형식이 올바르지 않습니다.';
	addEntry('bad-sr-log', '❌ 아무것도 발표하지 않음 (aria 없음)', false);
	addEntry('bad-sr-log', '시각적으로만: 빨간 테두리 + 텍스트 변경', false);
	addEntry('bad-sr-log', '포커스 이동 전까지 에러를 알 수 없음', false);
}
function resetBadError() {
	const input = document.getElementById('err-bad-input');
	input.style.borderColor = ''; input.classList.remove('has-error');
	document.getElementById('err-bad-msg').textContent = '';
	document.getElementById('bad-sr-log').innerHTML = '<div class="sr-entry">버튼을 눌러보세요</div>';
}

function triggerGoodError() {
	document.getElementById('err-good-input').setAttribute('aria-invalid', 'true');
	document.getElementById('err-good-msg').textContent = '올바른 이메일 형식으로 입력해주세요. 예: hello@example.com';
	setTimeout(() => {
		addEntry('good-sr-log', '🔊 "올바른 이메일 형식으로 입력해주세요. 예: hello@example.com"', true);
		addEntry('good-sr-log', '↑ role="alert" → DOM 추가 즉시 발표', false);
	}, 80);
	setTimeout(() => {
		addEntry('good-sr-log', '🔊 (포커스 시) "이메일, 필수, 오류: 올바른 형식으로 입력하세요"', true);
		addEntry('good-sr-log', '↑ aria-invalid="true" → 포커스 시 오류 상태 재확인', false);
	}, 600);
}
function resetGoodError() {
	document.getElementById('err-good-input').removeAttribute('aria-invalid');
	document.getElementById('err-good-msg').textContent = '';
	document.getElementById('good-sr-log').innerHTML = '<div class="sr-entry">버튼을 눌러보세요</div>';
}
