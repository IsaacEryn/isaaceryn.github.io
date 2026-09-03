// WebKit 블로그의 재현 모듈을 그대로 옮겼다 — top-level await 하나가 전부다
await new Promise((resolve) => setTimeout(resolve, 10))

export function someFunction() {
	return 'Hello!'
}

export const someArray = []
