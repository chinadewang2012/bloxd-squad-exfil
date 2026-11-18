"""
MCA → Bloxd 蓝图 Web 服务器
===========================
用法: python server.py [--port 8000]
然后浏览器打开 http://localhost:8000
"""

import os, sys, json, time, tempfile, argparse, re
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from pathlib import Path

SERVER_DIR = Path(__file__).parent.resolve()
WEB_DIR = SERVER_DIR / "web"
OUTPUT_DIR = SERVER_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

# 导入转换器
sys.path.insert(0, str(SERVER_DIR))
from mca_to_bloxd import convert as do_convert


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[{time.strftime('%H:%M:%S')}] {fmt % args}")

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/' or path == '/index.html':
            self.serve_file(WEB_DIR / "index.html", "text/html")
        elif path == '/style.css':
            self.serve_file(WEB_DIR / "style.css", "text/css")
        elif path == '/app.js':
            self.serve_file(WEB_DIR / "app.js", "application/javascript")
        elif path == '/download':
            fname = parse_qs(parsed.query).get('name', [''])[0]
            safe = os.path.basename(fname)
            fpath = OUTPUT_DIR / safe
            if fpath.exists():
                data = fpath.read_bytes()
                self.send_response(200)
                self.send_header('Content-Type', 'application/octet-stream')
                self.send_header('Content-Disposition', f'attachment; filename="{safe}"')
                self.send_header('Content-Length', str(len(data)))
                self.end_headers()
                self.wfile.write(data)
            else:
                self.send_error(404, "文件不存在")
        else:
            self.send_error(404)

    def do_POST(self):
        if self.path == '/convert':
            self.handle_convert()
        else:
            self.send_error(404)

    def handle_convert(self):
        # 解析 multipart/form-data
        ctype = self.headers.get('Content-Type', '')
        if 'multipart/form-data' not in ctype:
            self.send_json(400, {'error': '需要 multipart/form-data'})
            return

        boundary = ctype.split('boundary=')[1].encode()
        length = int(self.headers.get('Content-Length', 0))
        raw = self.rfile.read(length)

        # 解析字段和文件
        fields = {}
        files = []
        for part in raw.split(b'--' + boundary):
            if not part or part == b'--':
                continue
            if part.endswith(b'--'):
                continue
            part = part.lstrip(b'\r\n')
            header_end = part.find(b'\r\n\r\n')
            if header_end < 0:
                continue
            headers = part[:header_end].decode('utf-8', errors='replace')
            body = part[header_end+4:]
            if body.endswith(b'\r\n'):
                body = body[:-2]

            # 找 name=
            name_match = re.search(r'name="([^"]+)"', headers)
            if not name_match:
                continue
            name = name_match.group(1)

            if 'filename=' in headers:
                fname = re.search(r'filename="([^"]+)"', headers).group(1)
                if fname.endswith('.mca'):
                    files.append((fname, body))
            else:
                fields[name] = body.decode('utf-8', errors='replace')

        if not files:
            self.send_json(400, {'error': '请上传 .mca 文件'})
            return

        prefix = fields.get('prefix', 'world')
        max_size = int(fields.get('max_size', 100)) * 1024

        # 写入临时目录
        with tempfile.TemporaryDirectory() as tmpdir:
            for fname, data in files:
                (Path(tmpdir) / fname).write_bytes(data)

            # 转换
            try:
                old_cwd = os.getcwd()
                os.chdir(SERVER_DIR)
                prefix_path = str(OUTPUT_DIR / prefix)
                result = do_convert(tmpdir, prefix_path, max_size)
                os.chdir(old_cwd)
                print(f"[SERVER] convert result: {result} schems")
            except Exception as e:
                os.chdir(old_cwd)
                import traceback
                traceback.print_exc()
                self.send_json(500, {'error': str(e)})
                return

        # 收集输出文件
        out_files = []
        for f in sorted(OUTPUT_DIR.glob(f"{prefix}*.bloxdschem")):
            out_files.append({'name': f.name, 'size': f.stat().st_size})
        
        print(f"[SERVER] output files: {len(out_files)}")
        
        if not out_files:
            self.send_json(400, {'error': '转换成功但没有输出文件 (方块数为0, 可能是MCA文件里没有匹配的方块)'})
            return

        self.send_json(200, {'files': out_files})

    def serve_file(self, path, ctype):
        if not path.exists():
            self.send_error(404)
            return
        data = path.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_json(self, code, obj):
        data = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()

    print(f"""
╔═══════════════════════════════════════╗
║   MCA → Bloxd 蓝图转换器 Web 服务    ║
╠═══════════════════════════════════════╣
║   访问: http://localhost:{args.port}            ║
║   Ctrl+C 停止                         ║
╚═══════════════════════════════════════╝
""")

    server = HTTPServer(('0.0.0.0', args.port), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止")
        server.server_close()
