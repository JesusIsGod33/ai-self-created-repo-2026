import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';

export function normalizeUrlEndpoint(rawUrl, baseHref) {
  const u = new URL(rawUrl, baseHref);
  u.hash = '';
  if (u.pathname !== '/' && u.pathname.endsWith('/')) {
    u.pathname = u.pathname.replace(/\/+$/, '');
  }
  return u.href;
}

function defaultHttpFetch(targetHref, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const visitedHops = new Set();

    function hop(currentHref, remaining) {
      if (visitedHops.has(currentHref) || remaining < 0) {
        reject(new Error('Redirect loop or limit exceeded for ' + currentHref));
        return;
      }
      visitedHops.add(currentHref);

      const u = new URL(currentHref);
      const client = u.protocol === 'https:' ? https : http;
      const req = client.request(
        {
          hostname: u.hostname === 'localhost' ? '127.0.0.1' : u.hostname,
          port: Number(u.port) || (u.protocol === 'https:' ? 443 : 80),
          path: (u.pathname || '/') + (u.search || ''),
          method: 'GET',
          family: 4,
          headers: {
            Host: u.host,
            Connection: 'close',
            'User-Agent': 'M2M-Mirror-Agent/1.0'
          }
        },
        (res) => {
          const status = res.statusCode || 0;
          if ([301, 302, 307, 308].includes(status) && res.headers.location) {
            res.resume();
            const nextHref = new URL(res.headers.location, currentHref).href;
            hop(nextHref, remaining - 1);
            return;
          }
          const chunks = [];
          res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
          res.on('end', () => {
            resolve({
              status,
              resolvedUrl: currentHref,
              headers: res.headers || {},
              body: Buffer.concat(chunks).toString('utf8')
            });
          });
        }
      );

      req.setTimeout(2500, () => {
        req.destroy(new Error('Request timed out for ' + currentHref));
      });
      req.on('error', reject);
      req.end();
    }

    hop(targetHref, maxRedirects);
  });
}

export async function requestUrl(targetHref, fetcher = defaultHttpFetch) {
  const res = await fetcher(targetHref);
  const headers = res.headers || {};
  const contentType = res.contentType || headers['content-type'] || headers['Content-Type'] || '';
  return {
    status: Number(res.status || 0),
    resolvedUrl: res.resolvedUrl || targetHref,
    contentType,
    body: String(res.body ?? '')
  };
}

export async function validateEndpointStatus(href, fetcher = defaultHttpFetch) {
  try {
    const res = await requestUrl(href, fetcher);
    const ok = [200, 301, 302, 307, 308].includes(res.status);
    return { ok, status: res.status, resolvedUrl: res.resolvedUrl };
  } catch (err) {
    return { ok: false, status: 0, error: err.message, resolvedUrl: href };
  }
}

function extractAssetRefs(sourceText, baseHref, origin) {
  const refs = new Set();
  const patterns = [
    /(?:href|src)=["']([^"']+)["']/gi,
    /import\s+(?:[^"']+\s+from\s+)?["']([^"']+)["']/gi,
    /url\(\s*["']?([^"')]+)["']?\s*\)/gi
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(sourceText)) !== null) {
      const raw = (m[1] || '').trim();
      if (!raw || raw.startsWith('data:') || raw.startsWith('mailto:') || raw.startsWith('javascript:')) {
        continue;
      }
      try {
        const normalized = normalizeUrlEndpoint(raw, baseHref);
        if (new URL(normalized).origin === origin) {
          refs.add(normalized);
        }
      } catch {
        // Ignore invalid URLs
      }
    }
  }
  return [...refs];
}

function urlToRelativePath(href) {
  const u = new URL(href);
  let p = u.pathname || '/';
  if (p === '/' || p.endsWith('/')) {
    p += 'index.html';
  }
  if (!path.extname(p)) {
    p += '.html';
  }
  return p.replace(/^\/+/, '');
}

