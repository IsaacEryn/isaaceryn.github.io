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
			el.classList.add('is-visible', 'is-locked');
		});
		return;
	}

	// Hero observer - one-time reveal
	let heroRevealed = false;
	const heroObserver = new IntersectionObserver(
		(entries, observer) => {
			entries.forEach(entry => {
				if (entry.isIntersecting && !heroRevealed) {
					const cover = document.querySelector('[data-io-hero]');
					cover.style.transform = 'translateY(-100%)';
					heroRevealed = true;
					observer.unobserve(entry.target);
				}
			});
		},
		// 0.25, not 0.4: .hero is 250vh, so intersectionRatio can never exceed
		// 100/250 = 0.4. A threshold sitting exactly on that ceiling is a coin flip.
		{ threshold: 0.25 }
	);

	const hero = document.querySelector('.hero');
	if (hero) heroObserver.observe(hero);

	// Cards & Stats observer - one-time reveal with lock
	const elementsObserver = new IntersectionObserver(
		(entries, observer) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					// Lock after transition completes
					setTimeout(() => {
						entry.target.classList.add('is-locked');
					}, 600);
					observer.unobserve(entry.target);
				}
			});
		},
		{ threshold: 0.3 }
	);

	document.querySelectorAll('[data-io-card], [data-io-stat]').forEach(el => {
		elementsObserver.observe(el);
	});
})();
