import path from 'node:path';
import { DATA_DIR, readJson } from './util.js';

const FILE = path.join(DATA_DIR, 'discounts.json');

/**
 * Half-up rounding to whole cents, in pure integer math (no float drift).
 * For non-negative inputs this equals Math.round(cents * percent / 100):
 *   1250 cents @ 15%  -> 187.5 -> 188  (total 1062)
 * Percent may have up to 2 decimals (12.5, 7.25) via basis points.
 */
export function halfUpPercent(cents, percent) {
  const bps = Math.round(percent * 100);
  return Math.floor((cents * bps + 5000) / 10000);
}

export async function loadDiscounts() {
  return readJson(FILE, []);
}

export async function evaluatePromo(rawCode, subtotalCents, now = Date.now()) {
  if (rawCode === undefined || rawCode === null || rawCode === '') return { ok: true, promo: null, discountCents: 0 };
  if (typeof rawCode !== 'string' || rawCode.length > 32) return { ok: false, error: 'Invalid promo code' };
  const code = rawCode.trim().toUpperCase();
  const promo = (await loadDiscounts()).find((d) => String(d.code).toUpperCase() === code);
  if (!promo || promo.active === false) return { ok: false, error: 'Invalid promo code' };
  if (promo.expiresAt && Date.parse(promo.expiresAt) <= now) return { ok: false, error: 'Promo code has expired' };
  if (promo.minSubtotalCents && subtotalCents < promo.minSubtotalCents) {
    return { ok: false, error: `Promo requires a subtotal of at least ${promo.minSubtotalCents} cents` };
  }
  const discountCents = Math.min(subtotalCents, halfUpPercent(subtotalCents, promo.percent));
  return { ok: true, promo: { code: promo.code, discountPercent: promo.percent }, discountCents };
}
