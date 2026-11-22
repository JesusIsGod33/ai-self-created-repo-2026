// Stripe webhook. REQUIRES the raw body (Buffer): mount with express.raw() BEFORE express.json().
import crypto from 'node:crypto';
import { decrementInventoryUnlocked } from './catalog-service.js';
import { appendEvent, loadOrders } from './order-ledger.js';
import { safeEqual, withLock } from './util.js';

export function verifyStripeSignature(rawBody, header, secret, { toleranceSec = 300, now = Date.now() } = {}) {
  if (typeof header !== 'string' || !header) return { ok: false, reason: 'missing_signature' };
  let t = null;
  const v1 = [];
  for (const part of header.split(',')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim(), val = part.slice(i + 1).trim();
    if (k === 't') t = val;
    else if (k === 'v1') v1.push(val);
  }
  if (!t || !/^\d+$/.test(t) || !v1.length) return { ok: false, reason: 'malformed_header' };
  if (Math.abs(now / 1000 - Number(t)) > toleranceSec) return { ok: false, reason: 'timestamp_out_of_tolerance' };
  const expected = crypto.createHmac('sha256', secret).update(`${t}.`).update(rawBody).digest('hex');
  return v1.some((s) => safeEqual(s, expected)) ? { ok: true } : { ok: false, reason: 'bad_signature' };
}

async function processEvent(event) {
  const type = event?.type;
  if (type !== 'checkout.session.completed' && type !== 'payment_intent.succeeded') return {};
  const obj = event?.data?.object || {};
  let orderNumber, amount, sessionId = null, paymentIntent = null;
  if (type === 'checkout.session.completed') {
    if (obj.payment_status !== 'paid') return {}; // async methods: wait for a paid event
    orderNumber = obj.client_reference_id || obj.metadata?.orderNumber;
    amount = obj.amount_total;
    sessionId = obj.id;
    paymentIntent = obj.payment_intent || null;
  } else {
    orderNumber = obj.metadata?.orderNumber;
    amount = obj.amount_received ?? obj.amount;
    paymentIntent = obj.id;
  }
  if (typeof orderNumber !== 'string') return {};

  const order = (await loadOrders()).get(orderNumber);
  if (!order) { console.warn('[webhook] event for unknown order', orderNumber); return {}; }
  if (order.status !== 'pending') return { orderNumber }; // idempotent replay / already handled

  let problem = null;
  if (sessionId && order.stripeSessionId && sessionId !== order.stripeSessionId) problem = 'session_mismatch';
  else if (amount !== order.pricing.totalCents) problem = `amount_mismatch (expected ${order.pricing.totalCents}, got ${amount})`;
  else if (obj.currency && String(obj.currency).toLowerCase() !== 'usd') problem = 'currency_mismatch';

  if (problem) {
    console.error('[webhook] order flagged for review:', orderNumber, problem);
    await appendEvent(orderNumber, 'review', { reason: problem });
    return { orderNumber };
  }
  await appendEvent(orderNumber, 'paid', { paymentIntent, stripeSessionId: sessionId });
  const oversold = await decrementInventoryUnlocked(order.lines);
  if (oversold.length) await appendEvent(orderNumber, 'oversold', { items: oversold });
  return { orderNumber };
}

export async function handleStripeWebhook(req, res) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).json({ received: false, error: 'Webhook not configured' });
  }
  if (!Buffer.isBuffer(req.body)) {
    console.error('[webhook] raw body missing - mount /api/webhooks/stripe (express.raw) BEFORE express.json()');
    return res.status(500).json({ received: false, error: 'Webhook misconfigured' });
  }
  const sig = verifyStripeSignature(req.body, req.get('stripe-signature'), secret);
  if (!sig.ok) return res.status(400).json({ received: false, error: 'Invalid signature' });

  let event;
  try { event = JSON.parse(req.body.toString('utf8')); } catch { return res.status(400).json({ received: false, error: 'Invalid JSON' }); }

  const { orderNumber } = await withLock(() => processEvent(event));
  res.status(200).json({ received: true, ...(orderNumber ? { orderNumber } : {}) });
}
