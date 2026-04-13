(function () {
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const progressFill = document.querySelector('.progress-bar__fill');
	const heroCover = document.querySelector('.hero__cover');
	const heroSection = document.querySelector('[data-raf-hero]');
	const cards = document.querySelectorAll('[data-raf-card]');
	const stats = document.querySelectorAll('[data-raf-stat]');

	// Handle reduced motion - set initial state and only update progress bar
	if (prefersReducedMotion) {
		heroCover.style.transform = 'translateY(-100%)';
		cards.forEach(card => {
			card.style.opacity = '1';
			card.style.transform = 'none';
		});
		stats.forEach(stat => {
			stat.style.opacity = '1';
			stat.style.transform = 'none';
			const value = stat.dataset.value;
			const label = stat.querySelector('.stat-card__label').textContent;
			if (label.includes('fps')) stat.querySelector('.stat-card__value').textContent = value;
			else if (label.includes('%')) stat.querySelector('.stat-card__value').textContent = value + '%';
			else if (label.includes('ms')) stat.querySelector('.stat-card__value').textContent = value + 'ms';
		});
		// Only track progress bar for reduced motion users
		window.addEventListener('scroll', () => {
			const docHeight = document.documentElement.scrollHeight - window.innerHeight;
			const progress = docHeight > 0 ? window.scrollY / docHeight : 0;
			progressFill.style.transform = `scaleX(${progress})`;
		}, { passive: true });
		return;
	}

	let ticking = false;

	// Clamp value between 0 and 1
	const clamp = (val) => Math.min(1, Math.max(0, val));

	// Ease out cubic
	const easeOut = (t) => 1 - Math.pow(1 - t, 3);

	function update() {
		ticking = false;
		const vh = window.innerHeight;
		const scrollY = window.scrollY;
		const docHeight = document.documentElement.scrollHeight - vh;

		// Progress bar
		const scrollProgress = docHeight > 0 ? scrollY / docHeight : 0;
		progressFill.style.transform = `scaleX(${scrollProgress})`;

		// Hero cover
		if (heroSection) {
			const heroRect = heroSection.getBoundingClientRect();
			const heroProgress = clamp(-heroRect.top / (heroRect.height - vh));
			const coverY = easeOut(heroProgress) * -100;
			heroCover.style.transform = `translateY(${coverY}%)`;
		}

		// Feature cards
		cards.forEach((card) => {
			const rect = card.getBoundingClientRect();
			const start = vh * 0.85;
			const end = vh * 0.4;
			const progress = clamp((start - rect.top) / (start - end));
			const eased = easeOut(progress);

			card.style.opacity = eased;
			card.style.transform = `translateY(${(1 - eased) * 60}px)`;
		});

		// Stat cards with counter
		stats.forEach((stat) => {
			const rect = stat.getBoundingClientRect();
			const start = vh * 0.8;
			const end = vh * 0.35;
			const progress = clamp((start - rect.top) / (start - end));
			const eased = easeOut(progress);

			stat.style.opacity = eased;
			stat.style.transform = `scale(${0.9 + eased * 0.1})`;

			// Counter animation
			const target = parseFloat(stat.dataset.value);
			const current = Math.round(target * eased);
			const label = stat.querySelector('.stat-card__label').textContent;
			const valueEl = stat.querySelector('.stat-card__value');

			if (label.includes('fps')) valueEl.textContent = current;
			else if (label.includes('%')) valueEl.textContent = current + '%';
			else if (label.includes('ms')) valueEl.textContent = current + 'ms';
		});
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
