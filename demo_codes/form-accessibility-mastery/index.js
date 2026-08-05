/* ─────────────────────────────────────────────────────────────
   언어 전환
   한국어는 HTML에 그대로 두고(JS가 죽어도 읽힌다), 영어만 여기서 갈아끼운다.

   세 가지 통로가 있다.
   1) data-i18n="키"        → 요소의 innerHTML을 EN / KO_SNAPSHOT에서 꺼내 바꾼다.
   2) data-i18n-attr="속성:키,속성:키"
                            → 속성값은 innerHTML 교체로 바뀌지 않으므로 따로 처리한다.
                              placeholder·aria-label처럼 접근 가능한 이름이 걸린 자리가 여기다.
                              값은 평문(plain text)이며 HTML 태그를 넣지 않는다.
   3) data-msg="키"         → JS가 만들어내는 문구. MSG.ko / MSG.en에서 꺼내 textContent로 넣는다.
                              언어를 바꿔도 화면에 떠 있던 에러·로그가 같이 따라온다.
   ───────────────────────────────────────────────────────────── */

const EN = {
	skip: 'Skip to main content',
	back: '← Back to demo list',
	title: 'Form Accessibility Compared',
	subtitle: 'An inaccessible form and an accessible one, side by side — feel the difference with the Tab key and a screen reader.',
	postlink: 'Read the related post →',

	guideTitle: '🧪 How to test',
	guideList: '<li><strong>Keyboard</strong>: move with <kbd>Tab</kbd> and compare the focus indicator and the order focus travels in.</li>'
		+ '<li><strong>Screen reader</strong>: turn on VoiceOver (<kbd>Cmd</kbd>+<kbd>F5</kbd> on macOS) or NVDA and compare what each field announces.</li>'
		+ '<li><strong>Trigger errors</strong>: submit with every field empty and compare how each form reports the problem.</li>',

	tabCompare: '📋 Form comparison',
	tabError: '⚠️ Error handling, in depth',
	tabCode: '💻 Code comparison',

	// ── 폼 비교 ──
	badBadge: '<span class="badge badge-bad">❌ Inaccessible form</span>',
	badSub: 'placeholder as label · error in color only · outline:none',
	badPayLabel: 'Payment method',
	badAgreeLabel: 'I agree to the terms of service',
	creditCard: 'Credit card',
	bankTransfer: 'Bank transfer',
	mobilePay: 'Mobile payment',
	signUp: 'Sign up',

	goodBadge: '<span class="badge badge-good">✅ Accessible form</span>',
	reqNote: '<span aria-hidden="true">*</span> marks a required field.',
	successMsg: '✅ Sign-up complete!',
	labelName: 'Name<span class="req-mark" aria-hidden="true">*</span><span class="sr-only">(required)</span>',
	labelEmail: 'Email<span class="req-mark" aria-hidden="true">*</span><span class="sr-only">(required)</span>',
	labelPassword: 'Password<span class="req-mark" aria-hidden="true">*</span><span class="sr-only">(required)</span>',
	emailHint: 'e.g. hello@example.com',
	pwHint: 'At least 8 characters, letters and numbers',
	payLegend: 'Payment method<span class="req-mark" aria-hidden="true">*</span><span class="sr-only">(required, choose one)</span>',
	goodAgreeLabel: 'I agree to the terms of service<span class="req-mark" aria-hidden="true">*</span><span class="sr-only">(required)</span>',

	// ── 차이점 표 ──
	diffTitle: 'Key differences',
	diffHeadRow: '<th>Aspect</th>'
		+ '<th style="color:#f87171;">❌ Inaccessible form</th>'
		+ '<th style="color:#4ade80;">✅ Accessible form</th>',
	diffRowLabel: '<td>Labelling</td><td><code>placeholder</code> only</td><td><code>&lt;label for&gt;</code>, explicitly linked</td>',
	diffRowReq: '<td>Required marker</td><td>None</td><td><code>aria-required</code> + visually hidden text</td>',
	diffRowHint: '<td>Input hints</td><td>None</td><td>Linked with <code>aria-describedby</code></td>',
	diffRowError: '<td>Error handling</td><td>Red border only</td><td><code>aria-invalid</code> + <code>role="alert"</code></td>',
	diffRowGroup: '<td>Grouping</td><td>Wrapped in a <code>&lt;div&gt;</code></td><td><code>&lt;fieldset&gt;</code> + <code>&lt;legend&gt;</code></td>',
	diffRowFocus: '<td>Focus indicator</td><td><code>outline: none</code></td><td>A clearly visible focus ring</td>',

	// ── 에러 처리 심화 ──
	errBadBadge: '<span class="badge badge-bad">❌ The screen reader never hears about it</span>',
	errBadSub: 'Visual change only — no ARIA',
	errBadFieldLabel: 'Email',
	errGoodBadge: '<span class="badge badge-good">✅ The screen reader announces it right away</span>',
	btnTriggerError: 'Trigger an error',
	btnReset: 'Reset',
	srLogTitle: 'Screen reader announcement log',
	srLogTitleSim: 'Screen reader announcement log <span style="font-weight:400;">(simulated)</span>',

	// ── 코드 비교 ──
	codeLabelLabels: 'Label association <span class="wcag-pill">WCAG 1.3.1</span><span class="wcag-pill">3.3.2</span>',
	codeBlockLabels: `<span class="ln-bad">&lt;!-- ❌ placeholder only --&gt;
&lt;input type="text" placeholder="Name"&gt;</span>

<span class="ln-good">&lt;!-- ✅ label wired up with for/id --&gt;
&lt;label for="name"&gt;
  Name &lt;span aria-hidden="true"&gt;*&lt;/span&gt;
  &lt;span class="sr-only"&gt;(required)&lt;/span&gt;
&lt;/label&gt;
&lt;input type="text" id="name" required aria-required="true"&gt;</span>`,

	codeLabelErrors: 'Error handling <span class="wcag-pill">WCAG 3.3.1</span><span class="wcag-pill">3.3.3</span>',
	codeBlockErrors: `<span class="ln-bad">&lt;!-- ❌ visual cue only --&gt;
&lt;input class="has-error" type="email"&gt;
&lt;div style="color:red"&gt;Invalid email format&lt;/div&gt;</span>

<span class="ln-good">&lt;!-- ✅ aria-invalid + role="alert" --&gt;
&lt;input type="email"
  aria-invalid="true"
  aria-describedby="email-err"&gt;
&lt;p id="email-err" role="alert"&gt;
  Enter a valid email address. Example: hello@example.com
&lt;/p&gt;</span>`,

	codeLabelGroup: 'Grouping <span class="wcag-pill">WCAG 1.3.1</span>',
	codeBlockGroup: `<span class="ln-bad">&lt;!-- ❌ just a div --&gt;
&lt;div&gt;Payment method&lt;/div&gt;
&lt;input type="radio" name="pay"&gt;&lt;label&gt;Credit card&lt;/label&gt;
&lt;input type="radio" name="pay"&gt;&lt;label&gt;Bank transfer&lt;/label&gt;</span>

<span class="ln-good">&lt;!-- ✅ fieldset + legend (announced: "Payment method, Credit card, radio button 1 of 2") --&gt;
&lt;fieldset&gt;
  &lt;legend&gt;Payment method &lt;span class="sr-only"&gt;(required)&lt;/span&gt;&lt;/legend&gt;
  &lt;label&gt;&lt;input type="radio" name="pay" value="card"&gt; Credit card&lt;/label&gt;
  &lt;label&gt;&lt;input type="radio" name="pay" value="wire"&gt; Bank transfer&lt;/label&gt;
&lt;/fieldset&gt;</span>`,

	codeLabelFocus: 'Focus styles <span class="wcag-pill">WCAG 2.4.7</span><span class="wcag-pill">2.4.11</span>',
	codeBlockFocus: `<span class="ln-bad">/* ❌ never do this */
input:focus { outline: none; }</span>

<span class="ln-good">/* ✅ a clearly visible focus ring */
input:focus {
  outline: 2px solid #5558e3;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(85,88,227,.25);
}</span>`
};

