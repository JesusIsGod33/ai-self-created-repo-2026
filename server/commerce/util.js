// Shared helpers: paths, atomic file writes, JSONL streaming, a process-wide lock, errors.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(process.env.COMMERCE_REPO_ROOT || path.join(HERE, '..', '..'));
export const DATA_DIR = path.resolve(process.env.COMMERCE_DATA_DIR || path.join(REPO_ROOT, 'data', 'commerce'));
export const CONFIG_DIR = path.resolve(process.env.COMMERCE_CONFIG_DIR || path.join(REPO_ROOT, 'config'));
export const DOWNLOADS_DIR = path.join(DATA_DIR, 'downloads');
export const ORDERS_FILE = path.join(DATA_DIR, 'orders.jsonl');
export const ASSET_PREFIX = 'data/commerce/downloads/';

export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export async function readJson(file, fallback) {
  try {
    return JSON.parse(await fsp.readFile(file, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT' && fallback !== undefined) return fallback;
    throw e;
  }
}

// Atomic write: .tmp -> fsync -> rename. Never leaves a half-written file behind.
export async function atomicWriteJson(file, data) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  const fh = await fsp.open(tmp, 'w', 0o600);
  try {
    await fh.writeFile(JSON.stringify(data, null, 2) + '\n');
    await fh.sync();
  } finally {
    await fh.close();
  }
  await fsp.rename(tmp, file);
}

// JSONL is append-only (O_APPEND), so single-line appends are the one non-rename write.
export async function appendJsonl(file, obj) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.appendFile(file, JSON.stringify(obj) + '\n', { mode: 0o600 });
}

// Stream a JSONL file line by line (low memory). Corrupt lines are skipped.
export async function* streamJsonl(file) {
  if (!fs.existsSync(file)) return;
  const rl = readline.createInterface({ input: fs.createReadStream(file, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of rl) {
    const t = line.trim();
    if (!t) continue;
    try { yield JSON.parse(t); } catch { console.warn('[commerce] skipped corrupt JSONL line'); }
  }
}

// Single-process mutex. NOT re-entrant: never call withLock from inside a withLock callback.
let chain = Promise.resolve();
export function withLock(fn) {
  const run = chain.then(() => fn());
  chain = run.catch(() => {});
  return run;
}

export function safeEqual(a, b) {
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

// All commerce dates (pickup / production days) are UTC calendar days: YYYY-MM-DD.
export const todayUtc = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);

export const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function errorMiddleware(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err instanceof HttpError) return res.status(err.status).json({ success: false, ...err.extra, error: err.message });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ success: false, error: 'Invalid JSON body' });
  if (err?.type === 'entity.too.large') return res.status(413).json({ success: false, error: 'Request body too large' });
  console.error('[commerce] unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal error' });
}
