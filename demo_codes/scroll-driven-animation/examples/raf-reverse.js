(function () {
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const progressFill = document.querySelector('.progress-bar__fill');
	const directionIndicator = document.getElementById('directionIndicator');
	const directionText = directionIndicator.querySelector('.direction-indicator__text');
	const heroCover = document.querySelector('.hero__cover');
	const heroSection = document.querySelector('[data-raf-hero]');
	const cards = document.querySelectorAll('[data-raf-card]');
	const stats = document.querySelectorAll('[data-raf-stat]');

	let lastScrollY = window.scrollY;
	let ticking = false;

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

	// Element progress tracking (0 = hidden, 1 = visible)
	const elementProgress = new Map();
	cards.forEach(card => elementProgress.set(card, 0));
	stats.forEach(stat => elementProgress.set(stat, 0));
	let heroProgress = 0;

	const clamp = (val) => Math.min(1, Math.max(0, val));
	const easeOut = (t) => 1 - Math.pow(1 - t, 3);

	// The unit lives on the value element ("0", "0%", "0ms"), not on the label
	// ("Target FPS", "Browser Support", "Frame Budget"). The old code sniffed the
	// *label* for "FPS"/"%"/"ms", so only the FPS counter ever moved. Read the
	// suffix off the initial value once and reuse it.
	function suffixOf(stat) {
		const el = stat.querySelector('.stat-card__value');
		if (el.dataset.suffix === undefined) {
			el.dataset.suffix = el.textContent.trim().replace(/^[\d.,\s]*/, '');
		}
		return el.dataset.suffix;
	}

	// Handle reduced motion
	if (prefersReducedMotion) {
		// -100% = cover lifted out of the way. translateY(0) would leave the cover
		// sitting on top of the content it is supposed to reveal.
		heroCover.style.transform = 'translateY(-100%)';
		cards.forEach(card => {
			card.style.opacity = '1';
			card.style.transform = 'none';
		});
		stats.forEach(stat => {
			stat.style.opacity = '1';
			stat.style.transform = 'none';
			stat.querySelector('.stat-card__value').textContent = stat.dataset.value + suffixOf(stat);
		});
		return;
	}

	// Initialize hidden state
	heroCover.style.transform = 'translateY(-100%)';
	cards.forEach(card => {
		card.style.opacity = '0';
		card.style.transform = 'translateY(40px)';
	});
	stats.forEach(stat => {
		stat.style.opacity = '0';
		stat.style.transform = 'scale(0.9)';
	});

	function update() {
		ticking = false;
		const vh = window.innerHeight;
		const currentScrollY = window.scrollY;
		const docHeight = document.documentElement.scrollHeight - vh;

		// Progress bar (always updates)
		const scrollProgress = docHeight > 0 ? currentScrollY / docHeight : 0;
		progressFill.style.transform = `scaleX(${scrollProgress})`;

		// Detect direction (for indicator only)
		const isScrollingUp = currentScrollY < lastScrollY;

		// Update direction indicator
		directionKey = isScrollingUp ? 'up' : 'down';
		directionIndicator.classList.toggle('scroll-up', isScrollingUp);
		directionIndicator.classList.toggle('scroll-down', !isScrollingUp);
		drawDirection();

		// Hero cover - bidirectional: show when in view, hide when out
		if (heroSection) {
			const heroRect = heroSection.getBoundingClientRect();
			const inView = heroRect.top < vh * 0.7 && heroRect.bottom > vh * 0.3;

			if (inView) {
				heroProgress = clamp(heroProgress + 0.08);
			} else {
				heroProgress = clamp(heroProgress - 0.08);
			}

			const coverY = (1 - easeOut(heroProgress)) * -100;
			heroCover.style.transform = `translateY(${coverY}%)`;
		}

		// Feature cards - bidirectional: animate in when visible, out when not
		cards.forEach((card) => {
			const rect = card.getBoundingClientRect();
			const inView = rect.top < vh * 0.85 && rect.bottom > vh * 0.15;
			let progress = elementProgress.get(card);

			if (inView) {
				progress = clamp(progress + 0.06);
			} else {
				progress = clamp(progress - 0.06);
			}

			elementProgress.set(card, progress);
			const eased = easeOut(progress);

			card.style.opacity = eased;
			card.style.transform = `translateY(${(1 - eased) * 40}px)`;
		});

		// Stat cards - bidirectional: animate in when visible, out when not
		stats.forEach((stat) => {
			const rect = stat.getBoundingClientRect();
			const inView = rect.top < vh * 0.85 && rect.bottom > vh * 0.15;
			let progress = elementProgress.get(stat);

			if (inView) {
				progress = clamp(progress + 0.06);
			} else {
				progress = clamp(progress - 0.06);
			}

			elementProgress.set(stat, progress);
			const eased = easeOut(progress);

			stat.style.opacity = eased;
			stat.style.transform = `scale(${0.9 + eased * 0.1})`;

			// Counter animation - interpolates based on progress
			const target = parseFloat(stat.dataset.value);
			const current = Math.round(target * eased);

			stat.querySelector('.stat-card__value').textContent = current + suffixOf(stat);
		});

		lastScrollY = currentScrollY;

		// Continue animation if elements are transitioning
		const stillAnimating = [...elementProgress.values()].some(p => p > 0 && p < 1) ||
			(heroProgress > 0 && heroProgress < 1);
		if (stillAnimating) {
			requestAnimationFrame(update);
		}
	}

	function onScroll() {
		if (!ticking) {
			ticking = true;
			requestAnimationFrame(update);
		}
	}

	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', onScroll, { passive: true });
	update();
})();
