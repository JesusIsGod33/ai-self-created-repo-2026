#!/usr/bin/env node
// Generates a procedural SVG for EVERY image path referenced in products.json (offline-safe, tiny).
//   node scripts/scaffold-full-storefront.mjs [--force]
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { DATA_DIR, REPO_ROOT } from '../server/commerce/util.js';

const FORCE = process.argv.includes('--force');
const MIN_FREE_BYTES = 200 * 1024 * 1024;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);

function preflightDiskGuard() {
  console.log('[SCAFFOLD] Checking workstation disk headroom...');
  const s = fs.statfsSync(REPO_ROOT);
  const free = Number(s.bavail) * Number(s.bsize);
  if (free < MIN_FREE_BYTES) {
    console.error(`[SCAFFOLD] Only ${(free / 1048576).toFixed(0)} MB free; need ${MIN_FREE_BYTES / 1048576} MB. Aborting.`);
    process.exit(1);
  }
}

const ACCENT = { 'InfuseLink Sewing': '#D97706', 'InfuseLink AI Tools': '#059669', 'Allegedly Insane': '#F1F5F9', 'Woke Cookies': '#D97706' };

function motif(p, accent) {
  const stroke = `fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"`;
  switch (p.category) {
    case 'Sewing Patterns': return `<path d="M90 230 L130 190 L170 230 L210 190 L250 230 L290 190 L330 230" ${stroke}/><circle cx="200" cy="130" r="38" ${stroke}/>`;
    case 'AI Tools': return `<g ${stroke}><circle cx="120" cy="150" r="20"/><circle cx="280" cy="130" r="20"/><circle cx="200" cy="250" r="20"/><path d="M138 158 L262 136 M130 168 L188 232 M270 148 L212 234"/></g>`;
    case 'Apparel': return `<path d="M140 110 L100 150 L130 180 L150 165 L150 270 L250 270 L250 165 L270 180 L300 150 L260 110 Q200 140 140 110Z" ${stroke}/>`;
    case 'Bakery': return `<g ${stroke}><circle cx="200" cy="190" r="70"/><circle cx="175" cy="170" r="6"/><circle cx="220" cy="165" r="6"/><circle cx="205" cy="210" r="6"/><circle cx="170" cy="215" r="6"/></g>`;
    default: return `<circle cx="200" cy="190" r="70" ${stroke}/>`;
  }
}

function svgFor(p, index) {
  const accent = ACCENT[p.brand] || '#D97706';
  const words = p.title.split(' ');
  const lines = ['', ''];
  for (const w of words) { const i = lines[0].length + w.length < 26 ? 0 : 1; lines[i] += (lines[i] ? ' ' : '') + w; }
  if (lines[1].length > 28) lines[1] = lines[1].slice(0, 27) + '...';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%" role="img" aria-label="${esc(p.title)}">
  <rect width="400" height="400" fill="#161E2E"/>
  <rect x="12" y="12" width="376" height="376" rx="16" fill="none" stroke="#334155"/>
  ${motif(p, accent)}
  <text x="200" y="330" text-anchor="middle" fill="#F1F5F9" font-family="Inter, sans-serif" font-size="15" font-weight="700">${esc(lines[0])}</text>
  <text x="200" y="352" text-anchor="middle" fill="#F1F5F9" font-family="Inter, sans-serif" font-size="15" font-weight="700">${esc(lines[1])}</text>
  <text x="200" y="45" text-anchor="middle" fill="${accent}" font-family="Inter, sans-serif" font-size="12" font-weight="600" letter-spacing="2">${esc(p.brand.toUpperCase())}${index > 0 ? ` - VIEW ${index + 1}` : ''}</text>
</svg>
`;
}

preflightDiskGuard();
const file = path.join(DATA_DIR, 'products.json');
if (!fs.existsSync(file)) { console.error('[SCAFFOLD] products.json not found - run scripts/seed-commerce-catalog.mjs first.'); process.exit(1); }
const products = JSON.parse(await fsp.readFile(file, 'utf8'));
const publicDir = path.join(REPO_ROOT, 'public');
let made = 0, skipped = 0;
for (const p of products) {
  for (const [i, img] of (p.images || []).entries()) {
    if (!img.startsWith('/assets/') || img.includes('..')) { console.warn(`[SCAFFOLD] skipping odd image path ${img}`); continue; }
    const out = path.join(publicDir, img);
    if (!out.startsWith(publicDir + path.sep)) continue;
    if (fs.existsSync(out) && !FORCE) { skipped++; continue; }
    await fsp.mkdir(path.dirname(out), { recursive: true });
    const tmp = `${out}.tmp`;
    await fsp.writeFile(tmp, svgFor(p, i));
    await fsp.rename(tmp, out);
    made++;
  }
}
console.log(`[SCAFFOLD] Assets created: ${made}, kept existing: ${skipped}.`);
