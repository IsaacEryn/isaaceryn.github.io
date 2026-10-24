"""triggers.jsonl(페이지가 일으킨 시각)과 vo-<run>.tsv(VoiceOver가 말한 문구)를 시각으로 맞춘다.

상태 변경마다 다음 변경 전까지(간격 창) VoiceOver 문구를 훑어
- 읽음: 그 메시지가 창 안에서 한 번 이상 나옴. 지연 = 처음 나온 시각 - 일으킨 시각
- 늦게 읽음: 창 안에선 없고, 다음 창부터 같은 문구가 다시 트리거되기 전 사이에 나옴
- 누락: 끝까지 안 나옴
- 끊김: 읽기 시작했지만 CUT_MS 안에 다른 문구(포커스 낭독 등)가 덮음. VoiceOver는 새 문구를 말하면 하던 말을 끊으므로
  사실상 들리지 않은 것으로 본다. '읽음'은 끝까지 유지된 것만 센다(빈 문구는 효과음 등이라 덮은 것으로 치지 않는다)
- 중복: 창 안에서 같은 메시지가 다른 문구를 사이에 두고 두 번 이상 나옴
  (같은 문구를 연달아 두 번 말하면 '마지막 문구'가 바뀌지 않아 셀 수 없다. 그래서 메시지에 개수·건수를 넣었다)
VoiceOver의 '마지막 문구'를 50ms마다 읽으므로 지연은 50ms 단위 근사값이다.

사용법: python3 -I measure/analyze.py main   (태그) → results/summary-<태그>.md
"""
import json
import os
import statistics
import sys

CUT_MS = 500
HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(HERE, "results")


def norm(s):
    return "".join(ch for ch in s if not ch.isspace())


def analyze(run):
    trig = [json.loads(l) for l in open(os.path.join(RES, "triggers.jsonl"), encoding="utf-8")
            if f'"run": "{run}"' in l or f'"run":"{run}"' in l]
    events = [t for t in trig if "text" in t]
    tsv = os.path.join(RES, f"vo-{run}.tsv")
    if not os.path.exists(tsv) or not events:
        return None
    phrases = []
    for line in open(tsv, encoding="utf-8"):
        if "\t" in line:
            ts, text = line.rstrip("\n").split("\t", 1)
            phrases.append((int(ts), text))
    rows = []
    for i, ev in enumerate(events):
        t0 = ev["t"]
        t1 = events[i + 1]["t"] if i + 1 < len(events) else t0 + 3000
        key = norm(ev["text"])
        hits = [ts for ts, p in phrases if t0 - 100 <= ts < t1 and key in norm(p)]
        # 늦게 읽음은 같은 문구가 다시 트리거되기 전까지만 센다(문구가 번갈아 반복되는 상황에서 뒤 트리거의 낭독을 잘못 세지 않게)
        t_same = next((e["t"] for e in events[i + 1:] if norm(e["text"]) == key), t1 + 10**7)
        late = [ts for ts, p in phrases if t1 <= ts < t_same and key in norm(p)]
        # 처음 잡힌 뒤 얼마나 유지됐나: 다음의 '비어 있지 않은 다른 문구'까지의 시간
        def hold(ts0):
            nxt = [ts for ts, p in phrases if ts > ts0 and p.strip() and key not in norm(p)]
            return (nxt[0] - ts0) if nxt else 10**6
        if hits and all(hold(h) < CUT_MS for h in hits):
            rows.append({"i": i + 1, "state": "끊김", "latency": hits[0] - t0, "count": len(hits), "hold": hold(hits[0])})
        elif hits:
            rows.append({"i": i + 1, "state": "읽음", "latency": hits[0] - t0, "count": len(hits)})
        elif late:
            rows.append({"i": i + 1, "state": "늦게 읽음", "latency": late[0] - t0, "count": 0})
        else:
            rows.append({"i": i + 1, "state": "누락", "latency": None, "count": 0})
    read = [r for r in rows if r["state"] == "읽음"]
    lat = [r["latency"] for r in read]
    return {
        "run": run,
        "n": len(rows),
        "read": len(read),
        "late": sum(1 for r in rows if r["state"] == "늦게 읽음"),
        "cut": sum(1 for r in rows if r["state"] == "끊김"),
        "missed": sum(1 for r in rows if r["state"] == "누락"),
        "dup": sum(1 for r in read if r["count"] > 1),
        "lat_median": statistics.median(lat) if lat else None,
        "lat_max": max(lat) if lat else None,
        "rows": rows,
    }


def main(tag):
    out = []
    md = [f"# VoiceOver 낭독 실측 요약 ({tag})", "",
          "| 브라우저 | 상황 | 방식 | 읽음 | 끊김 | 늦게 | 누락 | 중복 | 지연 중앙값(ms) | 최대(ms) |",
          "|---|---|---|---|---|---|---|---|---|---|"]
    for browser in ["safari", "chrome"]:
        for scenario in ["cart", "form", "filter"]:
            for method in ["live", "notify", "notify-normal", "describedby"]:
                r = analyze(f"{tag}-{browser}-{scenario}-{method}")
                if not r:
                    continue
                out.append(r)
                md.append(f"| {browser} | {scenario} | {method} | {r['read']}/{r['n']} | {r['cut']} | {r['late']} | {r['missed']} | "
                          f"{r['dup']} | {r['lat_median'] if r['lat_median'] is not None else '-'} | {r['lat_max'] if r['lat_max'] is not None else '-'} |")
    with open(os.path.join(RES, f"summary-{tag}.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    with open(os.path.join(RES, f"summary-{tag}.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(md) + "\n")
    print("\n".join(md))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "main")
