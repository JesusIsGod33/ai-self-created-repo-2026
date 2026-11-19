import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { normalizeUrlEndpoint, validateEndpointStatus, runMirror } from '../scripts/mirror-url-iteration.mjs';

function createMockFetcher(routes) {
  return async (href) => {
    const u = new URL(href);
    const cleanPath = (u.pathname || '/').replace(/\/+$/, '') || '/';
    const route = routes[cleanPath];
    if (!route) {
      return { status: 404, resolvedUrl: href, contentType: 'text/plain', body: 'Not found' };
    }
    if (route.redirectTo) {
      const targetHref = new URL(route.redirectTo, href).href;
      const targetPath = (new URL(targetHref).pathname || '/').replace(/\/+$/, '') || '/';
      const dest = routes[targetPath] || { status: 200, contentType: 'text/html', body: '' };
      return {
        status: route.status || 301,
        resolvedUrl: targetHref,
        contentType: dest.contentType || 'text/html',
        body: dest.body || ''
      };
    }
    return {
      status: route.status || 200,
      resolvedUrl: href,
      contentType: route.contentType || 'text/html',
      body: route.body || ''
    };
  };
}

test('normalizes trailing slashes and validates HTTP 200 and 301 endpoints to true', async () => {
  const fetcher = createMockFetcher({
    '/legacy-path': { status: 301, redirectTo: '/canonical-path' },
    '/canonical-path': { status: 200, contentType: 'application/json', body: '{"status":"ok"}' }
  });
  const base = 'https://jobright.ai';

  const normSlash = normalizeUrlEndpoint(base + '/canonical-path/');
  assert.equal(normSlash, base + '/canonical-path');

  const check301 = await validateEndpointStatus(base + '/legacy-path/', fetcher);
  assert.equal(check301.ok, true);

  const check200 = await validateEndpointStatus(normSlash, fetcher);
  assert.equal(check200.ok, true);
});

test('mirrors linked HTML, CSS, and JS files and creates custom iteration starter', async () => {
  const fetcher = createMockFetcher({
    '/': {
      status: 200,
      contentType: 'text/html',
      body: '<html><head><link rel="stylesheet" href="/style.css"/><script type="module" src="/app.js"></script></head><body>Ready</body></html>'
    },
    '/style.css': { status: 200, contentType: 'text/css', body: 'body { color: #f8fafc; }' },
    '/app.js': { status: 200, contentType: 'application/javascript', body: 'export const ready = true;' }
  });

  const tempOut = fs.mkdtempSync(path.join(os.tmpdir(), 'url-mirror-'));

  try {
    const runDir = await runMirror('https://jobright.ai/', tempOut, fetcher);
    assert.equal(fs.existsSync(path.join(runDir, 'source-manifest.json')), true);
    assert.equal(fs.existsSync(path.join(runDir, 'source-mirror/index.html')), true);
    assert.equal(fs.existsSync(path.join(runDir, 'source-mirror/style.css')), true);
    assert.equal(fs.existsSync(path.join(runDir, 'source-mirror/app.js')), true);
    assert.equal(fs.existsSync(path.join(runDir, 'custom-iteration/index.html')), true);
  } finally {
    fs.rmSync(tempOut, { recursive: true, force: true });
  }
});
