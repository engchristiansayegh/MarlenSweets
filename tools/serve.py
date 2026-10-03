"""Local preview server:  python tools/serve.py   → http://localhost:5500"""
import functools
import http.server
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128  # the default (5) drops connections when a page loads many files
    daemon_threads = True


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript', '.woff2': 'font/woff2', '.webp': 'image/webp'}

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')  # always serve the latest files while editing
        super().end_headers()

    def log_message(self, *args):
        pass


if __name__ == '__main__':
    with Server(('', 5500), functools.partial(Handler, directory=str(ROOT))) as httpd:
        print('Marlen Sweets preview: http://localhost:5500  (Ctrl+C to stop)')
        httpd.serve_forever()
