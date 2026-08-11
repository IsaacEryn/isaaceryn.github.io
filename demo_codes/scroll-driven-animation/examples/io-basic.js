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
	// We observe the *section* but move the *cover*. `entry.target` is the observed
	// section, so writing the transform onto it would slide the whole 250vh hero
	// instead of the cover — and the cover would never budge.
	const heroCover = document.querySelector('[data-io-hero]');
	const heroSection = heroCover?.closest('.hero');

	// threshold 0.25, not 0.4: .hero is min-height 250vh, so at most 100vh of 250vh
	// is ever on screen — intersectionRatio tops out at exactly 0.4 no matter how big
	// the window is. A 0.4 threshold sits right on that ceiling and fires only in a
	// sliver (or not at all, once subpixel rounding is involved).
	const heroObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach(entry => {
				heroCover.style.transform = entry.isIntersecting
					? 'translateY(-100%)'
					: 'translateY(0)';
			});
		},
		{ threshold: 0.25 }
	);

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
