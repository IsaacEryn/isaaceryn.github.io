"""scan.py 결과(raw/scan.jsonl)를 학교 이름 없이 집계한다.
사용법: python3 -I summarize.py raw/scan.jsonl results/summary.json  (기준일은 실측일 2026-10-24)
"""
import collections
import json
import sys
from datetime import datetime, timezone

AS_OF = datetime(2026, 10, 24, tzinfo=timezone.utc)
RULE_200 = datetime(2026, 3, 15, tzinfo=timezone.utc)


def http_class(h):
    if not h["ok"]:
        return "80번 포트 응답 없음"
    loc = (h.get("location") or "").lower()
    if h["status"] in (301, 302, 303, 307, 308):
        return "HTTPS로 보냄" if loc.startswith("https://") else "HTTP 안에서 이동"
    return "HTTP로 바로 응답"


def cert_problem(t):
    if t["self_signed"]:
        return "자체 서명"
    if not t["host_match"]:
        return "이름 불일치"
    if datetime.fromisoformat(t["not_after"]) < AS_OF:
        return "만료"
    if t["chain_verify"] != "ok":
        return "중간 인증서 누락"
    return None


def bin_days(d):
    for limit, name in [(47.5, "47일 이하"), (90.5, "48~90일"), (100.5, "91~100일"), (200.5, "101~200일"), (398.5, "201~398일")]:
        if d <= limit:
            return name
    return "398일 초과"


def main(src, dst):
    rows = [json.loads(l) for l in open(src, encoding="utf-8")]
    s = {"as_of": AS_OF.date().isoformat(), "hosts": len(rows)}
    s["http"] = collections.Counter(http_class(r["http"]) for r in rows)
    ok = [r for r in rows if r["https"]["ok"]]
    s["https_handshake_ok"] = len(ok)
    s["https_fail"] = collections.Counter(r["https"]["error"].split(":")[0] + (": " + r["https"]["error"].split("[SSL: ")[1].split("]")[0] if "[SSL: " in r["https"]["error"] else "") for r in rows if not r["https"]["ok"])
    s["cert_problem"] = collections.Counter(cert_problem(r["https"]) or "정상" for r in ok)
    s["https_redirects_to_http"] = sum(1 for r in ok if (r["https"].get("https_location") or "").lower().startswith("http://"))
    s["hsts"] = sum(1 for r in ok if r["https"]["hsts"])
    s["tls_version"] = collections.Counter(r["https"]["tls"] for r in ok)
    s["validity_bins"] = collections.Counter(bin_days(r["https"]["validity_days"]) for r in ok)
    s["validity_exact_199"] = sum(1 for r in ok if abs(r["https"]["validity_days"] - 199) < 0.6)
    s["validity_exact_200"] = sum(1 for r in ok if abs(r["https"]["validity_days"] - 200) < 0.6)
    s["issuer"] = collections.Counter(r["https"]["issuer_o"] or "(없음)" for r in ok)
    new = [r for r in ok if datetime.fromisoformat(r["https"]["not_before"]) >= RULE_200]
    s["issued_since_2026_03_15"] = len(new)
    s["issued_since_over_200d"] = sum(1 for r in new if r["https"]["validity_days"] > 200.5)
    left = [(datetime.fromisoformat(r["https"]["not_after"]) - AS_OF).days for r in ok if not r["https"]["self_signed"]]
    s["expires_within_30d"] = sum(1 for d in left if 0 <= d <= 30)
    s["expires_within_90d"] = sum(1 for d in left if 0 <= d <= 90)
    # 크롬이 http:// 주소에서 HTTPS로 못 올라가 경고 후보가 되는 곳: HTTPS 연결 실패, 인증서 이름·서명 문제, HTTPS가 다시 HTTP로 보냄
    risky = 0
    for r in rows:
        t = r["https"]
        http_alive = r["http"]["ok"]
        if not http_alive:
            continue
        if not t["ok"] or cert_problem(t) in ("자체 서명", "이름 불일치", "만료") or (t.get("https_location") or "").lower().startswith("http://"):
            risky += 1
    s["chrome_warning_candidates"] = risky
    s = {k: (dict(v.most_common()) if isinstance(v, collections.Counter) else v) for k, v in s.items()}
    with open(dst, "w", encoding="utf-8") as f:
        json.dump(s, f, ensure_ascii=False, indent=1)
    print(json.dumps(s, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
