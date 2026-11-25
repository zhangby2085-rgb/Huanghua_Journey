r"""本机"接图"小服务：内置浏览器里 Gemini 画好的图，用页面里的 fetch 发到这里，存进 黄花的生活/gemini2/。
也把参考图（黄花小猫.jpg 等）给页面取，用来贴进 Gemini 当参考。

  python dev/bridge.py 8813

GET  /ref/<文件名>          读 黄花的生活/<文件名>
POST /save?name=<名字>       把请求体存成 黄花的生活/gemini2/<名字>（只允许字母数字和 _-. ）
只听 127.0.0.1。回 CORS 和 Private-Network 头，https 的 Gemini 页面才能发过来。
"""
import os
import re
import sys
import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art')
OUT = os.path.join(SRC, 'gemini2')


class H(BaseHTTPRequestHandler):
    def cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Allow-Private-Network', 'true')

    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        if u.path.startswith('/ref/'):
            name = urllib.parse.unquote(u.path[5:])
            f = os.path.join(SRC, os.path.basename(name))
            if os.path.isfile(f):
                data = open(f, 'rb').read()
                self.send_response(200); self.cors()
                self.send_header('Content-Type', 'image/png' if f.endswith('.png') else 'image/jpeg')
                self.send_header('Content-Length', str(len(data))); self.end_headers(); self.wfile.write(data); return
        if u.path == '/list':
            names = sorted(os.listdir(OUT)) if os.path.isdir(OUT) else []
            data = '\n'.join(names).encode('utf-8')
            self.send_response(200); self.cors(); self.send_header('Content-Type', 'text/plain; charset=utf-8'); self.end_headers(); self.wfile.write(data); return
        self.send_response(200); self.cors(); self.send_header('Content-Type', 'text/plain'); self.end_headers(); self.wfile.write(b'huanghua bridge ok')

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)
        q = urllib.parse.parse_qs(u.query)
        name = (q.get('name') or [''])[0]
        if u.path != '/save' or not re.fullmatch(r'[A-Za-z0-9_.-]{1,80}', name):
            self.send_response(400); self.cors(); self.end_headers(); return
        n = int(self.headers.get('Content-Length') or 0)
        if n <= 0 or n > 30 * 1024 * 1024:
            self.send_response(413); self.cors(); self.end_headers(); return
        data = self.rfile.read(n)
        os.makedirs(OUT, exist_ok=True)
        with open(os.path.join(OUT, name), 'wb') as fh:
            fh.write(data)
        self.send_response(200); self.cors(); self.send_header('Content-Type', 'text/plain'); self.end_headers()
        self.wfile.write(('saved %s %d' % (name, len(data))).encode())
        print('saved', name, len(data), flush=True)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8813
    HTTPServer(('127.0.0.1', port), H).serve_forever()
