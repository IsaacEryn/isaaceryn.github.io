#!/usr/bin/env python3
"""생성물 20개 접근성 패턴 집계 — 본문 표의 근거 (재검증판)"""
import re
from pathlib import Path
BASE = Path(__file__).parent / "gen"
import sys, json
MODELS = sys.argv[1].split(",") if len(sys.argv) > 1 else ["claude-fable-5", "claude-fable-5-1"]
RESULT = {}

def close_block(src):
    m = re.search(r"addEventListener\(['\"]close['\"][\s\S]*?\}\);", src)
    return m.group(0) if m else ""

def restores_focus(src):
    """명시적 복원 코드: close 핸들러 안의 focus() 또는 저장해둔 이전 포커스로 focus()"""
    return bool(re.search(r"\w+\.focus\(\)", close_block(src)) or
                re.search(r"(lastFocus|previous|prevFocus|trigger|opener|openBtn|openButton)\w*\.focus\(\)", src))

def focus_after_disable(src):
    """같은 버튼을 disabled로 만든 뒤 그 버튼에 focus() — 포커스 증발"""
    b = close_block(src) or src
    for m in re.finditer(r"(\w+)\.disabled\s*=\s*true", b):
        var = m.group(1)
        if re.search(rf"{var}\.focus\(\)", b[m.end():]):
            return True
    return False

def cancel_first(src):
    return bool(re.search(r"cancel\w*\.focus\(\)", src, re.I) or
                re.search(r"<button[^>]*autofocus[^>]*>\s*취소", src))

def dialog_semantic(src):
    return "<dialog" in src or 'role="dialog"' in src or 'role="alertdialog"' in src

def background_inert(src):
    return "showModal" in src or "inert" in src or "aria-hidden" in src

def blur_gated(src):
    return bool(re.search(r"addEventListener\(['\"]blur['\"][\s\S]{0,300}?(touched|blurred|dirty|visited)", src, re.I))

def validates_every_keystroke(src):
    """blur 게이트 없이 input마다 즉시 검증"""
    has_input = bool(re.search(r"addEventListener\(['\"]input['\"]", src))
    return has_input and not blur_gated(src)

def submit_locked(src):
    return bool(re.search(r"(submit|btn|button)\w*\.disabled\s*=", src, re.I))

CHECKS = {
  "모달": [
    ("<dialog> + showModal() 사용",          lambda s: "showModal" in s),
    ("dialog 시맨틱(요소 또는 role)",         dialog_semantic),
    ("배경 비활성화(showModal/inert/hidden)", background_inert),
    ("초기 포커스를 취소 버튼에",              cancel_first),
    ("aria-labelledby 제목 연결",            lambda s: "aria-labelledby" in s),
    ("닫을 때 포커스 복원(명시 코드)",          restores_focus),
    ("disabled 버튼에 focus() ✗",           focus_after_disable),
  ],
  "폼": [
    ("<label for> 연결",                    lambda s: bool(re.search(r"<label[^>]*for=", s))),
    ("aria-invalid 에러 상태 표시",            lambda s: "aria-invalid" in s),
    ("에러 라이브 리전(alert/live)",          lambda s: bool(re.search(r'role="alert"|aria-live', s))),
    ("blur 이후에 검증 시작",                 blur_gated),
    ("타이핑마다 즉시 검증 ✗",                 validates_every_keystroke),
    ('autocomplete="new-password"',         lambda s: "new-password" in s),
    ("제출 버튼 disabled 잠금 ✗",             submit_locked),
  ],
}
for label, checks in CHECKS.items():
    d = "P_MODAL" if label == "모달" else "P_FORM"
    print(f"\n[{label}] 모델당 5회 생성".ljust(40) + "".join(m.replace("claude-", "").center(12) for m in MODELS))
    RESULT[label] = []
    for name, fn in checks:
        row = f"  {name:<34}"; cells = []
        for m in MODELS:
            files = sorted((BASE / m / d).glob("run*.html"))
            n = sum(1 for f in files if fn(f.read_text(errors="ignore")))
            cells.append(f"{n}/{len(files)}"); row += cells[-1].center(12)
        print(row); RESULT[label].append([name] + cells)
json.dump({"models": MODELS, "rows": RESULT}, open("check-result.json", "w"), ensure_ascii=False)
