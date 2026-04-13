// Content reveal with IO (fallback for scroll animation)
const blocks = document.querySelectorAll('[data-reveal]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
	blocks.forEach(b => b.classList.add('is-visible'));
} else {
	const observer = new IntersectionObserver(
		(entries, obs) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					obs.unobserve(entry.target);
				}
			});
		},
		{ threshold: 0.2 }
	);

	blocks.forEach(b => observer.observe(b));
}
