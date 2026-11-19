import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { routeApi } from './api/router.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(here, 'public');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function send(res, status, body, type) {
  res.writeHead(status, {
    'content-type': `${type}; charset=utf-8`,
    'x-content-type-options': 'nosniff'
  });
  res.end(body);
}

const server = createServer(async (req, res) => {
  try {
    if (req.url?.startsWith('/api/')) return await routeApi(req, res);
    const pathname = new URL(req.url || '/', 'http://localhost').pathname;
    const requested = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
    const safePath = normalize(join(publicDir, requested));
    if (!safePath.startsWith(publicDir)) return send(res, 403, 'Forbidden', 'text/plain');
    const body = await readFile(safePath);
    res.writeHead(200, {
      'content-type': types[extname(safePath)] || 'application/octet-stream',
      'x-content-type-options': 'nosniff',
      'cache-control': 'no-store'
    });
    res.end(body);
  } catch (error) {
    if (error.code === 'ENOENT') return send(res, 404, 'Not found', 'text/plain');
    console.error(error);
    send(res, 500, 'Internal server error', 'text/plain');
  }
});

const port = Number(process.env.PORT || 3000);
server.listen(port, '127.0.0.1', () => {
  console.log(`Grounded Career Studio: http://127.0.0.1:${port}`);
});
