const pages = {
	home: {
		title: '홈',
		html: `<h1 tabindex="-1">홈</h1>
			<p>환영합니다! 이것은 SPA 포커스 관리 데모입니다.</p>
			<p><a href="#">자세히 보기</a> &nbsp; <a href="#">최신 소식</a></p>`,
	},
	about: {
		title: '소개',
		html: `<h1 tabindex="-1">소개</h1>
			<p>우리 팀을 소개합니다. 다양한 배경을 가진 개발자들이 함께하고 있습니다.</p>
			<p><a href="#">팀원 보기</a></p>`,
	},
	product: {
		title: '제품',
		html: `<h1 tabindex="-1">제품</h1>
			<p>최고의 제품을 제공합니다.</p>
			<p>
				<button type="button">제품 A 보기</button>
				<button type="button">제품 B 보기</button>
			</p>`,
	},
	contact: {
		title: '연락처',
		html: `<h1 tabindex="-1">연락처</h1>
			<p>문의사항이 있으신가요? 이메일로 연락해주세요.</p>
			<p>
				<label>이메일: <input type="email" placeholder="your@email.com"></label>
				<button type="button">보내기</button>
			</p>`,
	},
};

let withFocus = false;

const content    = document.getElementById('spa-content');
const srLog      = document.getElementById('sr-log');
const focusLabel = document.getElementById('focus-label');
const focusLoc   = document.getElementById('focus-loc');
const announcer  = document.getElementById('aria-announcer');
const statusBar  = document.getElementById('status-bar');

navigate('home', false, true);

document.querySelectorAll('.spa-nav a').forEach(a => {
	a.addEventListener('click', e => {
		e.preventDefault();
		navigate(a.dataset.page, withFocus);
	});
});

document.querySelectorAll('input[name="focus-mode"]').forEach(r => {
	r.addEventListener('change', () => {
		withFocus = r.value === 'on';
		statusBar.className   = 'status-bar ' + (withFocus ? 'on' : 'off');
		statusBar.textContent = withFocus
			? '포커스 관리 있음 — 내비게이션 후 포커스가 h1으로 이동합니다'
			: '포커스 관리 없음 — 내비게이션 후 포커스가 링크에 그대로 남습니다';
		srLog.innerHTML = '';
		logSR('(모드 전환됨 — 내비게이션 링크를 클릭해보세요)');
	});
});

function navigate(pageKey, withFocusMgmt, init = false) {
	const page = pages[pageKey];
	content.innerHTML = page.html;

	document.querySelectorAll('.spa-nav a').forEach(a => {
		a.classList.toggle('active', a.dataset.page === pageKey);
	});

	if (init) { logSR(`"홈, 제목 수준 1"`); return; }

	if (withFocusMgmt) {
		const h1 = content.querySelector('h1');
		if (h1) h1.focus();
		announcer.textContent = '';
		requestAnimationFrame(() => {
			announcer.textContent = `${page.title} 페이지로 이동했습니다`;
		});
		logSR(`"${page.title} 페이지로 이동했습니다"`, true);
		logSR(`"${page.title}, 제목 수준 1"`);
	} else {
		logSR('(페이지 변경됨. 알림 없음. 포커스 이동 없음)');
	}
}

document.addEventListener('focusin', e => {
	const el = e.target;
	const label = el.getAttribute('aria-label')
		|| el.textContent.trim().replace(/\s+/g, ' ').slice(0, 28)
		|| el.placeholder
		|| el.tagName;
	focusLabel.textContent = `"${label}"`;
	const inNav     = el.closest('.spa-nav');
	const inContent = el.closest('#spa-content');
	focusLoc.textContent = inNav
		? '위치: 내비게이션'
		: inContent ? '위치: 페이지 콘텐츠' : '위치: 기타';
});

function logSR(msg, isAnnounce = false) {
	const el = document.createElement('div');
	el.className   = 'sr-entry' + (isAnnounce ? ' announce' : '');
	el.textContent = msg;
	srLog.insertAdjacentElement('afterbegin', el);
	while (srLog.children.length > 14) srLog.removeChild(srLog.lastChild);
}
