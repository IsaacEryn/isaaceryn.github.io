const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const cards = document.querySelectorAll('[data-parallax]');

if (!prefersReducedMotion && window.innerWidth > 900) {
	let ticking = false;

	function updateParallax() {
		ticking = false;
		const scrollY = window.scrollY;

		cards.forEach((card, index) => {
			const speed = [0.15, 0.25, 0.35][index] || 0.2;
			const offset = scrollY * speed;
			card.style.transform = index === 1
				? `scale(1.05) translateY(${offset}px)`
				: `translateY(${offset}px)`;
		});
	}

	function onScroll() {
		if (!ticking) {
			ticking = true;
			requestAnimationFrame(updateParallax);
		}
	}

	window.addEventListener('scroll', onScroll, { passive: true });
	updateParallax();
}
