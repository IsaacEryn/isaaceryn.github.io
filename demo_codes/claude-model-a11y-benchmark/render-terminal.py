#!/usr/bin/env python3
"""check-result.json + 스캔 요약 + 코드 스니펫 → 터미널 캡처 SVG"""
import json, sys
from xml.sax.saxutils import escape
res = json.load(open("check-result.json"))
models = [m.replace("claude-", "") for m in res["models"]]
scanned = sys.argv[1] if len(sys.argv) > 1 else "20"
out_path = sys.argv[2] if len(sys.argv) > 2 else "check-terminal.svg"
W, LH, X0 = 1200, 26, 40
FONT = 'Menlo, "Apple SD Gothic Neo", monospace'
COLX = [660, 800, 940, 1080][:len(models)]
PAL = ["#FDE68A", "#5EEAD4", "#C4B5FD", "#FDBA74"]
L = []
def text(x, y, t, c, w="400", anchor="start"):
    L.append(f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family=\'{FONT}\' font-size="15" font-weight="{w}" fill="{c}" xml:space="preserve">{escape(t)}</text>')
y = 90
text(X0, y, f"$ a11ychk scan_dir gen/<model>/<prompt>   # WCAG 2.2 AA · KWCAG 2.2 · chromium · 40 files", "#94A3B8"); y += LH
SCAN = [("fable-5", "모달 0 · 폼 0", "#5EEAD4"), ("fable-5-1", "모달 0 · 폼 0", "#5EEAD4"),
        ("opus-5", "모달 1 (color-contrast, 12px #8c8175/#f4efe6 = 3.32:1) · 폼 0", "#FCA5A5"),
        ("sonnet-5", "모달 1 (버튼 #fff/#d64545 = 4.37:1) · 폼 2 (12px #888 힌트 = 3.54:1)", "#FCA5A5")]
for m, r, c in SCAN:
    text(X0+24, y, f"{m:<10} violationNodes → {r}", c); y += LH
y += LH
text(X0, y, "$ python3 check.py", "#94A3B8"); y += LH
for label, rows in res["rows"].items():
    text(X0, y, f"[{label}] 모델당 5회 생성", "#E2E8F0", "700")
    for i, m in enumerate(models): text(COLX[i], y, m, PAL[i], "700", "middle")
    y += LH
    for row in rows:
        name, cells = row[0], row[1:]
        bad = name.endswith("✗") and any(c[0] != "0" for c in cells)
        col = "#FCA5A5" if bad else "#E2E8F0"
        text(X0+24, y, name, col)
        for i, c in enumerate(cells):
            cc = "#FCA5A5" if (bad and c[0] != "0") else col
            text(COLX[i], y, c, cc, anchor="middle")
        y += LH
    y += LH
text(X0, y, "$ sed -n \"/'close'/,/});/p\" gen/claude-fable-5/P_MODAL/run4.html", "#94A3B8"); y += LH
code = [("dialog.addEventListener('close', () => {", "#E2E8F0"), ("  if (dialog.returnValue === 'confirm') {", "#E2E8F0"),
        ("    status.textContent = '항목을 삭제했습니다.';", "#E2E8F0"), ("    openButton.disabled = true;", "#FCA5A5"),
        ("  } else {", "#E2E8F0"), ("    status.textContent = '삭제를 취소했습니다.';", "#E2E8F0"), ("  }", "#E2E8F0"),
        ("  openButton.focus(); // 모달을 연 버튼으로 포커스 복귀", "#FCA5A5"), ("});", "#E2E8F0")]
for t, c in code: text(X0, y, "  " + t, c); y += LH
text(X0, y, "  ▲ 비활성 버튼은 포커스를 받지 못한다 — 호출은 조용히 실패하고 포커스는 문서 처음으로", "#FDE68A"); y += LH
H = y + 30
svg = [f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">',
       f'<rect width="{W}" height="{H}" rx="18" fill="#0F172A"/>',
       '<circle cx="34" cy="30" r="7" fill="#FF5F57"/><circle cx="58" cy="30" r="7" fill="#FEBC2E"/><circle cx="82" cy="30" r="7" fill="#28C840"/>',
       f'<text x="{W/2}" y="35" text-anchor="middle" font-family=\'{FONT}\' font-size="14" fill="#64748B">modelcmp — {scanned}개 생성물 점검 (2026-09-03)</text>'] + L + ['</svg>']
open(out_path, "w").write("\n".join(svg)); print("svg", H, "px →", out_path)