/* 속성값 사전 — 평문만. 접근 가능한 이름이 걸린 자리이므로 두 언어 모두 정확해야 한다. */
const EN_ATTR = {
	tablistLabel: 'Demo sections',
	phName: 'Name',
	phEmail: 'Email',
	phPassword: 'Password',
	diffTableLabel: 'Accessibility differences between the two forms',
	srLogBadLabel: 'Screen reader announcement simulation (inaccessible form)',
	srLogGoodLabel: 'Screen reader announcement simulation (accessible form)'
};

/* JS가 만들어내는 문구 — data-msg 키로 다시 그린다. */
const MSG = {
	ko: {
		pressButton: '버튼을 눌러보세요',

		errName: '이름을 입력해주세요.',
		errEmailEmpty: '이메일을 입력해주세요.',
		errEmailFormat: '올바른 이메일 형식으로 입력해주세요. 예: hello@example.com',
		errEmailFormatShort: '올바른 이메일 형식이 아닙니다.',
		errPw: '비밀번호는 8자 이상이어야 합니다.',
		errPwShort: '8자 이상 입력해주세요.',
		errPay: '결제 수단을 선택해주세요.',
		errAgree: '이용약관에 동의해주세요.',

		sumName: '이름: 필수 항목입니다.',
		sumEmailEmpty: '이메일: 필수 항목입니다.',
		sumEmailFormat: '이메일: 올바른 형식으로 입력해주세요.',
		sumPw: '비밀번호: 8자 이상 입력해주세요.',
		sumPay: '결제 수단: 1개를 선택해주세요.',
		sumAgree: '이용약관: 동의가 필요합니다.',
		summaryTitle: (n) => n + '개의 입력 오류가 있습니다.',

		demoBadMsg: '이메일 형식이 올바르지 않습니다.',
		logBad1: '❌ 아무것도 발표하지 않음 (aria 없음)',
		logBad2: '시각적으로만: 빨간 테두리 + 텍스트 변경',
		logBad3: '포커스 이동 전까지 에러를 알 수 없음',
		logGood1: '🔊 "올바른 이메일 형식으로 입력해주세요. 예: hello@example.com"',
		logGood2: '↑ role="alert" → DOM 추가 즉시 발표',
		logGood3: '🔊 (포커스 시) "이메일, 필수, 오류: 올바른 형식으로 입력하세요"',
		logGood4: '↑ aria-invalid="true" → 포커스 시 오류 상태 재확인'
	},
	en: {
		pressButton: 'Press a button to start',

		errName: 'Enter your name.',
		errEmailEmpty: 'Enter your email address.',
		errEmailFormat: 'Enter a valid email address. Example: hello@example.com',
		errEmailFormatShort: 'That is not a valid email address.',
		errPw: 'Your password must be at least 8 characters.',
		errPwShort: 'Enter at least 8 characters.',
		errPay: 'Choose a payment method.',
		errAgree: 'You need to agree to the terms of service.',

		sumName: 'Name: this field is required.',
		sumEmailEmpty: 'Email: this field is required.',
		sumEmailFormat: 'Email: use a valid email format.',
		sumPw: 'Password: enter at least 8 characters.',
		sumPay: 'Payment method: choose one.',
		sumAgree: 'Terms of service: your agreement is required.',
		summaryTitle: (n) => n === 1
			? 'There is 1 error in your submission.'
			: 'There are ' + n + ' errors in your submission.',

		demoBadMsg: 'That email address is not in a valid format.',
		logBad1: '❌ Nothing is announced (no ARIA)',
		logBad2: 'Visual only: red border + changed text',
		logBad3: 'The error stays unknown until focus lands there',
		logGood1: '🔊 "Enter a valid email address. Example: hello@example.com"',
		logGood2: '↑ role="alert" → announced the moment it lands in the DOM',
		logGood3: '🔊 (on focus) "Email, required, invalid entry: use a valid format"',
		logGood4: '↑ aria-invalid="true" → the error state is repeated on focus'
	}
};

