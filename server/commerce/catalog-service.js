import path from 'node:path';
import { ASSET_PREFIX, DATA_DIR, HttpError, atomicWriteJson, readJson, withLock } from './util.js';

const FILE = path.join(DATA_DIR, 'products.json');
const TYPES = ['digital', 'physical'];
const MODES = ['digital_download', 'physical_ship', 'local_pickup'];

export const loadProducts = () => readJson(FILE, []);

// Public view: never expose the internal asset path.
export function toPublic(p) {
  const { digitalAssetPath, ...rest } = p;
  return rest;
}

const sorters = {
  price_asc: (a, b) => a.priceCents - b.priceCents,
  price_desc: (a, b) => b.priceCents - a.priceCents,
  rating: (a, b) => (b.rating || 0) - (a.rating || 0),
  title: (a, b) => a.title.localeCompare(b.title),
  featured: (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0),
};

const str = (v) => (typeof v === 'string' && v.trim() ? v.trim().toLowerCase() : null);

export async function listProducts(q = {}) {
  const category = str(q.category), brand = str(q.brand), type = str(q.type), search = str(q.search);
  let out = (await loadProducts()).filter((p) => {
    if (category && p.category.toLowerCase() !== category) return false;
    if (brand && p.brand.toLowerCase() !== brand) return false;
    if (type && p.type !== type) return false;
    if (search) {
      const hay = [p.title, p.subtitle, p.brand, ...(p.tags || [])].join(' ').toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
  const sorter = sorters[str(q.sort)];
  if (sorter) out = out.sort(sorter);
  return out.map(toPublic);
}

export function findBySku(sku, products) {
  for (const product of products) {
    const variant = (product.variants || []).find((v) => v.sku === sku);
    if (variant) return { product, variant };
  }
  return null;
}

export async function getProduct(ref) {
  const products = await loadProducts();
  return products.find((p) => p.id === ref || p.slug === ref) || null;
}

export function validateProduct(p, existing = []) {
  const errs = [];
  if (!p || typeof p !== 'object') throw new HttpError(400, 'productData is required');
  for (const k of ['id', 'slug', 'brand', 'category', 'title']) if (typeof p[k] !== 'string' || !p[k].trim()) errs.push(`${k} is required`);
  if (!TYPES.includes(p.type)) errs.push(`type must be one of ${TYPES.join(', ')}`);
  if (!MODES.includes(p.fulfillmentMode)) errs.push(`fulfillmentMode must be one of ${MODES.join(', ')}`);
  if (!Number.isInteger(p.priceCents) || p.priceCents < 0) errs.push('priceCents must be a non-negative integer');
  if (!Array.isArray(p.variants) || !p.variants.length) errs.push('at least one variant is required');
  const taken = new Set(existing.filter((x) => x.id !== p.id).flatMap((x) => (x.variants || []).map((v) => v.sku)));
  for (const v of p.variants || []) {
    if (!v?.id || !v?.sku || !Number.isInteger(v.priceCents) || v.priceCents < 0) errs.push(`variant ${v?.id ?? '?'} needs id, sku, integer priceCents`);
    else if (taken.has(v.sku)) errs.push(`duplicate SKU ${v.sku}`);
    taken.add(v?.sku);
  }
  if (p.type === 'digital') {
    if (typeof p.digitalAssetPath !== 'string' || !p.digitalAssetPath.startsWith(ASSET_PREFIX) || p.digitalAssetPath.includes('..')) {
      errs.push(`digitalAssetPath must start with ${ASSET_PREFIX} and contain no ".."`);
    }
  }
  if (p.fulfillmentOptions && (!Array.isArray(p.fulfillmentOptions) || p.fulfillmentOptions.some((m) => !MODES.includes(m)))) errs.push('fulfillmentOptions invalid');
  if (p.dailyCapacity !== undefined && (!Number.isInteger(p.dailyCapacity) || p.dailyCapacity < 1)) errs.push('dailyCapacity must be a positive integer');
  if (typeof p.rating !== 'number' || p.rating < 0 || p.rating > 5) errs.push('rating must be 0-5');
  if (!Number.isInteger(p.reviewCount) || p.reviewCount < 0) errs.push('reviewCount must be a non-negative integer');
  if (p.reviewCount === 0 && p.rating !== 0) errs.push('rating must be 0 while reviewCount is 0');
  if (errs.length) throw new HttpError(400, 'Invalid product', { details: errs });
}

export function upsertProduct(product) {
  return withLock(async () => {
    const products = await loadProducts();
    validateProduct(product, products);
    const i = products.findIndex((p) => p.id === product.id);
    if (i >= 0) products[i] = product; else products.push(product);
    await atomicWriteJson(FILE, products);
    return { created: i < 0, product: toPublic(product) };
  });
}

export function deleteProduct(id) {
  return withLock(async () => {
    const products = await loadProducts();
    const next = products.filter((p) => p.id !== id);
    if (next.length === products.length) throw new HttpError(404, 'Product not found');
    await atomicWriteJson(FILE, next);
    return { deleted: id };
  });
}

/** Caller MUST already hold withLock (the webhook does). Returns products that went below zero. */
export async function decrementInventoryUnlocked(lines) {
  const products = await loadProducts();
  const oversold = [];
  let changed = false;
  for (const l of lines) {
    if (l.kind !== 'physical') continue;
    const p = products.find((x) => x.id === l.productId);
    if (!p) continue;
    if (p.inventoryCount < l.quantity) oversold.push({ productId: p.id, wanted: l.quantity, had: p.inventoryCount });
    p.inventoryCount = Math.max(0, p.inventoryCount - l.quantity);
    changed = true;
  }
  if (changed) await atomicWriteJson(FILE, products);
  return oversold;
}
