"""Serve site/ on http://127.0.0.1:8766 for previews.

    uv run scripts/serve.py [port]

Sends CORS and no-cache headers, so a Superhive product page open in the browser can fetch a preview and show the
new description in place (see README, "Check on the real Superhive page"), and edits show up on reload.
"""

import functools
import http.server
import pathlib
import sys

SITE = pathlib.Path(__file__).resolve().parent.parent / "site"


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        # Chrome asks before a public page (superhivemarket.com) may read from localhost.
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Methods", "GET")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
    handler = functools.partial(Handler, directory=str(SITE))
    print(f"Serving {SITE} on http://127.0.0.1:{port}/")
    http.server.ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()