/* 한국어 원문은 HTML 자체가 사전이다 — 아무것도 바꾸기 전에 찍어둔다. */
const KO_SNAPSHOT = {};
document.querySelectorAll('[data-i18n]').forEach((el) => {
	KO_SNAPSHOT[el.dataset.i18n] = el.innerHTML;
});

const KO_ATTR_SNAPSHOT = {};
document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
	parseAttrMap(el).forEach(([attr, key]) => {
		KO_ATTR_SNAPSHOT[key] = el.getAttribute(attr);
	});
});

/* "placeholder:phEmail,aria-label:srLogBadLabel" → [['placeholder','phEmail'], ...] */
function parseAttrMap(el) {
	return el.dataset.i18nAttr
		.split(',')
		.map((pair) => pair.split(':').map((s) => s.trim()))
		.filter((pair) => pair.length === 2 && pair[0] && pair[1]);
}

let lang = 'ko';
const t = () => MSG[lang];

function applyLang(next) {
	lang = next === 'en' ? 'en' : 'ko';
	document.documentElement.lang = lang;

	const dict = lang === 'en' ? EN : KO_SNAPSHOT;
	document.querySelectorAll('[data-i18n]').forEach((el) => {
		const v = dict[el.dataset.i18n];
		if (typeof v === 'string') el.innerHTML = v;
	});

	const attrDict = lang === 'en' ? EN_ATTR : KO_ATTR_SNAPSHOT;
	document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
		parseAttrMap(el).forEach(([attr, key]) => {
			const v = attrDict[key];
			if (typeof v === 'string') el.setAttribute(attr, v);
		});
	});

	document.querySelectorAll('.lang-btn').forEach((b) => {
		b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
	});

	document.title = lang === 'en'
		? 'Form Accessibility Compared | codeslog'
		: '폼 접근성 비교 | codeslog';

	try { localStorage.setItem('demo-lang', lang); } catch (e) { /* 사생활 모드 등 */ }

	refreshDynamic();   // 떠 있는 에러·로그도 새 언어로 다시 그린다
}

