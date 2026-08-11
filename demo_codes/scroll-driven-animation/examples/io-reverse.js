(function () {
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const progressFill = document.querySelector('.progress-bar__fill');
	const directionIndicator = document.querySelector('.direction-indicator');
	const directionText = document.querySelector('.direction-indicator__text');
	const heroSection = document.querySelector('[data-io-hero]');
	const cards = document.querySelectorAll('[data-io-card]');
	const stats = document.querySelectorAll('[data-io-stat]');

	let lastScrollY = window.scrollY;

	// Strings this script builds at runtime. i18n.js only swaps [data-i18n]
	// elements, so these have to be redrawn when the language changes.
	const MSG = {
		ko: { start: '먼저 아래로 스크롤하세요', up: '위로 스크롤 중', down: '아래로 스크롤 중' },
		en: { start: 'Scroll down first', up: 'Scrolling UP', down: 'Scrolling DOWN' }
	};
	const t = () => MSG[(window.demoLang && window.demoLang()) === 'en' ? 'en' : 'ko'];

	// Remember which state is showing so a language switch can redraw it.
	let directionKey = 'start';
	function drawDirection() {
		if (directionText) directionText.textContent = t()[directionKey];
	}
	drawDirection();
	document.addEventListener('demo:langchange', drawDirection);

	// Handle reduced motion
	if (prefersReducedMotion) {
		if (heroSection) heroSection.classList.add('in-view');
		cards.forEach(el => el.classList.add('in-view'));
		stats.forEach(el => el.classList.add('in-view'));
		return;
	}

	// Progress bar
	function updateProgress() {
		const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
		const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
		progressFill.style.transform = `scaleX(${progress})`;
	}

	// Scroll direction detection (for indicator only)
	function updateScrollDirection() {
		const currentScrollY = window.scrollY;
		const isScrollingUp = currentScrollY < lastScrollY;

		directionKey = isScrollingUp ? 'up' : 'down';
		directionIndicator.classList.toggle('scroll-up', isScrollingUp);
		directionIndicator.classList.toggle('scroll-down', !isScrollingUp);
		drawDirection();

		lastScrollY = currentScrollY;
	}

	// IntersectionObserver for hero section
	const heroObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach(entry => {
				entry.target.classList.toggle('in-view', entry.isIntersecting);
			});
		},
		{ threshold: 0.3 }
	);

	if (heroSection) heroObserver.observe(heroSection);

	// IntersectionObserver for cards and stats (bidirectional toggle)
	const elementsObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach(entry => {
				entry.target.classList.toggle('in-view', entry.isIntersecting);
			});
		},
		{ threshold: 0.3 }
	);

	cards.forEach(el => elementsObserver.observe(el));
	stats.forEach(el => elementsObserver.observe(el));

	// Scroll event
	window.addEventListener('scroll', () => {
		updateProgress();
		updateScrollDirection();
	}, { passive: true });

	updateProgress();
})();
