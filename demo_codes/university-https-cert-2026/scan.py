"""대학 홈페이지 HTTPS·인증서 조사기

호스트마다 연결을 딱 두 번만 연다.
  1) http://호스트/ 에 GET 한 번: 응답 머리글만 읽고 끊는다(리다이렉트를 따라가지 않는다)
  2) 호스트:443 에 TLS 연결 한 번: 인증서를 받고, 같은 연결로 GET / 를 보내 머리글(HSTS)만 읽는다
호스트 사이에는 DELAY초를 쉰다. 취약점 탐색이나 페이지 수집은 하지 않는다.

사용법: python3 -I scan.py raw/universities.csv raw/scan.jsonl
결과는 학교 이름이 들어 있으므로 raw/(git 제외)에 둔다. 집계는 summarize.py가 만든다.
"""
import csv
import json
import os
import socket
import ssl
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone

DELAY = 3.0
TIMEOUT = 10
UA = "codeslog-research/1.0 (+https://www.codeslog.com; one-time HTTPS survey, 2 requests per host)"


def read_head(sock, limit=65536):
    """응답 머리글(빈 줄까지)만 읽는다. 본문은 받지 않는다."""
    data = b""
    while b"\r\n\r\n" not in data and len(data) < limit:
        chunk = sock.recv(4096)
        if not chunk:
            break
        data += chunk
    head = data.split(b"\r\n\r\n", 1)[0].decode("latin-1", "replace")
    lines = head.split("\r\n")
    status = None
    if lines and lines[0].startswith("HTTP/"):
        parts = lines[0].split(" ", 2)
        status = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else None
    headers = {}
    for line in lines[1:]:
        if ":" in line:
            k, v = line.split(":", 1)
            headers.setdefault(k.strip().lower(), v.strip())
    return status, headers


def request_line(host):
    return (f"GET / HTTP/1.1\r\nHost: {host}\r\nUser-Agent: {UA}\r\n"
            "Accept: text/html\r\nConnection: close\r\n\r\n").encode()


def probe_http(host):
    try:
        with socket.create_connection((host, 80), timeout=TIMEOUT) as s:
            s.settimeout(TIMEOUT)
            s.sendall(request_line(host))
            status, headers = read_head(s)
            return {"ok": True, "status": status, "location": headers.get("location")}
    except Exception as e:  # 연결 거부·시간 초과·DNS 실패 등
        return {"ok": False, "error": type(e).__name__ + ": " + str(e)[:120]}


def decode_cert(der):
    """DER 인증서를 getpeercert() 모양의 dict로 푼다(표준 라이브러리만 쓴다)."""
    pem = ssl.DER_cert_to_PEM_cert(der)
    with tempfile.NamedTemporaryFile("w", suffix=".pem", delete=False) as f:
        f.write(pem)
        path = f.name
    try:
        return ssl._ssl._test_decode_cert(path)
    finally:
        os.unlink(path)


def verify_chain(chain):
    """서버가 보낸 체인을 내 컴퓨터에서(네트워크 없이) openssl verify로 검증한다.
    루트는 certifi(모질라 루트 목록). 중간 인증서를 빠뜨린 서버는 여기서 실패한다
    (크롬은 AIA로 중간 인증서를 받아와 통과시키는 경우가 있으니 별도로 센다)."""
    if not chain:
        return "no-chain"
    try:
        import certifi
        cafile = certifi.where()
    except ImportError:
        cafile = "/etc/ssl/cert.pem"
    with tempfile.TemporaryDirectory() as d:
        leaf = os.path.join(d, "leaf.pem")
        rest = os.path.join(d, "rest.pem")
        with open(leaf, "w") as f:
            f.write(ssl.DER_cert_to_PEM_cert(chain[0]))  # 3.13의 get_unverified_chain()은 DER 바이트 목록
        with open(rest, "w") as f:
            for c in chain[1:]:
                f.write(ssl.DER_cert_to_PEM_cert(c))
        args = ["/usr/bin/openssl", "verify", "-CAfile", cafile]
        if len(chain) > 1:
            args += ["-untrusted", rest]
        r = subprocess.run(args + [leaf], capture_output=True, text=True)
        out = (r.stdout + r.stderr).strip().replace(d + "/", "").replace("\n", " | ")
        return "ok" if r.returncode == 0 and out.endswith("OK") else "fail: " + out[-120:]


def name_of(rdns, key):
    for rdn in rdns:
        for k, v in rdn:
            if k == key:
                return v
    return None


def host_matches(host, sans):
    for kind, name in sans:
        if kind != "DNS":
            continue
        name = name.lower()
        if name == host:
            return True
        if name.startswith("*.") and host.count(".") >= 2 and host.split(".", 1)[1] == name[2:]:
            return True
    return False


def probe_tls(host):
    # 검증 없이 연결해 인증서를 받은 뒤, 만료·이름 불일치·자체 서명을 직접 판정한다.
    # (검증을 켜면 실패한 곳의 인증서를 못 받아 연결을 한 번 더 열어야 하기 때문)
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    try:
        with socket.create_connection((host, 443), timeout=TIMEOUT) as raw:
            with ctx.wrap_socket(raw, server_hostname=host) as s:
                s.settimeout(TIMEOUT)
                der = s.getpeercert(binary_form=True)
                version = s.version()
                chain = s.get_unverified_chain() or []
                try:
                    s.sendall(request_line(host))
                    status, headers = read_head(s)
                except Exception as e:
                    status, headers = None, {"_error": type(e).__name__}
        cert = decode_cert(der)
        chain_verify = verify_chain(chain)
        nb = datetime.strptime(cert["notBefore"], "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
        na = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
        sans = cert.get("subjectAltName", ())
        return {
            "ok": True,
            "tls": version,
            "chain_len": len(chain),
            "chain_verify": chain_verify,
            "not_before": nb.isoformat(),
            "not_after": na.isoformat(),
            "validity_days": round((na - nb).total_seconds() / 86400, 2),
            "issuer_o": name_of(cert.get("issuer", ()), "organizationName"),
            "issuer_cn": name_of(cert.get("issuer", ()), "commonName"),
            "self_signed": cert.get("issuer") == cert.get("subject"),
            "host_match": host_matches(host, sans),
            "https_status": status,
            "https_location": headers.get("location"),
            "hsts": headers.get("strict-transport-security"),
        }
    except Exception as e:
        return {"ok": False, "error": type(e).__name__ + ": " + str(e)[:120]}


def main(src, dst):
    hosts = []
    seen = set()
    with open(src, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            h = (row.get("host") or "").strip().lower()
            if h and h not in seen:
                seen.add(h)
                hosts.append(h)
    done = set()
    if os.path.exists(dst):  # 중간에 끊겼으면 이어서 잰다(같은 호스트를 다시 부르지 않게)
        with open(dst, encoding="utf-8") as f:
            done = {json.loads(line)["host"] for line in f if line.strip()}
    with open(dst, "a", encoding="utf-8") as out:
        for i, host in enumerate(hosts, 1):
            if host in done:
                continue
            rec = {"host": host, "at": datetime.now(timezone.utc).isoformat()}
            rec["http"] = probe_http(host)
            rec["https"] = probe_tls(host)
            out.write(json.dumps(rec, ensure_ascii=False) + "\n")
            out.flush()
            print(f"[{i}/{len(hosts)}] {host} http={rec['http'].get('status', 'ERR')} "
                  f"tls={'ok' if rec['https']['ok'] else 'ERR'}", flush=True)
            time.sleep(DELAY)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
