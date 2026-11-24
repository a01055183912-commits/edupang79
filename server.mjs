// Railway 등 서버형 호스팅용 정적 파일 서버. 의존성 없음. 공개할 파일만 허용 목록으로 제공한다.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const PORT = Number(process.env.PORT) || 8080;
const FILES = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/study.html': ['study.html', 'text/html; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/study-data.js': ['study-data.js', 'text/javascript; charset=utf-8'],
  '/pack.js': ['pack.js', 'text/javascript; charset=utf-8'],
  '/course-data.js': ['course-data.js', 'text/javascript; charset=utf-8'],
  '/manifest.webmanifest': ['manifest.webmanifest', 'application/manifest+json; charset=utf-8'],
  '/sw.js': ['sw.js', 'text/javascript; charset=utf-8'],
  '/icons/icon.svg': ['icons/icon.svg', 'image/svg+xml'],
  '/icons/icon-192.png': ['icons/icon-192.png', 'image/png'],
  '/icons/icon-512.png': ['icons/icon-512.png', 'image/png'],
  '/icons/icon-maskable-512.png': ['icons/icon-maskable-512.png', 'image/png'],
  '/icons/apple-touch-icon.png': ['icons/apple-touch-icon.png', 'image/png'],
  '/data/notices.json': ['data/notices.json', 'application/json; charset=utf-8'],
};

createServer(async (req, res) => {
  const path = new URL(req.url, 'http://x').pathname;
  const hit = FILES[path];
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
  if (!hit) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found'); return; }
  try {
    const body = await readFile(new URL(hit[0], import.meta.url));
    res.writeHead(200, { 'Content-Type': hit[1], 'Cache-Control': (path.endsWith('.json') || path === '/sw.js') ? 'no-cache' : 'public, max-age=300' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Server error'); }
}).listen(PORT, '0.0.0.0', () => console.log(`listening on port ${PORT}`));
