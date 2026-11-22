// HMAC-signed, expiring download tokens. The token carries ONLY {order, line index, times}.
// The file path is always resolved server-side from the stored order line + catalog.
import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { ASSET_PREFIX, DOWNLOADS_DIR, HttpError, safeEqual } from './util.js';
import { findBySku, loadProducts } from './catalog-service.js';
import { appendEvent, getOrder } from './order-ledger.js';

export const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const FULFILLED = ['paid', 'shipped', 'picked_up'];
const MIME = { '.pdf': 'application/pdf', '.zip': 'application/zip' };

function secret() {
  const s = process.env.DOWNLOAD_HMAC_SECRET;
  if (!s || s.length < 32) throw new Error('DOWNLOAD_HMAC_SECRET must be set (32+ chars)');
  return s;
}
const sign = (b64) => crypto.createHmac('sha256', secret()).update(b64).digest('base64url');

export function issueToken({ orderNumber, lineIndex, now = Date.now(), ttlMs = TOKEN_TTL_MS }) {
  const payload = Buffer.from(JSON.stringify({ v: 1, o: orderNumber, i: lineIndex, iat: now, exp: now + ttlMs })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 512) return { ok: false, reason: 'malformed' };
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, reason: 'malformed' };
  const [payloadB64, sig] = parts;
  if (!safeEqual(sig, sign(payloadB64))) return { ok: false, reason: 'bad_signature' };
  let p;
  try { p = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')); } catch { return { ok: false, reason: 'malformed' }; }
  if (p?.v !== 1 || typeof p.o !== 'string' || !Number.isInteger(p.i) || !Number.isFinite(p.exp)) return { ok: false, reason: 'malformed' };
  if (now >= p.exp) return { ok: false, reason: 'expired' };
  return { ok: true, payload: p };
}

async function resolveAsset(relPath) {
  if (typeof relPath !== 'string' || !relPath.startsWith(ASSET_PREFIX)) throw new Error('bad asset path');
  const root = await fsp.realpath(DOWNLOADS_DIR);
  const abs = await fsp.realpath(path.resolve(DOWNLOADS_DIR, relPath.slice(ASSET_PREFIX.length)));
  if (!abs.startsWith(root + path.sep)) throw new Error('asset escapes downloads dir');
  return abs;
}

export async function downloadHandler(req, res) {
  const v = verifyToken(req.params.token);
  if (!v.ok) {
    if (v.reason === 'expired') throw new HttpError(410, 'Download link expired. Open your order page to get a fresh link.');
    throw new HttpError(403, 'Invalid download link');
  }
  const { o: orderNumber, i: lineIndex } = v.payload;
  const order = await getOrder(orderNumber);
  const line = order?.lines?.[lineIndex];
  if (!order || !FULFILLED.includes(order.status) || !line || line.kind !== 'digital') throw new HttpError(403, 'Invalid download link');

  const hit = findBySku(line.sku, await loadProducts());
  let file;
  try { file = await resolveAsset(hit?.product?.digitalAssetPath); } catch (e) {
    console.error('[delivery] asset unavailable for', orderNumber, line.sku, e.message);
    throw new HttpError(404, 'File is temporarily unavailable. Please contact support.');
  }
  const stat = await fsp.stat(file);
  const name = path.basename(file).replace(/["\\\r\n]/g, '_');
  res.status(200).set({
    'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Content-Length': String(stat.size),
    'Content-Disposition': `attachment; filename="${name}"`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  await appendEvent(orderNumber, 'download_issued', { sku: line.sku });
  await pipeline(fs.createReadStream(file), res);
}

export function downloadsForOrder(order, now = Date.now()) {
  if (!FULFILLED.includes(order.status)) return [];
  return order.lines
    .map((l, i) => (l.kind === 'digital' ? { lineIndex: i, sku: l.sku, title: l.title, url: `/api/downloads/${issueToken({ orderNumber: order.orderNumber, lineIndex: i, now })}`, expiresInSeconds: TOKEN_TTL_MS / 1000 } : null))
    .filter(Boolean);
}