/* data-msg가 붙은 것은 전부 현재 언어로 다시 쓴다 (textContent라 이스케이프 걱정이 없다). */
function refreshDynamic() {
	document.querySelectorAll('[data-msg]').forEach((el) => {
		const v = t()[el.dataset.msg];
		if (typeof v === 'string') el.textContent = v;
	});
	renderSummary();
}

document.querySelectorAll('.lang-btn').forEach((b) => {
	b.addEventListener('click', () => applyLang(b.dataset.lang));
});

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
/* 메시지를 문자열이 아니라 키로 넘긴다 — 언어가 바뀌어도 같은 자리에서 다시 그릴 수 있게. */
function setErr(inputId, errId, msgKey) {
	const input = document.getElementById(inputId);
	const err   = document.getElementById(errId);
	if (msgKey) {
		input.setAttribute('aria-invalid', 'true');
		err.dataset.msg  = msgKey;
		err.textContent  = t()[msgKey];
	} else {
		input.removeAttribute('aria-invalid');
		delete err.dataset.msg;
		err.textContent = '';
	}
}

function setGroupErr(errId, msgKey) {
	const err = document.getElementById(errId);
	if (msgKey) { err.dataset.msg = msgKey; err.textContent = t()[msgKey]; }
	else        { delete err.dataset.msg;   err.textContent = ''; }
}

/* 에러 요약에 들어간 항목 — 키로 들고 있다가 언어가 바뀌면 그대로 다시 그린다. */
let summaryErrs = [];

function renderSummary() {
	const summary = document.getElementById('good-summary');
	if (summary.hidden || summaryErrs.length === 0) return;
	document.getElementById('summary-ttl').textContent = t().summaryTitle(summaryErrs.length);
	const list = document.getElementById('summary-list');
	list.innerHTML = '';
	summaryErrs.forEach(({ key, href }) => {
		const li = document.createElement('li');
		const a  = document.createElement('a');
		a.href = href;
		a.textContent = t()[key];   // textContent라 &·< 같은 문자를 따로 이스케이프할 필요가 없다
		li.appendChild(a);
		list.appendChild(li);
	});
}

function submitGood(e) {
	e.preventDefault();
	const errs    = [];
	const name    = document.getElementById('good-name').value.trim();
	const email   = document.getElementById('good-email').value.trim();
	const pw      = document.getElementById('good-pw').value;
	const payment = document.querySelector('input[name="good-pay"]:checked');
	const agree   = document.getElementById('good-agree').checked;

	if (!name)  { setErr('good-name',  'good-name-err',  'errName');       errs.push({ key: 'sumName',       href: '#good-name' }); }
	else          setErr('good-name',  'good-name-err',  '');

	if (!email) { setErr('good-email', 'good-email-err', 'errEmailEmpty'); errs.push({ key: 'sumEmailEmpty', href: '#good-email' }); }
	else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		setErr('good-email', 'good-email-err', 'errEmailFormat');
		errs.push({ key: 'sumEmailFormat', href: '#good-email' });
	} else setErr('good-email', 'good-email-err', '');

	if (!pw || pw.length < 8) { setErr('good-pw', 'good-pw-err', 'errPw'); errs.push({ key: 'sumPw', href: '#good-pw' }); }
	else setErr('good-pw', 'good-pw-err', '');

	if (!payment) { setGroupErr('good-pay-err', 'errPay'); errs.push({ key: 'sumPay', href: '#good-card' }); }
	else setGroupErr('good-pay-err', '');

	if (!agree) { setErr('good-agree', 'good-agree-err', 'errAgree'); errs.push({ key: 'sumAgree', href: '#good-agree' }); }
	else setErr('good-agree', 'good-agree-err', '');

	const summary = document.getElementById('good-summary');
	const success = document.getElementById('good-success');
	summaryErrs = errs;
	if (errs.length > 0) {
		summary.hidden = false; success.classList.remove('show');
		renderSummary();
		summary.focus();
	} else {
		summary.hidden = true; success.classList.add('show');
		document.getElementById('good-form').reset();
		document.querySelectorAll('#good-form [aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
		success.focus();
	}
	return false;
}

