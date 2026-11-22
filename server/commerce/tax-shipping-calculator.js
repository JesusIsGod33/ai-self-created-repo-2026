import path from 'node:path';
import { CONFIG_DIR, HttpError, readJson } from './util.js';

const FALLBACK = { default: { id: 'default', taxBps: 0, shippingCents: 599, freeShippingOverCents: 7500 }, zones: [] };

export const bpsHalfUp = (cents, bps) => Math.floor((cents * bps + 5000) / 10000);

export async function loadZones() {
  return readJson(path.join(CONFIG_DIR, 'shipping-tax-zones.json'), FALLBACK);
}

/**
 * Tax and shipping apply to PHYSICAL goods only. Digital-goods tax is intentionally not
 * computed here (taxability varies by jurisdiction) - use Stripe Tax or an accountant before
 * selling digital goods where tax applies.
 */
export async function calculateTaxShipping({ hasPhysical, physicalNetCents, method, zip }) {
  if (!hasPhysical) return { taxCents: 0, shippingCents: 0, zoneId: null };
  if (zip !== undefined && zip !== null && zip !== '' && !/^\d{5}$/.test(String(zip))) {
    throw new HttpError(400, 'destinationZip must be a 5-digit US ZIP code');
  }
  if (method === 'physical_ship' && !zip) throw new HttpError(400, 'destinationZip is required for shipped orders');

  const cfg = await loadZones();
  const base = cfg.default || FALLBACK.default;
  const match = zip ? (cfg.zones || []).find((z) => (z.zipPrefixes || []).some((p) => String(zip).startsWith(p))) : null;
  const zone = { ...base, ...(match || {}) };

  const taxBps = method === 'local_pickup' && cfg.pickupTaxBps !== undefined ? cfg.pickupTaxBps : zone.taxBps ?? 0;
  const free = zone.freeShippingOverCents;
  const shippingCents = method === 'physical_ship' && !(free != null && physicalNetCents >= free) ? zone.shippingCents ?? 0 : 0;
  return { taxCents: bpsHalfUp(Math.max(0, physicalNetCents), taxBps), shippingCents, zoneId: zone.id || 'default' };
}
