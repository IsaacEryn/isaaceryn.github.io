const focusLabel = document.getElementById('focus-label');
const focusLoc   = document.getElementById('focus-loc');
const badOverlay = document.getElementById('bad-overlay');
const goodDialog = document.getElementById('good-dialog');
const floatTracker = document.getElementById('float-tracker');
const floatLabel   = document.getElementById('float-label');
const floatLoc     = document.getElementById('float-loc');

/* ─ 언어 ─ */
const MSG = {
	ko: {
		skip: '본문으로 건너뛰기',
		back: '← 데모 코드 목록보기',
		title: '모달 접근성 비교',
		desc: '아무 처리 없이 div로 만든 모달과 dialog 요소의 showModal()로 만든 모달을 나란히 두고, 포커스 이동·ESC·포커스 복원을 비교합니다. 모달을 열고 Tab을 눌러 보세요.',
		postlink: '관련 포스트 읽기 →',
		badBadge: '나쁜 모달', badName: 'div, 아무 처리 없음',
		goodBadge: '좋은 모달', goodName: 'dialog + showModal()',
		btnA: '버튼 A', btnB: '버튼 B',
		openBad: '나쁜 모달 열기', openGood: '좋은 모달 열기',
		bad1: '배경을 막지 않음: Tab이 배경으로 나간다',
		bad2: 'ESC로 닫히지 않는다',
		bad3: 'role="dialog"가 없다',
		bad4: '닫은 뒤 포커스가 사라진다',
		good1: '배경이 inert가 되어 Tab이 배경으로 새지 않는다(브라우저 UI로는 나간다)',
		good2: 'ESC로 닫힌다(브라우저 기본 동작)',
		good3: '대화 상자 역할이 자동으로 붙는다',
		good4: '닫히면 연 버튼으로 포커스가 돌아온다',
		trackerTitle: '포커스 위치 (실시간)',
		modalTitle: '항목을 삭제하시겠습니까?', modalBody: '이 작업은 되돌릴 수 없습니다.',
		cancel: '취소', delete: '삭제',
		locBad: '위치: 나쁜 모달 안', locGood: '위치: 좋은 모달 안',
		locLeak: '위치: 배경 (모달이 열려 있는데 배경에 닿음)', locBg: '위치: 배경',
		lost: 'body (포커스가 사라짐)', locLost: '위치: 어디에도 없음',
		newWin: '새 창에서 열림', docTitle: '모달 접근성 비교 | codeslog',
	},
	en: {
		skip: 'Skip to main content',
		back: '← Back to demo list',
		title: 'Modal Accessibility Compared',
		desc: 'A modal built from a plain div with no handling sits next to one built with the dialog element and showModal(). Compare focus movement, ESC, and focus return. Open a modal and press Tab.',
		postlink: 'Read the related post →',
		badBadge: 'Bad modal', badName: 'div, no handling',
		goodBadge: 'Good modal', goodName: 'dialog + showModal()',
		btnA: 'Button A', btnB: 'Button B',
		openBad: 'Open bad modal', openGood: 'Open good modal',
		bad1: 'Background not blocked: Tab escapes to it',
		bad2: 'ESC does not close it',
		bad3: 'No role="dialog"',
		bad4: 'Focus is lost after closing',
		good1: 'The background becomes inert, so Tab never reaches it (it can still reach the browser UI)',
		good2: 'ESC closes it (built-in browser behavior)',
		good3: 'Gets the dialog role automatically',
		good4: 'Focus returns to the opening button on close',
		trackerTitle: 'Focus location (live)',
		modalTitle: 'Delete this item?', modalBody: 'This cannot be undone.',
		cancel: 'Cancel', delete: 'Delete',
		locBad: 'Location: inside the bad modal', locGood: 'Location: inside the good modal',
		locLeak: 'Location: background (reached while a modal is open)', locBg: 'Location: background',
		lost: 'body (focus is lost)', locLost: 'Location: nowhere',
		newWin: 'Opens in new window', docTitle: 'Modal Accessibility Compared | codeslog',
	},
};

let lang = 'ko';
const t = (k) => MSG[lang][k];

function applyLang(next) {
	lang = next === 'en' ? 'en' : 'ko';
	document.documentElement.lang = lang;
	document.querySelectorAll('[data-i18n]').forEach((el) => {
		const v = t(el.dataset.i18n);
		if (typeof v === 'string') el.textContent = v;
	});
	const postLink = document.getElementById('post-link');
	postLink.href = lang === 'en'
		? 'https://www.codeslog.com/en/posts/modal-dialog-implementation/'
		: 'https://www.codeslog.com/posts/modal-dialog-implementation/';
	postLink.title = t('newWin');
	document.getElementById('footer-link').title = t('newWin');
	document.querySelectorAll('.lang-btn').forEach((b) => {
		b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
	});
	document.title = t('docTitle');
	try { localStorage.setItem('demo-lang', lang); } catch (e) { /* 사생활 모드 등 */ }
	if (document.activeElement && document.activeElement !== document.body) showFocus(document.activeElement);
}

