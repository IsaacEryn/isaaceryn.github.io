const focusLabel   = document.getElementById('focus-label');
const focusLoc     = document.getElementById('focus-loc');
const badOverlay   = document.getElementById('bad-overlay');
const goodDialog   = document.getElementById('good-dialog');

/* ─ 포커스 추적 ─ */
document.addEventListener('focusin', e => {
	const el = e.target;
	const label = el.getAttribute('aria-label')
		|| el.textContent.trim().replace(/\s+/g, ' ').slice(0, 28)
		|| el.placeholder
		|| el.tagName;

	focusLabel.textContent = `"${label}"`;

	const inBadModal  = badOverlay.contains(el) && badOverlay.classList.contains('open');
	const inGoodModal = goodDialog.contains(el) && goodDialog.open;
	const inBadBg     = !inBadModal && badOverlay.classList.contains('open')
		&& (document.getElementById('bad-bg-btns').contains(el) || el.id === 'open-bad-modal');

	if (inBadModal) {
		focusLoc.textContent = '위치: 나쁜 모달 내부';
		focusLoc.className   = 'tracker-loc modal-loc';
	} else if (inGoodModal) {
		focusLoc.textContent = '위치: 좋은 모달 내부';
		focusLoc.className   = 'tracker-loc modal-loc';
	} else if (inBadBg) {
		focusLoc.textContent = '위치: 배경 (모달 열린 상태에서 배경 접근됨)';
		focusLoc.className   = 'tracker-loc escape-loc';
	} else {
		focusLoc.textContent = '위치: 배경';
		focusLoc.className   = 'tracker-loc';
	}
});

/* ─ 나쁜 모달 ─ */
document.getElementById('open-bad-modal').addEventListener('click', () => {
	badOverlay.classList.add('open');
	badOverlay.removeAttribute('aria-hidden');
});

function closeBadModal() {
	badOverlay.classList.remove('open');
	badOverlay.setAttribute('aria-hidden', 'true');
}

document.getElementById('bad-cancel').addEventListener('click', closeBadModal);
document.getElementById('bad-delete').addEventListener('click', closeBadModal);

/* ─ 좋은 모달 (native dialog) ─ */
document.getElementById('open-good-modal').addEventListener('click', function () {
	goodDialog._opener = this;
	goodDialog.showModal();
});

function closeGoodModal() {
	goodDialog.close();
	goodDialog._opener?.focus();
}

document.getElementById('good-cancel').addEventListener('click', closeGoodModal);
document.getElementById('good-delete').addEventListener('click', closeGoodModal);

goodDialog.addEventListener('click', e => {
	const r = goodDialog.getBoundingClientRect();
	if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
		closeGoodModal();
	}
});

/* ─ 배경 버튼 클릭 피드백 ─ */
['bad-btn-a', 'bad-btn-b', 'good-btn-a', 'good-btn-b'].forEach(id => {
	document.getElementById(id)?.addEventListener('click', function () {
		this.classList.add('clicked');
		setTimeout(() => this.classList.remove('clicked'), 800);
	});
});