document.getElementById('good-email').addEventListener('blur', function () {
	if (this.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value)) setErr('good-email', 'good-email-err', 'errEmailFormatShort');
	else if (this.value) setErr('good-email', 'good-email-err', '');
});
document.getElementById('good-pw').addEventListener('blur', function () {
	if (this.value && this.value.length < 8) setErr('good-pw', 'good-pw-err', 'errPwShort');
	else if (this.value) setErr('good-pw', 'good-pw-err', '');
});

/* ─ Error demo panel ─ */
function addEntry(logId, msgKey, isAnnounce) {
	const log = document.getElementById(logId);
	const first = log.querySelector('.sr-entry');
	if (first?.dataset.msg === 'pressButton') log.innerHTML = '';
	const el = document.createElement('div');
	el.className = 'sr-entry' + (isAnnounce ? ' announce' : '');
	el.dataset.msg = msgKey;
	el.textContent = t()[msgKey];
	log.appendChild(el);
	log.scrollTop = log.scrollHeight;
}

function resetLog(logId) {
	const log = document.getElementById(logId);
	log.innerHTML = '';
	const el = document.createElement('div');
	el.className = 'sr-entry';
	el.dataset.msg = 'pressButton';
	el.textContent = t().pressButton;
	log.appendChild(el);
}

function triggerBadError() {
	document.getElementById('err-bad-input').style.borderColor = 'var(--red)';
	const msg = document.getElementById('err-bad-msg');
	msg.dataset.msg = 'demoBadMsg';
	msg.textContent = t().demoBadMsg;
	addEntry('bad-sr-log', 'logBad1', false);
	addEntry('bad-sr-log', 'logBad2', false);
	addEntry('bad-sr-log', 'logBad3', false);
}
function resetBadError() {
	const input = document.getElementById('err-bad-input');
	input.style.borderColor = ''; input.classList.remove('has-error');
	const msg = document.getElementById('err-bad-msg');
	delete msg.dataset.msg; msg.textContent = '';
	resetLog('bad-sr-log');
}

function triggerGoodError() {
	document.getElementById('err-good-input').setAttribute('aria-invalid', 'true');
	const msg = document.getElementById('err-good-msg');
	msg.dataset.msg = 'errEmailFormat';
	msg.textContent = t().errEmailFormat;
	setTimeout(() => {
		addEntry('good-sr-log', 'logGood1', true);
		addEntry('good-sr-log', 'logGood2', false);
	}, 80);
	setTimeout(() => {
		addEntry('good-sr-log', 'logGood3', true);
		addEntry('good-sr-log', 'logGood4', false);
	}, 600);
}
function resetGoodError() {
	document.getElementById('err-good-input').removeAttribute('aria-invalid');
	const msg = document.getElementById('err-good-msg');
	delete msg.dataset.msg; msg.textContent = '';
	resetLog('good-sr-log');
}

/* ── 초기 언어 결정 (위의 const·함수가 모두 준비된 뒤에 실행한다) ──
   우선순위: ?lang= 딥링크 > 지난 선택 > 브라우저 언어 */
;(function initLang() {
	const urlLang = new URLSearchParams(location.search).get('lang');
	let saved = null;
	try { saved = localStorage.getItem('demo-lang'); } catch (e) { /* 사생활 모드 */ }
	const browserKo = (navigator.language || '').toLowerCase().startsWith('ko');
	const pick = (urlLang === 'en' || urlLang === 'ko') ? urlLang
		: (saved === 'en' || saved === 'ko') ? saved
		: (browserKo ? 'ko' : 'en');
	applyLang(pick);
})();
