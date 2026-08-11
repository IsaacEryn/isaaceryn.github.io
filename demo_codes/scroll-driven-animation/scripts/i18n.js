/*
 * Language switching for the scroll-driven-animation demos.
 *
 * Korean lives in the HTML itself, so the page still reads if this script never
 * runs. Each page declares its English dictionary in an inline `window.I18N`
 * block right above the <script src> that loads this file — two languages side
 * by side in one file, so edits cannot drift apart.
 *
 *   window.I18N = {
 *     title: { ko: '...', en: '...' },   // <title> per language
 *     en:    { key: 'English text', ... } // matches data-i18n="key"
 *   }
 *
 * Markup:
 *   <p data-i18n="key">한국어</p>
 *   <a data-i18n-attr="aria-label:navLabel" aria-label="챕터 내비게이션">
 *
 * Dynamic strings that JS builds at runtime belong in the page's own script as
 * MSG = { ko: {...}, en: {...} }; listen for the `demo:langchange` event this
 * file dispatches and redraw them.
 */
(function () {
	const CFG = window.I18N || {};
	const EN = CFG.en || {};
	const TITLE = CFG.title || {};

	// Snapshot the Korean that shipped in the HTML before anything overwrites it.
	const KO_TEXT = {};
	document.querySelectorAll('[data-i18n]').forEach((el) => {
		KO_TEXT[el.dataset.i18n] = el.innerHTML;
	});

	const KO_ATTR = new Map();
	document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
		const saved = {};
		el.dataset.i18nAttr.split(',').forEach((pair) => {
			const attr = pair.split(':')[0].trim();
			saved[attr] = el.getAttribute(attr);
		});
		KO_ATTR.set(el, saved);
	});

	let lang = 'ko';

	function applyLang(next) {
		lang = next === 'en' ? 'en' : 'ko';

		// The document language has to move with the content, or a screen reader
		// keeps reading Korean with an English voice (and the other way round).
		document.documentElement.lang = lang;

		const dict = lang === 'en' ? EN : KO_TEXT;
		document.querySelectorAll('[data-i18n]').forEach((el) => {
			const v = dict[el.dataset.i18n];
			if (typeof v === 'string') el.innerHTML = v;
		});

		document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
			el.dataset.i18nAttr.split(',').forEach((pair) => {
				const [attr, key] = pair.split(':').map((s) => s.trim());
				const v = lang === 'en' ? EN[key] : (KO_ATTR.get(el) || {})[attr];
				if (typeof v === 'string') el.setAttribute(attr, v);
			});
		});

		document.querySelectorAll('.lang-btn').forEach((b) => {
			b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
		});

		if (TITLE[lang]) document.title = TITLE[lang];

		try {
			localStorage.setItem('demo-lang', lang);
		} catch (e) {
			/* private mode — the choice just does not persist */
		}

		document.dispatchEvent(new CustomEvent('demo:langchange', { detail: { lang } }));
	}

	window.demoLang = () => lang;

	document.querySelectorAll('.lang-btn').forEach((b) => {
		b.addEventListener('click', () => applyLang(b.dataset.lang));
	});

	// Runs last on purpose: everything above must exist before the first apply.
	// Priority: ?lang= deep link > last choice > browser language.
	(function initLang() {
		const urlLang = new URLSearchParams(location.search).get('lang');
		let saved = null;
		try {
			saved = localStorage.getItem('demo-lang');
		} catch (e) {
			/* private mode */
		}
		const browserKo = (navigator.language || '').toLowerCase().startsWith('ko');
		const pick = (urlLang === 'en' || urlLang === 'ko') ? urlLang
			: (saved === 'en' || saved === 'ko') ? saved
				: (browserKo ? 'ko' : 'en');
		applyLang(pick);
	})();
})();
