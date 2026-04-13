(function () {
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const progressFill = document.querySelector('.progress-bar__fill');
	const directionIndicator = document.querySelector('.direction-indicator');
	const directionText = document.querySelector('.direction-indicator__text');
	const heroSection = document.querySelector('[data-io-hero]');
	const cards = document.querySelectorAll('[data-io-card]');
	const stats = document.querySelectorAll('[data-io-stat]');

	let lastScrollY = window.scrollY;

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

		if (isScrollingUp) {
			directionIndicator.classList.add('scroll-up');
			directionIndicator.classList.remove('scroll-down');
			directionText.textContent = 'Scrolling UP';
		} else {
			directionIndicator.classList.add('scroll-down');
			directionIndicator.classList.remove('scroll-up');
			directionText.textContent = 'Scrolling DOWN';
		}

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
