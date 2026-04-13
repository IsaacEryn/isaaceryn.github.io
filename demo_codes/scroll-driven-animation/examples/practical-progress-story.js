const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const progressFill = document.querySelector('.progress-fill');
const dots = document.querySelectorAll('.chapter-dot');
const chapters = document.querySelectorAll('[id^="chapter-"]');
const reveals = document.querySelectorAll('[data-reveal]');
const counters = document.querySelectorAll('[data-counter]');

// Progress bar (fallback for non-CSS timeline)
if (!CSS.supports('animation-timeline', 'scroll()')) {
	function updateProgress() {
		const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
		const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
		progressFill.style.transform = `scaleX(${progress})`;
	}
	window.addEventListener('scroll', updateProgress, { passive: true });
	updateProgress();
}

// Chapter dots navigation
dots.forEach(dot => {
	dot.addEventListener('click', () => {
		const chapterId = `chapter-${dot.dataset.chapter}`;
		document.getElementById(chapterId)?.scrollIntoView({ behavior: 'smooth' });
	});
});

// Update active dot on scroll
const chapterObserver = new IntersectionObserver(
	(entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				const index = Array.from(chapters).indexOf(entry.target);
				dots.forEach((dot, i) => {
					dot.classList.toggle('active', i === index);
				});
			}
		});
	},
	{ threshold: 0.5 }
);

chapters.forEach(ch => chapterObserver.observe(ch));

// Reveal animations
if (prefersReducedMotion) {
	reveals.forEach(r => r.classList.add('is-visible'));
	counters.forEach(c => {
		c.textContent = c.dataset.counter;
	});
} else {
	const revealObserver = new IntersectionObserver(
		(entries, obs) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					obs.unobserve(entry.target);
				}
			});
		},
		{ threshold: 0.3 }
	);

	reveals.forEach(r => revealObserver.observe(r));

	// Counter animation
	const counterObserver = new IntersectionObserver(
		(entries, obs) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					const target = parseInt(entry.target.dataset.counter);
					let current = 0;
					const step = target / 60;
					const animate = () => {
						current += step;
						if (current < target) {
							entry.target.textContent = Math.floor(current);
							requestAnimationFrame(animate);
						} else {
							entry.target.textContent = target;
						}
					};
					animate();
					obs.unobserve(entry.target);
				}
			});
		},
		{ threshold: 0.5 }
	);

	counters.forEach(c => counterObserver.observe(c));
}
