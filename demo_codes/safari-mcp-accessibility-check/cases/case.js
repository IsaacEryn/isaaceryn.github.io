document.querySelectorAll('[data-cart]').forEach((el) => {
	el.addEventListener('click', () => {
		document.querySelector('.status').textContent = '장바구니에 담았습니다.';
	});
});