export async function runMirror(rootUrl, rootOutDir = 'mirrored-iterations', fetcher = defaultHttpFetch) {
  const outRoot = path.resolve(rootOutDir);
  const baseNormalized = normalizeUrlEndpoint(rootUrl);
  const parsedBase = new URL(baseNormalized);
  const slug = parsedBase.hostname.replace(/[^a-z0-9.-]+/gi, '_') + '_' + Date.now();
  const runDir = path.join(outRoot, slug);
  const mirrorDir = path.join(runDir, 'source-mirror');
  const iterationDir = path.join(runDir, 'custom-iteration');

  fs.mkdirSync(mirrorDir, { recursive: true });
  fs.mkdirSync(iterationDir, { recursive: true });

  const visited = new Set();
  const queue = [baseNormalized];
  const manifest = [];

  while (queue.length > 0 && visited.size < 60) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    let res;
    try {
      res = await requestUrl(current, fetcher);
    } catch (err) {
      manifest.push({
        url: current,
        status: 0,
        validated: false,
        saved: false,
        error: err.message
      });
      continue;
    }

    const valid = [200, 301, 302, 307, 308].includes(res.status);
    if (!valid) {
      manifest.push({
        url: current,
        status: res.status,
        validated: false,
        saved: false
      });
      continue;
    }

    const relPath = urlToRelativePath(res.resolvedUrl);
    const destPath = path.join(mirrorDir, relPath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, res.body, 'utf8');

    manifest.push({
      url: current,
      normalizedUrl: normalizeUrlEndpoint(res.resolvedUrl),
      status: res.status,
      validated: true,
      saved: true,
      contentType: res.contentType,
      savedFile: path.relative(runDir, destPath)
    });

    const discovered = extractAssetRefs(res.body, res.resolvedUrl, parsedBase.origin);
    for (const nextHref of discovered) {
      if (!visited.has(nextHref) && !queue.includes(nextHref)) {
        queue.push(nextHref);
      }
    }
  }

  const manifestObj = {
    sourceUrl: baseNormalized,
    mirroredAt: new Date().toISOString(),
    validatedEndpoints: manifest.filter((m) => m.validated).length,
    savedFiles: manifest.filter((m) => m.saved).length,
    entries: manifest
  };

  fs.writeFileSync(path.join(runDir, 'source-manifest.json'), JSON.stringify(manifestObj, null, 2), 'utf8');
  fs.writeFileSync(
    path.join(iterationDir, 'index.html'),
    '<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>M2M Iteration - ' +
      parsedBase.hostname +
      '</title><link rel="stylesheet" href="./iteration.css"/></head><body><h1>M2M Mirrored Workspace</h1><p>Source: ' +
      baseNormalized +
      '</p><pre id="m2m-manifest"></pre><script type="module" src="./iteration.js"></script></body></html>\n',
    'utf8'
  );
  fs.writeFileSync(
    path.join(iterationDir, 'iteration.css'),
    'body{font-family:system-ui,sans-serif;background:#0b1120;color:#f8fafc;padding:2rem;}pre{background:#111c33;padding:1rem;border-radius:8px;overflow:auto;}\n',
    'utf8'
  );
  fs.writeFileSync(
    path.join(iterationDir, 'iteration.js'),
    "fetch('../source-manifest.json').then((r) => r.json()).then((d) => { const el = document.getElementById('m2m-manifest'); if (el) el.textContent = JSON.stringify(d, null, 2); });\n",
    'utf8'
  );

  return runDir;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isDirectRun) {
  const targetArg = process.argv[2];
  const outRoot = process.argv[3] || 'mirrored-iterations';
  if (!targetArg) {
    console.error('Usage: node scripts/mirror-url-iteration.mjs <https://target-url> [output-dir]');
    process.exit(1);
  }
  runMirror(targetArg, outRoot)
    .then((dir) => {
      console.log('Mirrored workspace ready at ' + dir);
    })
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
