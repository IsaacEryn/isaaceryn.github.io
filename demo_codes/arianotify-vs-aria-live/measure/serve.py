"""데모 폴더를 띄우고, 페이지가 보내는 POST /log를 results/triggers.jsonl에 덧붙인다.
사용법: python3 -I measure/serve.py 8732  (데모 폴더 최상위에서)"""
import http.server
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
LOG = os.path.join(HERE, "results", "triggers.jsonl")


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/log":
            self.send_error(404)
            return
        body = self.rfile.read(int(self.headers.get("content-length", 0))).decode("utf-8", "replace")
        with open(LOG, "a", encoding="utf-8") as f:
            f.write(body.strip() + "\n")
        self.send_response(204)
        self.end_headers()

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8732
    os.chdir(os.path.dirname(HERE))
    http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
