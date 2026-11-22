// Append-only order ledger (data/commerce/orders.jsonl). State is derived by streaming events.
import crypto from 'node:crypto';
import { ORDERS_FILE, appendJsonl, streamJsonl } from './util.js';

export const RESERVATION_MS = 30 * 60 * 1000; // unpaid checkouts hold stock for 30 minutes

export const appendEvent = (orderNumber, event, data = {}) =>
  appendJsonl(ORDERS_FILE, { ts: new Date().toISOString(), orderNumber, event, ...data });

export async function loadOrders() {
  const orders = new Map();
  for await (const e of streamJsonl(ORDERS_FILE)) {
    if (e.event === 'created') { orders.set(e.orderNumber, { ...e.order, status: 'pending' }); continue; }
    const o = orders.get(e.orderNumber);
    if (!o) continue;
    switch (e.event) {
      case 'session_created': o.stripeSessionId = e.sessionId; o.mock = !!e.mock; break;
      case 'paid': o.status = 'paid'; o.paidAt = e.ts; o.paymentIntent = e.paymentIntent || null; break;
      case 'review': o.status = 'review'; o.reviewReason = e.reason; break;
      case 'cancelled': o.status = 'cancelled'; break;
      case 'shipped': o.status = 'shipped'; o.shippedAt = e.ts; o.tracking = { carrier: e.carrier || null, trackingNumber: e.trackingNumber || null }; break;
      case 'picked_up': o.status = 'picked_up'; o.pickedUpAt = e.ts; break;
      default: break; // download_issued, oversold, ... are audit-only
    }
  }
  return orders;
}

export async function getOrder(orderNumber) {
  return (await loadOrders()).get(orderNumber) || null;
}

export function newOrderNumber(orders) {
  for (;;) {
    const n = `ORD-${new Date().getUTCFullYear()}-${crypto.randomInt(100000, 1000000)}`;
    if (!orders.has(n)) return n;
  }
}

/**
 * reservedUnits: units of the product held by unpaid-but-live checkouts or orders under review
 *                (paid orders have already been subtracted from inventoryCount).
 * dateUnits:     capacity units already committed for `date` (live pending + paid orders).
 */
export function countCommitted(orders, productId, date, now = Date.now()) {
  let reservedUnits = 0, dateUnits = 0;
  for (const o of orders.values()) {
    const live = o.status === 'pending'
      ? now - Date.parse(o.createdAt) < RESERVATION_MS
      : ['paid', 'shipped', 'picked_up', 'review'].includes(o.status);
    if (!live) continue;
    for (const l of o.lines) {
      if (l.productId !== productId) continue;
      if (o.status === 'pending' || o.status === 'review') reservedUnits += l.quantity;
      if (date && o.fulfillment?.date === date) dateUnits += l.quantity * (l.capacityUnits || 1);
    }
  }
  return { reservedUnits, dateUnits };
}
