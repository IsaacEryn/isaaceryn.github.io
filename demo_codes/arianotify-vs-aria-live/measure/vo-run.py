"""VoiceOver 낭독 실측 오케스트레이터

브라우저(Safari, Chrome) × 상황(cart, form, filter) × 방식(live, notify)마다
1) 자동 실측 모드 주소를 브라우저로 열고  2) 같은 시간 동안 vo-record.js로 VoiceOver 문구를 기록한다.
페이지는 상태 변경을 일으킨 시각을 serve.py의 /log로 보내므로, analyze.py가 두 기록을 시각으로 맞춘다.

준비
- 데모 폴더 최상위에서 python3 -I measure/serve.py 8732 를 띄워 둔다
- VoiceOver를 켜고(⌘F5), VoiceOver 유틸리티에서 AppleScript 제어를 허용한다
- 실측 중에는 마우스·키보드를 건드리지 않는다(포커스가 바뀌면 VoiceOver가 다른 걸 읽는다)

사용법: python3 -I measure/vo-run.py [--n 20] [--interval 3000] [--browsers safari,chrome] [--only cart:live]
"""
import argparse
import os
import subprocess
import time

HERE = os.path.dirname(os.path.abspath(__file__))
RESULTS = os.path.join(HERE, "results")
BASE = "http://127.0.0.1:8732/index.html"
CHROME = "/Applications/Google Chrome.app"
CHROME_PROFILE = "/tmp/arianotify-vo-chrome-profile"  # 내 평소 크롬 프로필과 섞이지 않게 따로 띄운다


def open_url(browser, url):
    if browser == "safari":
        subprocess.run(["open", "-a", "Safari", url], check=True)
    else:
        subprocess.run(["open", "-na", CHROME, "--args", f"--user-data-dir={CHROME_PROFILE}",
                        "--no-first-run", "--no-default-browser-check", "--new-window", url], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=20)
    ap.add_argument("--interval", type=int, default=3000)
    ap.add_argument("--delay", type=int, default=8000)
    ap.add_argument("--browsers", default="safari,chrome")
    ap.add_argument("--scenarios", default="cart,form,filter")
    ap.add_argument("--methods", default="live,notify")
    ap.add_argument("--tag", default=time.strftime("%Y%m%d-%H%M"))
    args = ap.parse_args()
    os.makedirs(RESULTS, exist_ok=True)

    seconds = (args.delay + args.n * args.interval) / 1000 + 4
    for browser in args.browsers.split(","):
        for scenario in args.scenarios.split(","):
            for method in args.methods.split(","):
                run = f"{args.tag}-{browser}-{scenario}-{method}"
                url = (f"{BASE}?auto={scenario}&method={method}&n={args.n}"
                       f"&interval={args.interval}&delay={args.delay}&run={run}")
                out = open(os.path.join(RESULTS, f"vo-{run}.tsv"), "w", encoding="utf-8")
                rec = subprocess.Popen(["osascript", "-l", "JavaScript", os.path.join(HERE, "vo-record.js"),
                                        str(int(seconds) + 2)], stdout=out)
                time.sleep(0.5)
                open_url(browser, url)
                print(f"{run}: {seconds:.0f}초 기록 중", flush=True)
                rec.wait()
                out.close()
                time.sleep(2)


if __name__ == "__main__":
    main()
