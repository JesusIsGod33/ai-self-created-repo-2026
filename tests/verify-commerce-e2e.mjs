#!/usr/bin/env node
// End-to-end check of catalog, cart, checkout (mock Stripe), signed webhook, HMAC delivery, capacity.
// Runs against a throwaway data dir and its own server on 127.0.0.1:4081 - never touches real data.
import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.VERIFY_PORT || 4081);
const BASE = `http://127.0.0.1:${PORT}`;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'commerce-e2e-'));
const WH = 'whsec_test_' + crypto.randomBytes(8).toString('hex');
const DL = crypto.randomBytes(32).toString('hex');
const env = {
  ...process.env, NODE_ENV: 'test', PORT: String(PORT), PUBLIC_BASE_URL: BASE,
  COMMERCE_DATA_DIR: path.join(tmp, 'data'), COMMERCE_CONFIG_DIR: path.join(tmp, 'config'),
  STRIPE_WEBHOOK_SECRET: WH, DOWNLOAD_HMAC_SECRET: DL,
};
delete env.STRIPE_SECRET_KEY; // force mock checkout
Object.assign(process.env, { COMMERCE_DATA_DIR: env.COMMERCE_DATA_DIR, COMMERCE_CONFIG_DIR: env.COMMERCE_CONFIG_DIR, DOWNLOAD_HMAC_SECRET: DL });

