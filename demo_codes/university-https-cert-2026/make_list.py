"""대학알리미 '학교 개황 정보' 파일에서 4년제 대학 목록과 홈페이지 도메인을 뽑는다.

사용법:
  python3 -I build_universities.py LATEST.xlsx FALLBACK.xlsx OUT.csv BORDERLINE.csv

- LATEST: 학교 목록의 기준 파일(2026.9.28. 기준, xls를 LibreOffice로 xlsx 변환한 것)
- FALLBACK: 홈페이지 칸을 채울 직전 파일(2026.8.28. 기준). 9.28. 파일은 홈페이지 칸이
  대부분 비어 있어서, 9.28. 값이 있으면 그것을 쓰고 없으면 8.28. 값을 쓴다.
"""
import collections
import csv
import sys
from urllib.parse import urlsplit

import openpyxl

FOUR_YEAR = ("대학교", "교육대학", "산업대학", "기술대학", "방송통신대학")
BORDERLINE = ("사이버대학(대학)", "각종학교(대학)")
TYPE_MAP = {"국립": "국립", "공립": "공립", "사립": "사립",
            "국립대법인": "국립", "특별법국립": "국립"}  # 특별법법인은 그대로 둔다


def load(path):
    ws = openpyxl.load_workbook(path, read_only=True).worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    hdr = [str(h).replace("_x000D_", "").replace("\n", "") if h else h for h in rows[1]]
    out = []
    for r in rows[2:]:
        if not any(r):
            continue
        out.append({h: (str(v).strip() if v is not None else "") for h, v in zip(hdr, r)})
    return rows[0][0], out


def host_of(url):
    u = url.strip()
    if not u:
        return ""
    if "://" not in u:
        u = "http://" + u
    h = urlsplit(u).hostname or ""
    return h.strip().rstrip(".").lower()


def main(latest, fallback, out_csv, border_csv):
    basis, rows = load(latest)
    fb_basis, fb_rows = load(fallback)
    fb = {}
    for r in fb_rows:
        fb.setdefault((r["학교명"], r["본분교"], r["학제"]), r["학교홈페이지"])

    def pick(scope):
        sel, seen, dups, from_fb, disagree = [], set(), [], 0, []
        for r in rows:
            if r["학제"] not in scope or r["학교상태"] == "폐교":
                continue
            key = (r["학교명"], r["본분교"], r["학제"])
            if key in seen:
                dups.append(key)
                continue
            seen.add(key)
            hp = r["학교홈페이지"]
            fbv = fb.get(key, "")
            if hp and fbv and host_of(hp) != host_of(fbv):
                disagree.append((key, hp, fbv))
            if not hp and fbv:
                hp, from_fb = fbv, from_fb + 1
            sel.append({
                "name": r["학교명"],
                "campus": r["본분교"],
                "type": TYPE_MAP.get(r["설립구분"], r["설립구분"]),
                "region": r["지역"],
                "homepage": hp,
                "host": host_of(hp),
                "_kind": r["학제"],
                "_orig_type": r["설립구분"],
            })
        return sel, dups, from_fb, disagree

    cols = ["name", "campus", "type", "region", "homepage", "host"]
    sel, dups, from_fb, disagree = pick(FOUR_YEAR)
    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore", lineterminator="\n")
        w.writeheader()
        w.writerows(sel)
    bsel, _, _, _ = pick(BORDERLINE)
    with open(border_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols + ["kind"], extrasaction="ignore", lineterminator="\n")
        w.writeheader()
        for r in bsel:
            r["kind"] = r["_kind"]
            w.writerow(r)

    print("basis:", basis, "| fallback:", fb_basis)
    print("rows:", len(sel), "| by kind:", collections.Counter(r["_kind"] for r in sel))
    print("by campus:", collections.Counter(r["campus"] for r in sel))
    print("by type:", collections.Counter(r["type"] for r in sel),
          "| orig:", collections.Counter(r["_orig_type"] for r in sel))
    print("homepage filled from fallback:", from_fb)
    print("duplicate keys skipped:", dups)
    print("latest vs fallback host disagreements:", disagree)
    print("missing homepage:", [(r["name"], r["campus"]) for r in sel if not r["host"]])
    hosts = collections.defaultdict(list)
    for r in sel:
        if r["host"]:
            hosts[r["host"]].append(f'{r["name"]}/{r["campus"]}')
    print("shared hosts:")
    for h, v in hosts.items():
        if len(v) > 1:
            print("  ", h, v)
    print("non-.ac.kr hosts:")
    for r in sel:
        if r["host"] and not r["host"].endswith(".ac.kr"):
            print("  ", r["name"], r["campus"], r["homepage"])
    print("homepage with path/scheme/odd chars:")
    for r in sel:
        hp = r["homepage"]
        rest = hp.split("://", 1)[-1]
        if "/" in rest.rstrip("/") or "://" in hp or " " in hp or not rest.lower().startswith(r["host"]):
            print("  ", r["name"], r["campus"], repr(hp))
    print("borderline rows written:", len(bsel))


if __name__ == "__main__":
    main(*sys.argv[1:5])
