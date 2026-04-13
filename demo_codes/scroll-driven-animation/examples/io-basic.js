(function () {
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// Progress bar
	const progressFill = document.querySelector('.progress-bar__fill');
	function updateProgress() {
		const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
		const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
		progressFill.style.transform = `scaleX(${progress})`;
	}
	window.addEventListener('scroll', updateProgress, { passive: true });
	updateProgress();

	// Show all immediately if reduced motion
	if (prefersReducedMotion) {
		document.querySelector('[data-io-hero]').style.transform = 'translateY(-100%)';
		document.querySelectorAll('[data-io-card], [data-io-stat]').forEach(el => {
			el.classList.add('is-visible');
		});
		return;
	}

	// Hero observer
	const heroObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach(entry => {
				const cover = entry.target;
				if (entry.isIntersecting) {
					cover.style.transform = 'translateY(-100%)';
				} else {
					cover.style.transform = 'translateY(0)';
				}
			});
		},
		{ threshold: 0.4 }
	);

	const heroCover = document.querySelector('[data-io-hero]');
	const heroSection = heroCover?.closest('.hero');
	if (heroSection) heroObserver.observe(heroSection);

	// Cards & Stats observer
	const elementsObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach(entry => {
				entry.target.classList.toggle('is-visible', entry.isIntersecting);
			});
		},
		{ threshold: 0.3 }
	);

	document.querySelectorAll('[data-io-card], [data-io-stat]').forEach(el => {
		elementsObserver.observe(el);
	});
})();
