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

	// Element progress tracking (0 = hidden, 1 = visible)
	const elementProgress = new Map();
	cards.forEach(card => elementProgress.set(card, 0));
	stats.forEach(stat => elementProgress.set(stat, 0));
	let heroProgress = 0;

	const clamp = (val) => Math.min(1, Math.max(0, val));
	const easeOut = (t) => 1 - Math.pow(1 - t, 3);

	// Handle reduced motion
	if (prefersReducedMotion) {
		heroCover.style.transform = 'translateY(0)';
		cards.forEach(card => {
			card.style.opacity = '1';
			card.style.transform = 'none';
		});
		stats.forEach(stat => {
			stat.style.opacity = '1';
			stat.style.transform = 'none';
			const value = stat.dataset.value;
			const label = stat.querySelector('.stat-card__label').textContent;
			const valueEl = stat.querySelector('.stat-card__value');
			if (label.includes('FPS')) valueEl.textContent = value;
			else if (label.includes('%')) valueEl.textContent = value + '%';
			else if (label.includes('ms')) valueEl.textContent = value + 'ms';
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
		if (isScrollingUp) {
			directionIndicator.classList.add('scroll-up');
			directionIndicator.classList.remove('scroll-down');
			directionText.textContent = 'Scrolling UP';
		} else {
			directionIndicator.classList.add('scroll-down');
			directionIndicator.classList.remove('scroll-up');
			directionText.textContent = 'Scrolling DOWN';
		}

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
			const label = stat.querySelector('.stat-card__label').textContent;
			const valueEl = stat.querySelector('.stat-card__value');

			if (label.includes('FPS')) valueEl.textContent = current;
			else if (label.includes('%')) valueEl.textContent = current + '%';
			else if (label.includes('ms')) valueEl.textContent = current + 'ms';
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
