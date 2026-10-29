#!/usr/bin/env python3
"""
AGIS 2026 Companion PWA Local Development Server
Theme: FRESH OIL — For Innovative Thinking
Powered by CCYI Global & Access Chapel

Usage:
  python3 serve.py [port]
"""

import http.server
import socketserver
import sys
import os
import mimetypes

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

# Ensure correct MIME types for PWA assets
mimetypes.add_type('application/manifest+json', '.json')
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('image/png', '.png')
mimetypes.add_type('image/svg+xml', '.svg')

class AGISHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add caching headers & PWA security headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

    def do_GET(self):
        # Redirect root to app.html or index.html
        if self.path in ('/app', '/app/'):
            self.send_response(302)
            self.send_header('Location', '/app.html')
            self.end_headers()
            return
        return super().do_GET()

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with socketserver.TCPServer(("", PORT), AGISHandler) as httpd:
        print("=" * 65)
        print("🚀 ACCELERATE GLOBAL IMPACT SUMMIT 2026")
        print("   Theme: FRESH OIL — For Innovative Thinking")
        print(f"   Companion App: http://localhost:{PORT}/app.html")
        print(f"   Summit Website: http://localhost:{PORT}/index.html")
        print("=" * 65)
        print(f"Serving HTTP on 0.0.0.0 port {PORT} (Ctrl+C to stop)...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down AGIS server.")
            httpd.server_close()
