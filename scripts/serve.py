"""Serve site/ on http://127.0.0.1:8766 for previews.

    uv run scripts/serve.py [port]

Sends no-cache headers, so edits show up on reload. To see a description on the real Superhive page, push and
follow "Check on the real Superhive page" in the README (browsers don't let superhivemarket.com read localhost).
"""

import functools
import http.server
import pathlib
import sys

SITE = pathlib.Path(__file__).resolve().parent.parent / "site"


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
    handler = functools.partial(Handler, directory=str(SITE))
    print(f"Serving {SITE} on http://127.0.0.1:{port}/")
    http.server.ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()