let pass = 0, fail = 0, server;
const ok = (name, cond, detail = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : `  -> ${detail}`}`); };
const step = async (name, fn) => { try { await fn(); } catch (e) { fail++; console.log(`FAIL  ${name}  -> threw ${e.message}`); } };

async function api(method, p, { body, rawBody, headers = {} } = {}) {
  const payload = rawBody ?? (body !== undefined ? JSON.stringify(body) : undefined);
  const res = await fetch(BASE + p, {
    method, body: payload, signal: AbortSignal.timeout(2000),
    headers: { ...(payload !== undefined ? { 'content-type': 'application/json' } : {}), ...headers },
  });
  const buf = Buffer.from(await res.arrayBuffer());
  let json = null; try { json = JSON.parse(buf.toString('utf8')); } catch { /* binary */ }
  return { status: res.status, headers: res.headers, buf, json };
}
const sign = (body, secret = WH, t = Math.floor(Date.now() / 1000)) => `t=${t},v1=${crypto.createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')}`;
const evt = (type, object) => ({ id: 'evt_' + crypto.randomBytes(6).toString('hex'), object: 'event', type, data: { object } });
const paidEvent = (co, amount = co.amountTotalCents) => evt('checkout.session.completed', {
  id: co.sessionId, object: 'checkout.session', payment_status: 'paid', amount_total: amount, currency: 'usd',
  client_reference_id: co.orderNumber, metadata: { orderNumber: co.orderNumber }, payment_intent: 'pi_test_' + crypto.randomBytes(4).toString('hex'),
});
const webhook = (event, { pretty = false, t, secret } = {}) => {
  const body = pretty ? JSON.stringify(event, null, 2) : JSON.stringify(event);
  return api('POST', '/api/webhooks/stripe', { rawBody: body, headers: { 'content-type': 'application/json', 'stripe-signature': sign(body, secret, t) } });
};
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const checkout = (extra = {}) => api('POST', '/api/checkout/session', { body: { customerEmail: 'buyer@example.com', ...extra } });
const calc = (body) => api('POST', '/api/cart/calculate', { body });
const VEST = { sku: 'SEW-VEST-2T-PDF', quantity: 1 };

async function main() {
  const seed = spawnSync(process.execPath, [path.join(ROOT, 'scripts/seed-commerce-catalog.mjs')], { env, encoding: 'utf8' });
  ok('seed script exits 0', seed.status === 0, seed.stderr);

  server = spawn(process.execPath, [path.join(ROOT, 'server/commerce/dev-server.js')], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let serverErr = '';
  server.stderr.on('data', (d) => { serverErr += d; });
  for (let i = 0; i < 40; i++) { try { if ((await api('GET', '/api/health')).status === 200) break; } catch { /* retry */ } await new Promise((r) => setTimeout(r, 150)); }
  ok('server healthy on 127.0.0.1', (await api('GET', '/api/health')).status === 200, serverErr);
  ok('dev-server binds 127.0.0.1 only', fs.readFileSync(path.join(ROOT, 'server/commerce/dev-server.js'), 'utf8').includes("'127.0.0.1'"));

  const disc = await import(path.join(ROOT, 'server/commerce/discount-promo-engine.js'));
  ok('half-up: 1250 @ 15% = 188', disc.halfUpPercent(1250, 15) === 188);
  ok('half-up: 1 @ 50% = 1 (0.5 rounds up)', disc.halfUpPercent(1, 50) === 1);
  ok('half-up: 999 @ 15% = 150 (149.85)', disc.halfUpPercent(999, 15) === 150);

  await step('catalog', async () => {
    const r = await api('GET', '/api/products');
    ok('GET /api/products -> 5 products', r.status === 200 && r.json.count === 5, JSON.stringify(r.json)?.slice(0, 120));
    ok('ratings start at 0 / 0 reviews', r.json.products.every((p) => p.rating === 0 && p.reviewCount === 0));
    ok('digitalAssetPath not exposed publicly', r.json.products.every((p) => !('digitalAssetPath' in p)));
    const b = await api('GET', '/api/products?category=Bakery');
    ok('category filter', b.json.count === 1 && b.json.products[0].id === 'prod_bake_001');
    ok('search filter', (await api('GET', '/api/products?search=vest')).json.count === 1);
  });

  await step('cart', async () => {
    const r = await calc({ items: [VEST], promoCode: 'WELCOME15', destinationZip: '90210' });
    ok('WELCOME15 on $12.50 -> discount 188, total 1062', r.status === 200 && r.json.discountCents === 188 && r.json.totalCents === 1062 && r.json.shippingCents === 0 && r.json.taxCents === 0, JSON.stringify(r.json));
    ok('appliedPromo shape', r.json.appliedPromo?.code === 'WELCOME15' && r.json.appliedPromo?.discountPercent === 15);
    const bad = await calc({ items: [VEST], promoCode: 'NOPE' });
    ok('bad promo: 200 + promoError, no discount', bad.status === 200 && bad.json.promoError && bad.json.discountCents === 0);
    ok('unknown SKU -> 400', (await calc({ items: [{ sku: 'NOPE', quantity: 1 }] })).status === 400);
    ok('quantity 0 -> 400', (await calc({ items: [{ sku: VEST.sku, quantity: 0 }] })).status === 400);
    const tee = { sku: 'INS-TEE-BLK-M', quantity: 1 };
    ok('shipped order without ZIP -> 400', (await calc({ items: [tee] })).status === 400);
    const shipped = await calc({ items: [tee], destinationZip: '12345' });
    ok('tee ships: 3800 + 599 shipping = 4399', shipped.json.shippingCents === 599 && shipped.json.totalCents === 4399, JSON.stringify(shipped.json));
    const free = await calc({ items: [{ ...tee, quantity: 2 }], destinationZip: '12345' });
    ok('free shipping over $75', free.json.shippingCents === 0 && free.json.totalCents === 7600);
  });

  await step('bakery pickup + capacity', async () => {
    const box = (q, sku = 'WOKE-CK-12') => ({ sku, quantity: q });
    const pick = (date) => ({ method: 'local_pickup', date });
    const one = await calc({ items: [box(1)], fulfillment: pick(day(1)) });
    ok('pickup: no ZIP needed, shipping 0', one.status === 200 && one.json.shippingCents === 0 && one.json.totalCents === 3600, JSON.stringify(one.json));
    const shipCookie = await calc({ items: [box(1)], destinationZip: '12345' });
    ok('cookies can ship too (+599)', shipCookie.json.totalCents === 4199);
    ok('20 boxes at capacity -> 200', (await calc({ items: [box(20)], fulfillment: pick(day(1)) })).status === 200);
    const over = await calc({ items: [box(21)], fulfillment: pick(day(1)) });
    ok('21 boxes -> 409 over daily capacity', over.status === 409 && over.json.remainingCapacity === 20, JSON.stringify(over.json));
    ok('11 party packs (22 units) -> 409', (await calc({ items: [box(11, 'WOKE-CK-24')], fulfillment: pick(day(1)) })).status === 409);
    ok('mixed pickup with tee -> 400', (await calc({ items: [box(1), { sku: 'INS-TEE-BLK-M', quantity: 1 }], fulfillment: pick(day(1)), destinationZip: '12345' })).status === 400);
    ok('past date -> 400', (await calc({ items: [box(1)], fulfillment: pick(day(-1)) })).status === 400);

    const co = await checkout({ cartItems: [box(15)], fulfillment: pick(day(1)) });
    ok('checkout 15 boxes for tomorrow', co.status === 200 && co.json.amountTotalCents === 54000, JSON.stringify(co.json));
    ok('6 more same day -> 409 (pending order holds capacity)', (await calc({ items: [box(6)], fulfillment: pick(day(1)) })).status === 409);
    ok('5 more same day -> 200', (await calc({ items: [box(5)], fulfillment: pick(day(1)) })).status === 200);
    ok('6 on a different day -> 200', (await calc({ items: [box(6)], fulfillment: pick(day(2)) })).status === 200);
    ok('webhook marks cookie order paid', (await webhook(paidEvent(co.json))).status === 200);
    const inv = (await api('GET', '/api/products?category=Bakery')).json.products[0].inventoryCount;
    ok('inventory decremented 45 -> 30', inv === 30, String(inv));
    ok('capacity still counted after payment', (await calc({ items: [box(6)], fulfillment: pick(day(1)) })).status === 409);
  });

  await step('checkout + webhook + delivery', async () => {
    const co = await checkout({ cartItems: [VEST], promoCode: 'WELCOME15' });
    ok('checkout 200, total 1062', co.status === 200 && co.json.amountTotalCents === 1062, JSON.stringify(co.json));
    ok('response has sessionId + checkoutUrl, NO client secret', co.json.sessionId?.startsWith('cs_') && co.json.checkoutUrl && !('paymentIntentClientSecret' in co.json));
    ok('bad email -> 400', (await checkout({ cartItems: [VEST], customerEmail: 'nope' })).status === 400);
    ok('bad promo at checkout -> 400', (await checkout({ cartItems: [VEST], promoCode: 'NOPE' })).status === 400);
    ok('client cannot set prices (extra fields ignored)', (await checkout({ cartItems: [{ ...VEST, priceCents: 1 }] })).json.amountTotalCents === 1250);

    const { orderNumber, orderAccessToken: k } = co.json;
    const pre = await api('GET', `/api/orders/${orderNumber}?k=${k}`);
    ok('order pending, no downloads yet', pre.json.status === 'pending' && pre.json.downloads.length === 0);

    const ev = paidEvent(co.json);
    const body = JSON.stringify(ev);
    ok('missing signature -> 400', (await api('POST', '/api/webhooks/stripe', { rawBody: body, headers: { 'content-type': 'application/json' } })).status === 400);
    ok('wrong secret -> 400', (await webhook(ev, { secret: 'whsec_wrong' })).status === 400);
    ok('stale timestamp -> 400', (await webhook(ev, { t: Math.floor(Date.now() / 1000) - 3600 })).status === 400);
    const tampered = body.replace('"amount_total":1062', '"amount_total":1');
    ok('tampered body -> 400', (await api('POST', '/api/webhooks/stripe', { rawBody: tampered, headers: { 'content-type': 'application/json', 'stripe-signature': sign(body) } })).status === 400);
    ok('still unpaid after rejected webhooks', (await api('GET', `/api/orders/${orderNumber}?k=${k}`)).json.status === 'pending');

    const w = await webhook(ev, { pretty: true }); // pretty-printed body: only verifies against the RAW bytes
    ok('valid signed webhook (raw bytes) -> 200 {received, orderNumber}', w.status === 200 && w.json.received === true && w.json.orderNumber === orderNumber, JSON.stringify(w.json));
    const replay = await webhook(ev);
    ok('replay is idempotent', replay.status === 200 && replay.json.orderNumber === orderNumber);
    ok('unrelated event type ignored with 200', (await webhook(evt('charge.refunded', { id: 'ch_1' }))).status === 200);

    ok('order page needs the right key', (await api('GET', `/api/orders/${orderNumber}?k=wrong`)).status === 404 && (await api('GET', `/api/orders/${orderNumber}`)).status === 404);
    const paid = await api('GET', `/api/orders/${orderNumber}?k=${k}`);
    ok('order paid with 1 download', paid.json.status === 'paid' && paid.json.downloads.length === 1, JSON.stringify(paid.json));
    const url = paid.json.downloads[0].url;
    const token = url.split('/').pop();

    const dl = await api('GET', url);
    ok('download 200 as PDF attachment', dl.status === 200 && dl.headers.get('content-type') === 'application/pdf' && /attachment; filename="utility-vest-2t-master\.pdf"/.test(dl.headers.get('content-disposition') || ''), `${dl.status} ${dl.headers.get('content-type')}`);
    ok('download body is the file', dl.buf.subarray(0, 5).toString() === '%PDF-');
    const decoded = Buffer.from(token.split('.')[0], 'base64url').toString();
    ok('token contains no file path', !/downloads|\.pdf|\.zip|\//.test(decoded), decoded);
    const [pl, sg] = token.split('.');
    ok('tampered signature -> 403', (await api('GET', `/api/downloads/${pl}.${sg.slice(0, -2)}AA`)).status === 403);
    const forged = Buffer.from(JSON.stringify({ v: 1, o: orderNumber, i: 0, iat: 0, exp: Date.now() + 1e9 })).toString('base64url');
    ok('forged payload with old signature -> 403', (await api('GET', `/api/downloads/${forged}.${sg}`)).status === 403);
    ok('garbage token -> 403', (await api('GET', '/api/downloads/not-a-token')).status === 403);
    const del = await import(path.join(ROOT, 'server/commerce/digital-delivery.js'));
    const old = del.issueToken({ orderNumber, lineIndex: 0, now: Date.now() - 25 * 3600 * 1000 });
    ok('token older than 24h -> 410', (await api('GET', `/api/downloads/${old}`)).status === 410);
    const unpaid = (await checkout({ cartItems: [VEST] })).json;
    const earlyTok = del.issueToken({ orderNumber: unpaid.orderNumber, lineIndex: 0 });
    ok('valid token for UNPAID order -> 403', (await api('GET', `/api/downloads/${earlyTok}`)).status === 403);
  });

  await step('amount mismatch', async () => {
    const co = (await checkout({ cartItems: [VEST] })).json;
    const w = await webhook(paidEvent(co, 1));
    ok('mismatched amount still 200 to Stripe', w.status === 200);
    const o = (await api('GET', `/api/orders/${co.orderNumber}?k=${co.orderAccessToken}`)).json;
    ok('flagged for review, NOT fulfilled', o.status === 'review' && o.downloads.length === 0, JSON.stringify(o));
  });
}

try { await main(); } catch (e) { fail++; console.log('FAIL  fatal:', e.stack); }
finally {
  if (server) server.kill('SIGTERM');
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
