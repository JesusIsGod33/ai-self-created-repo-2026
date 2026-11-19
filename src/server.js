import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { routeApi } from './api/router.js';

const publicDir = fileURLToPath(new URL('./public/', import.meta.url));
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };

export function createApp() {
  return createServer(async (req, res) => {
    try {
      if (req.url?.startsWith('/api/')) return await routeApi(req, res);
      const pathname = new URL(req.url || '/', 'http://localhost').pathname;
      const relative = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
      const target = resolve(publicDir, `.${relative}`);
      if (target !== publicDir && !target.startsWith(`${publicDir}${sep}`)) return send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
      const body = await readFile(target);
      res.writeHead(200, { 'content-type': mime[extname(target)] || 'application/octet-stream', 'x-content-type-options': 'nosniff', 'cache-control': 'no-store', 'content-security-policy': "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'" });
      res.end(body);
    } catch (error) {
      if (error.code === 'ENOENT') return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
      console.error(error);
      send(res, 500, 'Internal server error', 'text/plain; charset=utf-8');
    }
  });
}

function send(res, status, body, type) { res.writeHead(status, { 'content-type': type, 'x-content-type-options': 'nosniff' }); res.end(body); }

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const port = Number(process.env.PORT || 3000);
  createApp().listen(port, '0.0.0.0', () => console.log(`Grounded Career Studio: http://127.0.0.1:${port}`));
}
