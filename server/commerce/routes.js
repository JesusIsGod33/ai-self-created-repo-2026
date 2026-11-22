// mountCommerce(app) - call it BEFORE app.use(express.json()) so the Stripe webhook gets a raw body.
import express from 'express';
import { listProducts } from './catalog-service.js';
import { calculateCart } from './cart-engine.js';
import { createCheckoutSession } from './checkout-stripe.js';
import { handleStripeWebhook } from './webhook-handler.js';
import { downloadHandler, downloadsForOrder } from './digital-delivery.js';
import { getOrder } from './order-ledger.js';
import { HttpError, asyncRoute, errorMiddleware, safeEqual } from './util.js';

export function mountCommerce(app) {
  const router = express.Router();
  const json = express.json({ limit: '100kb' });

  router.post('/api/webhooks/stripe', express.raw({ type: 'application/json', limit: '1mb' }), asyncRoute(handleStripeWebhook));

  router.get('/api/products', asyncRoute(async (req, res) => {
    const products = await listProducts(req.query);
    res.json({ success: true, count: products.length, products });
  }));

  router.post('/api/cart/calculate', json, asyncRoute(async (req, res) => {
    const { lines, zoneId, ...totals } = await calculateCart(req.body);
    res.json({ ...totals, lines: lines.map(({ sku, title, variantName, quantity, unitCents, lineCents }) => ({ sku, title, variantName, quantity, unitCents, lineCents })) });
  }));

  router.post('/api/checkout/session', json, asyncRoute(async (req, res) => {
    res.json(await createCheckoutSession(req.body));
  }));

  router.get('/api/downloads/:token', asyncRoute(downloadHandler));

  // Order page / post-purchase vault. Needs the per-order access key (?k=) from the success URL.
  router.get('/api/orders/:orderNumber', asyncRoute(async (req, res) => {
    const order = await getOrder(String(req.params.orderNumber));
    if (!order || typeof req.query.k !== 'string' || !safeEqual(req.query.k, order.accessToken)) throw new HttpError(404, 'Order not found');
    res.set('Cache-Control', 'private, no-store').json({
      success: true,
      orderNumber: order.orderNumber,
      status: order.status,
      paidAt: order.paidAt || null,
      fulfillment: order.fulfillment,
      tracking: order.tracking || null,
      pricing: order.pricing,
      lines: order.lines.map(({ sku, title, variantName, quantity, kind }) => ({ sku, title, variantName, quantity, kind })),
      downloads: downloadsForOrder(order),
    });
  }));

  router.use(errorMiddleware);
  app.use(router);
}
