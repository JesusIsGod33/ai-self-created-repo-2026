import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { routeRequest } from './api/router.js';
import { createStore } from './domain/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

export function sendJson(res, statusCode, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  res.end(body);
}

export function sendText(res, statusCode, text, contentType = 'text/plain; charset=utf-8', extraHeaders = {}) {
  const body = String(text ?? '');
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  res.end(body);
}

export async function readJsonBody(req, maxBytes = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        const err = new Error('Request payload exceeds maximum allowed size');
        err.statusCode = 413;
        req.destroy(err);
        reject(err);
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      const raw = Buffer.concat(chunks).toString('utf-8').trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        const err = new Error('Malformed JSON request body');
        err.statusCode = 400;
        reject(err);
      }
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

async function serveStaticFile(reqPath, res) {
  const sanitized = reqPath === '/' ? '/index.html' : reqPath;
  const decoded = decodeURIComponent(sanitized);
  const resolvedPath = path.resolve(PUBLIC_DIR, `.${decoded}`);

  if (!resolvedPath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { error: 'Forbidden path' });
    return true;
  }

  try {
    const stat = await fs.stat(resolvedPath);
    const targetFile = stat.isDirectory() ? path.join(resolvedPath, 'index.html') : resolvedPath;
    const data = await fs.readFile(targetFile);
    const ext = path.extname(targetFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': data.length,
      'Cache-Control': 'no-cache'
    });
    res.end(data);
    return true;
  } catch (err) {
    if (err && (err.code === 'ENOENT' || err.code === 'ENOTDIR')) {
      return false;
    }
    throw err;
  }
}

export function createAppServer(options = {}) {
  const store = options.store || createStore(options.initialProfile);

  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const hostHeader = req.headers.host || '127.0.0.1';
    const parsedUrl = new URL(req.url || '/', `http://${hostHeader}`);
    const pathname = parsedUrl.pathname;

    try {
      if (pathname === '/health' || pathname === '/healthz' || pathname.startsWith('/api/')) {
        const handled = await routeRequest({
          req,
          res,
          url: parsedUrl,
          pathname,
          store,
          sendJson,
          sendText,
          readJsonBody
        });
        if (handled !== false) {
          return;
        }
      }

      if (req.method === 'GET' || req.method === 'HEAD') {
        const served = await serveStaticFile(pathname, res);
        if (served) {
          return;
        }
      }

      sendJson(res, 404, {
        error: 'Not Found',
        method: req.method,
        path: pathname
      });
    } catch (err) {
      const statusCode = Number.isInteger(err?.statusCode) ? err.statusCode : 500;
      sendJson(res, statusCode, {
        error: err?.message || 'Internal Server Error'
      });
    }
  });

  server.store = store;
  return server;
}

export async function startServer(options = {}) {
  const port = options.port !== undefined ? Number(options.port) : Number(process.env.PORT || 3000);
  const host = options.host || process.env.HOST || '0.0.0.0';
  const server = createAppServer(options);

  await new Promise((resolve, reject) => {
    const onError = (err) => {
      server.off('listening', onListening);
      reject(err);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);

const pathComplexUi = require("path").resolve(process.cwd(), "ui/complex-console");
if (typeof app !== "undefined" && typeof app.use === "function") {
  app.use("/ui/complex-console", require("express").static(pathComplexUi));
  app.get("/ui/complex-console", (req, res) => res.sendFile(require("path").join(pathComplexUi, "index.html")));
}
    server.listen(port, host);
  });

  const addr = server.address();
  const boundPort = typeof addr === 'object' && addr ? addr.port : port;
  const displayHost = host === '0.0.0.0' ? '127.0.0.1' : host;

  return {
    server,
    store: server.store,
    host,
    port: boundPort,
    url: `http://${displayHost}:${boundPort}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      })
  };
}

const isEntrypoint =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isEntrypoint) {
  startServer()
    .then(({ url }) => {
      console.log(`Grounded Career Studio: ${url}`);
    })
    .catch((err) => {
      console.error('Failed to start Grounded Career Studio server:', err);
      process.exitCode = 1;
    });
}

export default createAppServer;
