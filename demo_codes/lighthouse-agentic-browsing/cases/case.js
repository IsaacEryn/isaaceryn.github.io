// 장바구니 동작 — 모든 케이스 공통.
// data-cart가 붙은 요소를 누르면 상태 메시지를 바꾼다. 요소가 button이든 div든 같은 코드다.
document.querySelectorAll('[data-cart]').forEach((el) => {
	el.addEventListener('click', () => {
		document.querySelector('.status').textContent = '장바구니에 담았습니다.';
	});
});
