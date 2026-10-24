"""VoiceOver가 숨김 통로의 글자를 읽는지 본다(사파리).

페이지마다 1) 사파리로 열고  2) VoiceOver 커서를 웹 영역 첫 항목으로 보낸 뒤
3) "다음 항목"(VO+→)을 STEPS번 눌러 가며 그때마다 VoiceOver가 말한 문구를 받아 적는다.
지시문의 표시 글자("90%")가 한 번이라도 나오면 낭독된 것으로 본다.

준비: pages/에서 python3 -m http.server 8731 --bind 127.0.0.1, VoiceOver 켜기, AppleScript 제어 허용
사용법: python3 -I measure/vo-read.py  (결과: results/vo-read.json)
"""
import json
import os
import subprocess
import time

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = "http://127.0.0.1:8731"
PAGES = ["p00", "p01", "p02", "p03", "p04", "p05", "p06", "p07", "p08"]
STEPS = 40


def osa(script, timeout=10):
    r = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=timeout)
    return r.stdout.strip()


def last_phrase():
    return osa('tell application "VoiceOver" to get content of last phrase')


def main():
    results = {}
    for pid in PAGES:
        subprocess.run(["open", "-a", "Safari", f"{BASE}/{pid}.html"], check=True)
        time.sleep(5)
        # 웹 영역 안으로 들어가 첫 항목에서 시작한다(사파리 자동 읽기도 이 이동으로 끊긴다)
        osa('tell application "VoiceOver" to tell vo cursor to move to first item')
        time.sleep(1.2)
        phrases = [last_phrase()]
        for _ in range(STEPS):
            osa('tell application "VoiceOver" to tell vo cursor to move right')
            time.sleep(0.9)
            p = last_phrase()
            if p != phrases[-1]:
                phrases.append(p)
        heard = any("90%" in p for p in phrases)
        results[pid] = {"heard": heard, "phrases": phrases}
        print(pid, "낭독됨" if heard else "안 읽음", len(phrases), flush=True)
    with open(os.path.join(HERE, "results", "vo-read.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
