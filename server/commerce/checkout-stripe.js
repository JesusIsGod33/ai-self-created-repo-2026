// Hosted Stripe Checkout. Prices are ALWAYS computed server-side from the catalog.
// No STRIPE_SECRET_KEY + non-production => mock session (for local dev/tests).
import crypto from 'node:crypto';
import { calculateCart } from './cart-engine.js';
import { appendEvent, loadOrders, newOrderNumber } from './order-ledger.js';
import { HttpError, withLock } from './util.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_TOTAL_CENTS = 50; // Stripe's minimum charge (USD)

function flatten(val, prefix, out) {
  if (Array.isArray(val)) val.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
  else if (val && typeof val === 'object') for (const [k, v] of Object.entries(val)) flatten(v, prefix ? `${prefix}[${k}]` : k, out);
  else if (val !== undefined && val !== null) out.push([prefix, String(val)]);
}
export const encodeForm = (obj) => { const out = []; flatten(obj, '', out); return new URLSearchParams(out).toString(); };

async function stripePost(pathname, params, idempotencyKey) {
  const res = await fetch(`https://api.stripe.com${pathname}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: encodeForm(params),
    signal: AbortSignal.timeout(3000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[stripe]', pathname, res.status, json?.error?.type, json?.error?.code);
    throw new HttpError(502, 'Payment provider error. Please try again.');
  }
  return json;
}

export async function createCheckoutSession(body, { baseUrl = process.env.PUBLIC_BASE_URL || 'http://127.0.0.1:4080' } = {}) {
  const email = typeof body?.customerEmail === 'string' ? body.customerEmail.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email) || email.length > 254) throw new HttpError(400, 'A valid customerEmail is required');

  const live = !!process.env.STRIPE_SECRET_KEY;
  if (!live && process.env.NODE_ENV === 'production') throw new HttpError(503, 'Payments are not configured');

  // Re-validate + reserve stock atomically (calculate and record under one lock).
  const order = await withLock(async () => {
    const calc = await calculateCart({
      items: body.cartItems ?? body.items,
      promoCode: body.promoCode,
      destinationZip: body.destinationZip,
      fulfillment: body.fulfillment,
    });
    if (calc.promoError) throw new HttpError(400, calc.promoError);
    if (calc.totalCents < MIN_TOTAL_CENTS) throw new HttpError(400, 'Order total is below the minimum chargeable amount');
    const orderNumber = newOrderNumber(await loadOrders());
    const o = {
      orderNumber,
      createdAt: new Date().toISOString(),
      customerEmail: email,
      accessToken: crypto.randomBytes(24).toString('hex'),
      destinationZip: calc.destinationZip,
      promoCode: calc.appliedPromo?.code ?? null,
      fulfillment: calc.fulfillment,
      lines: calc.lines,
      pricing: {
        subtotalCents: calc.subtotalCents, discountCents: calc.discountCents, taxCents: calc.taxCents,
        shippingCents: calc.shippingCents, totalCents: calc.totalCents, currency: 'USD',
      },
    };
    await appendEvent(orderNumber, 'created', { order: o });
    return o;
  });

  try {
    let sessionId, checkoutUrl;
    if (!live) {
      sessionId = `cs_test_mock_${crypto.randomBytes(8).toString('hex')}`;
      checkoutUrl = `${baseUrl}/mock-checkout/${sessionId}`;
    } else {
      const p = order.pricing;
      const lineItems = order.lines.map((l) => ({
        quantity: l.quantity,
        price_data: { currency: 'usd', unit_amount: l.unitCents, product_data: { name: `${l.title} - ${l.variantName}`.slice(0, 250) } },
      }));
      if (p.shippingCents) lineItems.push({ quantity: 1, price_data: { currency: 'usd', unit_amount: p.shippingCents, product_data: { name: 'Shipping' } } });
      if (p.taxCents) lineItems.push({ quantity: 1, price_data: { currency: 'usd', unit_amount: p.taxCents, product_data: { name: 'Sales tax' } } });

      const params = {
        mode: 'payment',
        customer_email: email,
        client_reference_id: order.orderNumber,
        metadata: { orderNumber: order.orderNumber },
        payment_intent_data: { metadata: { orderNumber: order.orderNumber } },
        line_items: lineItems,
        success_url: `${baseUrl}/?order=${order.orderNumber}&k=${order.accessToken}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/?checkout=cancelled`,
        expires_at: Math.floor(Date.now() / 1000) + 31 * 60, // Stripe minimum is 30 min
      };
      if (p.discountCents > 0) {
        const coupon = await stripePost('/v1/coupons', {
          amount_off: p.discountCents, currency: 'usd', duration: 'once', max_redemptions: 1, name: (order.promoCode || 'Discount').slice(0, 40),
        }, `coupon-${order.orderNumber}`);
        params.discounts = [{ coupon: coupon.id }];
      }
      const session = await stripePost('/v1/checkout/sessions', params, `session-${order.orderNumber}`);
      sessionId = session.id;
      checkoutUrl = session.url;
    }
    await appendEvent(order.orderNumber, 'session_created', { sessionId, mock: !live });
    return {
      sessionId,
      checkoutUrl,
      amountTotalCents: order.pricing.totalCents,
      orderNumber: order.orderNumber,
      orderAccessToken: order.accessToken,
      ...(live ? {} : { mock: true }),
    };
  } catch (err) {
    await appendEvent(order.orderNumber, 'cancelled', { reason: 'session_creation_failed' }).catch(() => {});
    throw err;
  }
}
