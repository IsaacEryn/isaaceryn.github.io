(function () {
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const supportsScrollTimeline = CSS.supports('animation-timeline', 'scroll()');

	const badge = document.getElementById('supportBadge');
	const badgeText = document.getElementById('supportText');
	const progressFill = document.querySelector('.progress-bar__fill');
	const heroCover = document.querySelector('.hero__cover');
	const heroSection = document.querySelector('[data-fallback-hero]');
	const cards = document.querySelectorAll('[data-fallback-card]');
	const stats = document.querySelectorAll('[data-fallback-stat]');

	// Strings this script builds at runtime. i18n.js only swaps [data-i18n]
	// elements, so anything written here has to be redrawn on a language change.
	const MSG = {
		ko: { native: '네이티브 CSS 사용 중', fallback: 'JS 폴백 사용 중' },
		en: { native: 'Native CSS Active', fallback: 'JS Fallback Active' }
	};

	// Update support badge
	badge.classList.add(supportsScrollTimeline ? 'support-badge--native' : 'support-badge--fallback');

	function drawBadge() {
		const lang = (window.demoLang && window.demoLang()) === 'en' ? 'en' : 'ko';
		badgeText.textContent = MSG[lang][supportsScrollTimeline ? 'native' : 'fallback'];
	}
	drawBadge();
	document.addEventListener('demo:langchange', drawBadge);

	// Handle reduced motion
	if (prefersReducedMotion) {
		document.body.classList.add('no-scroll-timeline');
		heroCover.style.transform = 'translateY(-100%)';
		cards.forEach(card => card.classList.add('is-visible'));
		stats.forEach(stat => stat.classList.add('is-visible'));
		return;
	}

	// If native CSS is supported, just add progress bar fallback for older browsers
	if (supportsScrollTimeline) {
		// CSS handles everything via demo.css rules
		// Progress bar is also handled by CSS
		return;
	}

	// === JavaScript Fallback for unsupported browsers ===
	document.body.classList.add('js-fallback');

	// Progress bar - scroll listener
	function updateProgress() {
		const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
		const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
		progressFill.style.transform = `scaleX(${progress})`;
	}
	window.addEventListener('scroll', updateProgress, { passive: true });
	updateProgress();

	// Hero cover - IntersectionObserver
	const heroObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					heroCover.style.transform = 'translateY(-100%)';
				} else {
					heroCover.style.transform = 'translateY(0)';
				}
			});
		},
		// 0.25, not 0.4: .hero is 250vh, so intersectionRatio can never exceed
		// 100/250 = 0.4. A threshold sitting exactly on that ceiling is a coin flip.
		{ threshold: 0.25 }
	);
	if (heroSection) heroObserver.observe(heroSection);

	// Cards & Stats - IntersectionObserver
	const elementsObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach(entry => {
				entry.target.classList.toggle('is-visible', entry.isIntersecting);
			});
		},
		{ threshold: 0.3 }
	);

	cards.forEach(card => elementsObserver.observe(card));
	stats.forEach(stat => elementsObserver.observe(stat));
})();
