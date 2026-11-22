#!/usr/bin/env node
// Seeds data/commerce + config. Safe by default: never overwrites existing files.
//   node scripts/seed-commerce-catalog.mjs            (create what's missing)
//   node scripts/seed-commerce-catalog.mjs --force    (overwrite products/discounts, keeps .bak)
// Honors COMMERCE_DATA_DIR / COMMERCE_CONFIG_DIR (used by the e2e test).
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { CONFIG_DIR, DATA_DIR, DOWNLOADS_DIR, atomicWriteJson } from '../server/commerce/util.js';

const FORCE = process.argv.includes('--force');
const exists = (p) => fs.existsSync(p);

const digitalCommon = { type: 'digital', fulfillmentMode: 'digital_download', fulfillmentOptions: ['digital_download'], inventoryCount: 9999, rating: 0, reviewCount: 0 };
const physicalCommon = { type: 'physical', digitalAssetPath: null, rating: 0, reviewCount: 0 };

const products = [
  {
    ...digitalCommon, id: 'prod_sew_001', slug: 'kids-utility-vest-pattern-2t', brand: 'InfuseLink Sewing', category: 'Sewing Patterns',
    title: "Size 2T Kid's Utility Vest Printable Pattern & Cut Layout",
    subtitle: 'Professional multi-layer PDF pattern with illustrated step-by-step assembly instructions',
    description: 'Engineered for durability and functional style. Features multi-pocket options, reinforced seam allowances, and detailed instructions suitable for home sewists.',
    priceCents: 1250, compareAtPriceCents: 1800, currency: 'USD',
    variants: [{ id: 'var_2t_pdf', name: 'Digital PDF (Letter / A4 + A0 Copy Shop)', priceCents: 1250, sku: 'SEW-VEST-2T-PDF' }],
    sku: 'SEW-VEST-2T-PDF', digitalAssetPath: 'data/commerce/downloads/patterns/utility-vest-2t-master.pdf',
    images: ['/assets/products/sewing-vest-1.svg', '/assets/products/sewing-vest-2.svg'],
    tags: ['sewing', 'pdf-pattern', 'kids', 'utility-vest'],
    seo: { title: "Kid's Utility Vest PDF Pattern (Size 2T) - InfuseLink Studio", description: 'Download printable 2T utility vest sewing pattern with cut layout sheets and assembly guides.' },
    featured: true,
  },
  {
    ...digitalCommon, id: 'prod_sew_002', slug: 'play-romper-pattern-3t', brand: 'InfuseLink Sewing', category: 'Sewing Patterns',
    title: 'Size 3T Play Romper Printable Sewing Pattern',
    subtitle: "Relaxed-fit children's play romper with optional snap placket and seam guide",
    description: 'Designed for active play. Includes full-size pattern pieces, grainline markers, and fabric yardage requirements.',
    priceCents: 1400, compareAtPriceCents: 2000, currency: 'USD',
    variants: [{ id: 'var_3t_pdf', name: 'Digital PDF (Letter / A4 + A0 Copy Shop)', priceCents: 1400, sku: 'SEW-ROMP-3T-PDF' }],
    sku: 'SEW-ROMP-3T-PDF', digitalAssetPath: 'data/commerce/downloads/patterns/play-romper-3t-master.pdf',
    images: ['/assets/products/sewing-romper-1.svg'],
    tags: ['sewing', 'pdf-pattern', 'kids', 'romper'],
    seo: { title: 'Play Romper Printable Pattern (Size 3T) - InfuseLink Studio', description: 'Instant download 3T play romper PDF pattern with seam guides and illustrated steps.' },
    featured: false,
  },
  {
    ...digitalCommon, id: 'prod_ai_001', slug: 'ats-resume-tailoring-engine', brand: 'InfuseLink AI Tools', category: 'AI Tools',
    title: 'ATS Resume Tailoring & Cover Letter Automation Suite',
    subtitle: 'Enterprise prompt matrix & JSON schema generator for multi-role career optimization',
    description: 'Complete production-ready AI prompt pack and operational workflow to score, format, and tailor resumes against Applicant Tracking Systems.',
    priceCents: 4900, compareAtPriceCents: 9900, currency: 'USD',
    variants: [
      { id: 'var_ai_single', name: 'Individual License', priceCents: 4900, sku: 'AI-ATS-SINGLE' },
      { id: 'var_ai_pro', name: 'Pro Architect License (Includes MCP Tools)', priceCents: 8900, sku: 'AI-ATS-PRO' },
    ],
    sku: 'AI-ATS-SINGLE', digitalAssetPath: 'data/commerce/downloads/prompt-packs/ats-engine-v2.zip',
    images: ['/assets/products/ai-ats-1.svg'],
    tags: ['ai', 'resume', 'ats', 'prompt-engineering'],
    seo: { title: 'ATS Resume Automation Suite - InfuseLink AI', description: 'Automate resume optimization with high-conversion prompt templates and JSON schemas.' },
    featured: true,
  },
  {
    ...physicalCommon, id: 'prod_merch_001', slug: 'allegedly-insane-statement-tee', brand: 'Allegedly Insane', category: 'Apparel',
    title: 'Allegedly Insane Signature Heavyweight Streetwear Tee',
    subtitle: '240 GSM combed cotton drop-shoulder boxy tee with high-density screenprint',
    description: 'Premium streetwear apparel built for comfort and durability. Double-needle stitched hems and custom woven neck label.',
    priceCents: 3800, compareAtPriceCents: 4500, currency: 'USD',
    variants: ['S', 'M', 'L', 'XL'].map((s, i) => ({ id: `var_tee_${s.toLowerCase()}`, name: `${['Small', 'Medium', 'Large', 'X-Large'][i]} / Slate Obsidian`, priceCents: 3800, sku: `INS-TEE-BLK-${s}` })),
    sku: 'INS-TEE-BLK-M', inventoryCount: 150, fulfillmentMode: 'physical_ship', fulfillmentOptions: ['physical_ship'],
    images: ['/assets/products/tee-obsidian-1.svg'],
    tags: ['apparel', 'streetwear', 'allegedly-insane', 't-shirt'],
    seo: { title: 'Allegedly Insane Streetwear Tee - Official Store', description: 'Shop the limited edition heavy-cotton statement tee from Allegedly Insane.' },
    featured: true,
  },
  {
    ...physicalCommon, id: 'prod_bake_001', slug: 'woke-cookies-gourmet-assortment-box', brand: 'Woke Cookies', category: 'Bakery',
    title: 'Signature Gourmet Cookie Box (12 Large Craft Cookies)',
    subtitle: 'Fresh-baked brown butter chocolate chunk, espresso sea salt & red velvet cookies',
    description: 'Small-batch craft cookies baked fresh to order using organic brown butter, single-origin chocolate chunks, and Maldon sea salt flakes.',
    priceCents: 3600, compareAtPriceCents: 4200, currency: 'USD',
    variants: [
      { id: 'var_ck_12', name: 'Standard Assortment (12 Pack)', priceCents: 3600, sku: 'WOKE-CK-12', capacityUnits: 1 },
      { id: 'var_ck_24', name: 'Party Pack Assortment (24 Pack)', priceCents: 6800, sku: 'WOKE-CK-24', capacityUnits: 2 },
    ],
    sku: 'WOKE-CK-12', inventoryCount: 45, fulfillmentMode: 'physical_ship', fulfillmentOptions: ['physical_ship', 'local_pickup'],
    dailyCapacity: 20, // 12-pack boxes per UTC day (a 24-pack consumes 2 units) - tune to your oven
    images: ['/assets/products/cookies-box-1.svg'],
    tags: ['bakery', 'cookies', 'woke-cookies', 'gourmet'],
    seo: { title: 'Woke Cookies Gourmet Box - Fresh Small Batch Bakery', description: 'Order fresh small-batch brown butter cookies for shipping or local pickup.' },
    featured: true,
  },
];

