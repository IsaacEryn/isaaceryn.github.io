"""select 9종을 VoiceOver로 훑어 낭독을 받아 적는다(사파리, 크롬).

select마다
  1) ?focus=sX 로 열어 페이지가 그 select에 포커스를 옮기게 한다 → 닫힌 상태 낭독
  2) VoiceOver '동작 실행'(VO+Space)으로 연다 → 연 상태 첫 낭독
  3) '아래로'(VO+↓)를 두 번 → 옵션 낭독
  4) '동작 실행'으로 고른다 → 값이 바뀐 뒤의 낭독
단계마다 시각을 남겨 vo-record.js 기록을 단계별로 자른다.

준비: 데모 폴더에서 python3 -m http.server 8733 --bind 127.0.0.1, VoiceOver 켜기, AppleScript 제어 허용
사용법: python3 -I measure/vo-select.py [--browsers safari,chrome]  (결과: results/vo-select-<브라우저>.json)
"""
import argparse
import json
import os
import subprocess
import time

HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(HERE, "results")
BASE = "http://127.0.0.1:8733/index.html"
IDS = ["s0", "s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"]
CHROME = "/Applications/Google Chrome.app"
CHROME_PROFILE = "/tmp/select-vo-chrome-profile"


def osa(script):
    subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=10)


def open_url(browser, url):
    if browser == "safari":
        subprocess.run(["open", "-a", "Safari", url], check=True)
    else:
        subprocess.run(["open", "-na", CHROME, "--args", f"--user-data-dir={CHROME_PROFILE}",
                        "--no-first-run", "--no-default-browser-check", "--new-window", url], check=True)


def run_one(browser, sid, nav="down", tag=""):
    tsv = os.path.join(RES, f"vo-select{tag}-{browser}-{sid}.tsv")
    marks = []
    with open(tsv, "w", encoding="utf-8") as out:
        rec = subprocess.Popen(["osascript", "-l", "JavaScript", os.path.join(HERE, "vo-record.js"), "19"], stdout=out)
        time.sleep(0.5)
        marks.append(("open-page", int(time.time() * 1000)))
        open_url(browser, f"{BASE}?focus={sid}&delay=4000")
        time.sleep(4.0)
        marks.append(("focus", int(time.time() * 1000)))
        time.sleep(3.0)
        marks.append(("expand", int(time.time() * 1000)))
        osa('tell application "VoiceOver" to tell vo cursor to perform action')
        time.sleep(2.0)
        for k in range(2):
            marks.append((f"{nav}{k + 1}", int(time.time() * 1000)))
            osa(f'tell application "VoiceOver" to tell vo cursor to move {nav}')
            time.sleep(1.8)
        marks.append(("choose", int(time.time() * 1000)))
        osa('tell application "VoiceOver" to tell vo cursor to perform action')
        time.sleep(2.5)
        marks.append(("end", int(time.time() * 1000)))
        rec.wait()
    phrases = []
    for line in open(tsv, encoding="utf-8"):
        if "\t" in line:
            ts, text = line.rstrip("\n").split("\t", 1)
            phrases.append((int(ts), text))
    seg = {}
    for (name, t0), (_, t1) in zip(marks, marks[1:]):
        seg[name] = [p for ts, p in phrases if t0 <= ts < t1 and p.strip()]
    return seg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--browsers", default="safari,chrome")
    ap.add_argument("--ids", default=",".join(IDS))
    # 펼친 목록 안에서 옵션을 넘기는 VoiceOver 명령. 사파리의 base-select 목록은 VO+↓로 넘어가지 않아 VO+→도 잰다
    ap.add_argument("--nav", default="down", choices=["down", "right"])
    args = ap.parse_args()
    tag = "" if args.nav == "down" else f"-{args.nav}"
    for browser in args.browsers.split(","):
        result = {}
        for sid in args.ids.split(","):
            result[sid] = run_one(browser, sid, args.nav, tag)
            print(browser, sid, json.dumps(result[sid], ensure_ascii=False)[:300], flush=True)
            time.sleep(1)
        with open(os.path.join(RES, f"vo-select{tag}-{browser}.json"), "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
