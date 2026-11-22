import { findBySku, loadProducts } from './catalog-service.js';
import { evaluatePromo } from './discount-promo-engine.js';
import { calculateTaxShipping } from './tax-shipping-calculator.js';
import { countCommitted, loadOrders } from './order-ledger.js';
import { HttpError, todayUtc } from './util.js';

const MAX_LINES = 25;
const MAX_QTY = 50;
const METHODS = ['physical_ship', 'local_pickup'];
const DAY_MS = 86400000;

// round(a * b / c) half-up, integers only
const ratioHalfUp = (a, b, c) => (c === 0 ? 0 : Math.floor((a * b * 2 + c) / (2 * c)));

function resolveDate(raw, now) {
  const today = todayUtc(now);
  const date = raw ?? today;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    throw new HttpError(400, 'fulfillment.date must be YYYY-MM-DD');
  }
  if (date < today) throw new HttpError(400, 'fulfillment.date cannot be in the past');
  if (Date.parse(date) - Date.parse(today) > 30 * DAY_MS) throw new HttpError(400, 'fulfillment.date must be within 30 days');
  return date;
}

export async function calculateCart({ items, promoCode, destinationZip, fulfillment } = {}, { now = Date.now() } = {}) {
  if (!Array.isArray(items) || !items.length) throw new HttpError(400, 'items must be a non-empty array');
  if (items.length > MAX_LINES) throw new HttpError(400, `At most ${MAX_LINES} line items`);

  const qtyBySku = new Map();
  for (const it of items) {
    if (typeof it?.sku !== 'string' || !Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > MAX_QTY) {
      throw new HttpError(400, `Each item needs a sku and an integer quantity between 1 and ${MAX_QTY}`);
    }
    const q = (qtyBySku.get(it.sku) || 0) + it.quantity;
    if (q > MAX_QTY) throw new HttpError(400, `Quantity for ${it.sku} exceeds ${MAX_QTY}`);
    qtyBySku.set(it.sku, q);
  }

  const products = await loadProducts();
  const lines = [];
  for (const [sku, quantity] of qtyBySku) {
    const hit = findBySku(sku, products);
    if (!hit) throw new HttpError(400, `Unknown SKU: ${sku}`);
    const { product, variant } = hit;
    lines.push({
      sku, productId: product.id, variantId: variant.id, title: product.title, variantName: variant.name,
      kind: product.type, quantity, unitCents: variant.priceCents, lineCents: variant.priceCents * quantity,
      capacityUnits: variant.capacityUnits ?? 1,
    });
  }

  // --- fulfillment method (cart-level) ---
  const physical = lines.filter((l) => l.kind === 'physical');
  const hasPhysical = physical.length > 0;
  let method = 'digital_download';
  let date = null;
  if (hasPhysical) {
    method = fulfillment?.method ?? 'physical_ship';
    if (!METHODS.includes(method)) throw new HttpError(400, `fulfillment.method must be one of ${METHODS.join(', ')}`);
    date = resolveDate(fulfillment?.date, now);
    for (const l of physical) {
      const p = products.find((x) => x.id === l.productId);
      const options = p.fulfillmentOptions ?? [p.fulfillmentMode];
      if (!options.includes(method)) {
        throw new HttpError(400, `"${p.title}" does not support ${method}. Place separate orders for items with different fulfillment methods.`);
      }
    }

    // --- stock + daily capacity (aggregated per product, since variants share stock) ---
    const orders = await loadOrders();
    const perProduct = new Map();
    for (const l of physical) {
      const agg = perProduct.get(l.productId) || { qty: 0, cap: 0 };
      agg.qty += l.quantity;
      agg.cap += l.quantity * l.capacityUnits;
      perProduct.set(l.productId, agg);
    }
    for (const [productId, agg] of perProduct) {
      const p = products.find((x) => x.id === productId);
      const { reservedUnits, dateUnits } = countCommitted(orders, productId, date, now);
      const stockLeft = Math.max(0, p.inventoryCount - reservedUnits);
      if (agg.qty > stockLeft) {
        throw new HttpError(409, `Only ${stockLeft} of "${p.title}" available`, { productId, availableQuantity: stockLeft });
      }
      if (p.dailyCapacity) {
        const remaining = Math.max(0, p.dailyCapacity - dateUnits);
        if (agg.cap > remaining) {
          throw new HttpError(409, `"${p.title}" is limited to ${p.dailyCapacity} per day; ${remaining} left for ${date}`, {
            productId, date, remainingCapacity: remaining,
          });
        }
      }
    }
  }

  // --- money (all integer cents) ---
  const subtotalCents = lines.reduce((s, l) => s + l.lineCents, 0);
  const promo = await evaluatePromo(promoCode, subtotalCents, now);
  const discountCents = promo.ok ? promo.discountCents : 0;
  const physicalSubtotal = physical.reduce((s, l) => s + l.lineCents, 0);
  const physicalDiscount = ratioHalfUp(discountCents, physicalSubtotal, subtotalCents);
  const { taxCents, shippingCents, zoneId } = await calculateTaxShipping({
    hasPhysical, physicalNetCents: physicalSubtotal - physicalDiscount, method, zip: destinationZip,
  });

  const result = {
    lines,
    subtotalCents,
    discountCents,
    taxCents,
    shippingCents,
    totalCents: subtotalCents - discountCents + taxCents + shippingCents,
    currency: 'USD',
    appliedPromo: promo.ok ? promo.promo : null,
    fulfillment: { method, date },
    destinationZip: destinationZip || null,
    zoneId,
  };
  if (!promo.ok) result.promoError = promo.error;
  return result;
}