const discounts = [{ code: 'WELCOME15', percent: 15, active: true, minSubtotalCents: 0, expiresAt: null }];

const zones = {
  _note: 'PLACEHOLDER RATES - set real tax rates/shipping before going live. taxBps = basis points (600 = 6%).',
  default: { id: 'default', taxBps: 0, shippingCents: 599, freeShippingOverCents: 7500 },
  pickupTaxBps: 0,
  zones: [],
};

const PLACEHOLDER_PDF = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\ntrailer<</Root 1 0 R/Size 4>>\n%%EOF\n';
const EMPTY_ZIP = Buffer.concat([Buffer.from('PK\x05\x06', 'binary'), Buffer.alloc(18)]);

async function writeIfAllowed(file, data) {
  if (exists(file)) {
    if (!FORCE) { console.log(`[seed] keep    ${path.relative(process.cwd(), file)}`); return; }
    await fsp.copyFile(file, `${file}.bak`);
  }
  await atomicWriteJson(file, data);
  console.log(`[seed] wrote   ${path.relative(process.cwd(), file)}`);
}

await fsp.mkdir(CONFIG_DIR, { recursive: true });
for (const d of ['patterns', 'prompt-packs', 'resume-templates']) await fsp.mkdir(path.join(DOWNLOADS_DIR, d), { recursive: true });

await writeIfAllowed(path.join(DATA_DIR, 'products.json'), products);
await writeIfAllowed(path.join(DATA_DIR, 'discounts.json'), discounts);
if (!exists(path.join(DATA_DIR, 'customers.json'))) await atomicWriteJson(path.join(DATA_DIR, 'customers.json'), []);
if (!exists(path.join(DATA_DIR, 'orders.jsonl'))) await fsp.writeFile(path.join(DATA_DIR, 'orders.jsonl'), '', { mode: 0o600 });
if (!exists(path.join(CONFIG_DIR, 'shipping-tax-zones.json'))) await atomicWriteJson(path.join(CONFIG_DIR, 'shipping-tax-zones.json'), zones);

// Placeholder deliverables so the delivery flow works end-to-end. Never overwrites real files.
for (const p of products.filter((x) => x.type === 'digital')) {
  const file = path.join(DOWNLOADS_DIR, p.digitalAssetPath.slice('data/commerce/downloads/'.length));
  if (exists(file)) continue;
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file, file.endsWith('.zip') ? EMPTY_ZIP : PLACEHOLDER_PDF);
  console.log(`[seed] PLACEHOLDER asset ${path.basename(file)} - replace with the real file before selling`);
}
console.log('[seed] done');
