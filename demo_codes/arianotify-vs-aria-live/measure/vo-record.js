// VoiceOver가 마지막으로 말한 문구를 50ms마다 읽어, 바뀔 때마다 "시각(ms)<TAB>문구"를 출력한다.
// 준비: VoiceOver 유틸리티 > General > "Allow VoiceOver to be controlled with AppleScript" 켜기, VoiceOver 켜기
// 사용법: osascript -l JavaScript measure/vo-record.js 90 > results/vo-<run>.tsv   (90초 동안 기록)
function run(argv) {
	const seconds = Number(argv[0] || 60);
	const vo = Application('VoiceOver');
	const app = Application.currentApplication();
	app.includeStandardAdditions = true;
	const end = Date.now() + seconds * 1000;
	let last = null;
	const lines = [];
	while (Date.now() < end) {
		let phrase = '';
		try { phrase = vo.lastPhrase.content(); } catch (e) { phrase = '(읽기 실패)'; }
		if (phrase !== last) {
			lines.push(`${Date.now()}\t${String(phrase).replace(/[\t\n]/g, ' ')}`);
			last = phrase;
		}
		delay(0.05);
	}
	return lines.join('\n');
}
