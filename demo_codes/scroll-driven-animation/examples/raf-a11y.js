(function () {
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const progressFill = document.querySelector('.progress-bar__fill');
	const heroCover = document.querySelector('.hero__cover');
	const heroSection = document.querySelector('[data-raf-hero]');
	const cards = document.querySelectorAll('[data-raf-card]');
	const stats = document.querySelectorAll('[data-raf-stat]');

	let ticking = false;
	let heroLocked = false;
	const lockedCards = new Set();
	const lockedStats = new Set();

	const clamp = (val) => Math.min(1, Math.max(0, val));
	const easeOut = (t) => 1 - Math.pow(1 - t, 3);

	// The counter's number and unit come from data-value / data-suffix on the card.
	// They used to be inferred from the label text ("CPU", "Accessible", …), which
	// stops matching the moment the page is switched to another language.
	const render = (stat, n) => {
		stat.querySelector('.stat-card__value').textContent = n + (stat.dataset.suffix || '');
	};

	// If reduced motion, show everything immediately
	if (prefersReducedMotion) {
		heroCover.style.transform = 'translateY(-100%)';
		cards.forEach(card => {
			card.style.opacity = '1';
			card.style.transform = 'none';
			card.classList.add('is-locked');
		});
		stats.forEach(stat => {
			stat.style.opacity = '1';
			stat.style.transform = 'none';
			stat.classList.add('is-locked');
			render(stat, stat.dataset.value);
		});
		return;
	}

	function update() {
		ticking = false;
		const vh = window.innerHeight;
		const scrollY = window.scrollY;
		const docHeight = document.documentElement.scrollHeight - vh;

		// Progress bar
		const scrollProgress = docHeight > 0 ? scrollY / docHeight : 0;
		progressFill.style.transform = `scaleX(${scrollProgress})`;

		// Hero cover - locks when fully revealed
		if (!heroLocked && heroSection) {
			const heroRect = heroSection.getBoundingClientRect();
			const heroProgress = clamp(-heroRect.top / (heroRect.height - vh));
			const coverY = easeOut(heroProgress) * -100;
			heroCover.style.transform = `translateY(${coverY}%)`;

			if (heroProgress >= 0.95) {
				heroLocked = true;
				heroCover.style.transform = 'translateY(-100%)';
			}
		}

		// Feature cards - lock when fully visible
		cards.forEach((card, index) => {
			if (lockedCards.has(index)) return;

			const rect = card.getBoundingClientRect();
			const start = vh * 0.85;
			const end = vh * 0.4;
			const progress = clamp((start - rect.top) / (start - end));
			const eased = easeOut(progress);

			card.style.opacity = eased;
			card.style.transform = `translateY(${(1 - eased) * 60}px)`;

			if (progress >= 0.95) {
				card.style.opacity = '1';
				card.style.transform = 'none';
				card.classList.add('is-locked');
				lockedCards.add(index);
			}
		});

		// Stat cards - lock when fully visible
		stats.forEach((stat, index) => {
			if (lockedStats.has(index)) return;

			const rect = stat.getBoundingClientRect();
			const start = vh * 0.8;
			const end = vh * 0.35;
			const progress = clamp((start - rect.top) / (start - end));
			const eased = easeOut(progress);

			stat.style.opacity = eased;
			stat.style.transform = `scale(${0.9 + eased * 0.1})`;

			// Counter
			const target = parseFloat(stat.dataset.value);
			render(stat, Math.round(target * eased));

			if (progress >= 0.95) {
				stat.style.opacity = '1';
				stat.style.transform = 'none';
				stat.classList.add('is-locked');
				lockedStats.add(index);
				render(stat, target);
			}
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