document.querySelectorAll('.lang-btn').forEach((b) => {
	b.addEventListener('click', () => applyLang(b.dataset.lang));
});

/* ─ 포커스 추적 ─ */
function setTracker(label, loc, cls) {
	focusLabel.textContent = floatLabel.textContent = label;
	focusLoc.textContent   = floatLoc.textContent   = loc;
	focusLoc.className     = floatLoc.className     = cls;
}

/* 모달이 열려 있으면 배경 막 위에 같은 표시를 띄운다. dialog보다 나중에 열어야 그 위에 그려진다 */
function syncFloatTracker() {
	const anyOpen = goodDialog.open || badOverlay.classList.contains('open');
	try {
		if (floatTracker.matches(':popover-open')) floatTracker.hidePopover();
		if (anyOpen) floatTracker.showPopover();
	} catch (e) { /* popover를 지원하지 않는 브라우저에서는 띄우지 않는다 */ }
}

function showFocus(el) {
	const label = el.getAttribute('aria-label')
		|| el.textContent.trim().replace(/\s+/g, ' ').slice(0, 28)
		|| el.tagName;
	const text = `"${label}"`;

	const badOpen     = badOverlay.classList.contains('open');
	const inBadModal  = badOpen && badOverlay.contains(el);
	const inGoodModal = goodDialog.open && goodDialog.contains(el);

	if (inBadModal) {
		setTracker(text, t('locBad'), 'tracker-loc modal-loc');
	} else if (inGoodModal) {
		setTracker(text, t('locGood'), 'tracker-loc modal-loc');
	} else if (badOpen) {
		setTracker(text, t('locLeak'), 'tracker-loc escape-loc');
	} else {
		setTracker(text, t('locBg'), 'tracker-loc');
	}
}

document.addEventListener('focusin', (e) => showFocus(e.target));

/* 닫힌 모달 안의 버튼이 사라지면 포커스가 body로 떨어진다. 그때도 화면을 갱신한다 */
document.addEventListener('focusout', () => {
	setTimeout(() => {
		if (document.activeElement === document.body && document.hasFocus()) {
			setTracker(t('lost'), t('locLost'), 'tracker-loc escape-loc');
		}
	}, 0);
});

/* ─ 나쁜 모달: 일부러 아무 처리도 하지 않는다 ─ */
document.getElementById('open-bad-modal').addEventListener('click', () => {
	badOverlay.classList.add('open');
	badOverlay.removeAttribute('aria-hidden');
	syncFloatTracker();
});

function closeBadModal() {
	badOverlay.classList.remove('open');
	badOverlay.setAttribute('aria-hidden', 'true');
	syncFloatTracker();
}

document.getElementById('bad-cancel').addEventListener('click', closeBadModal);
document.getElementById('bad-delete').addEventListener('click', closeBadModal);

/* ─ 좋은 모달 (dialog) ─ */
document.getElementById('open-good-modal').addEventListener('click', function () {
	// 나쁜 모달은 배경을 막지 않아서 열린 채로 여기까지 올 수 있다. 겹치지 않게 먼저 닫는다
	if (badOverlay.classList.contains('open')) closeBadModal();
	goodDialog._opener = this;
	goodDialog.showModal();
	syncFloatTracker();
});

/* ESC로 닫혀도 close 이벤트는 온다 */
goodDialog.addEventListener('close', syncFloatTracker);

function closeGoodModal() {
	goodDialog.close();
	goodDialog._opener?.focus();
}

document.getElementById('good-cancel').addEventListener('click', closeGoodModal);
document.getElementById('good-delete').addEventListener('click', closeGoodModal);

/* 바깥(backdrop) 클릭으로 닫기. 키보드로 버튼을 누른 click은 좌표가 0이라 대상이 dialog 자신일 때만 본다 */
goodDialog.addEventListener('click', (e) => {
	if (e.target !== goodDialog) return;
	const r = goodDialog.getBoundingClientRect();
	if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
		closeGoodModal();
	}
});

/* ─ 배경 버튼 클릭 피드백 ─ */
['bad-btn-a', 'bad-btn-b', 'good-btn-a', 'good-btn-b'].forEach((id) => {
	document.getElementById(id)?.addEventListener('click', function () {
		this.classList.add('clicked');
		setTimeout(() => this.classList.remove('clicked'), 800);
	});
});

/* ─ 초기 언어: ?lang= 딥링크 > 지난 선택 > 브라우저 언어 ─ */
(function initLang() {
	const urlLang = new URLSearchParams(location.search).get('lang');
	let saved = null;
	try { saved = localStorage.getItem('demo-lang'); } catch (e) { /* 사생활 모드 */ }
	const browserKo = (navigator.language || '').toLowerCase().startsWith('ko');
	const pick = (urlLang === 'en' || urlLang === 'ko') ? urlLang
		: (saved === 'en' || saved === 'ko') ? saved
		: (browserKo ? 'ko' : 'en');
	applyLang(pick);
})();
