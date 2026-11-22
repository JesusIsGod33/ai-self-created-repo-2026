# MASTER ENGINEERING PROMPT: v2 AMENDMENTS
Apply these on top of the original specification. Where they conflict, **this document wins.**
All code referenced here exists in this bundle and passes `node tests/verify-commerce-e2e.mjs` (59/59).

## 0. Change log

| # | Area | Change |
|---|------|--------|
| 1 | Checkout | Hosted Stripe Checkout only. `POST /api/checkout/session` returns `sessionId`, `checkoutUrl`, `amountTotalCents` (plus `orderNumber`, `orderAccessToken`). `paymentIntentClientSecret` is removed. |
| 2 | Webhook | `POST /api/webhooks/stripe` uses `express.raw({type:'application/json'})` and **must be mounted before `express.json()`**. Signature verified against raw bytes (HMAC-SHA256, 300 s tolerance, `timingSafeEqual`). |
| 3 | Downloads | One format: `GET /api/downloads/:token`. Token = `base64url(payload).base64url(HMAC)` where payload is only `{v, o: orderNumber, i: lineIndex, iat, exp}`. Verified with `timingSafeEqual`. File path is resolved **server-side** from the stored order line -> catalog `digitalAssetPath`, then `realpath`-checked to stay inside `data/commerce/downloads/`. TTL 24 h. |
| 4 | Scaffold | `scaffold-full-storefront.mjs` generates an SVG for **every** `images[]` entry in `products.json`. Disk-headroom guard is now real (`fs.statfsSync`, needs 200 MB). Skips existing files unless `--force`. |
| 5 | Ratings | Seed `rating: 0`, `reviewCount: 0` for all products. Validator rejects a non-zero rating with zero reviews. The UI must hide rating badges while `reviewCount === 0`. |
| 6 | Bakery | `fulfillmentOptions: ["physical_ship","local_pickup"]`, `dailyCapacity: 20`, variant `capacityUnits` (24-pack = 2). Capacity and stock are checked per UTC day, counting live pending checkouts (30-min hold) and paid orders. Returns **409** with `remainingCapacity` when exceeded. |
| 7 | Promo rounding | Half-up, integer math: `floor((cents * bps + 5000) / 10000)`; equals `Math.round` for non-negative inputs (1250 @ 15% = 188, total 1062). Same rule for tax. |

## 1. Section 5.1 replacement (REST contracts)

**POST /api/cart/calculate**: body `{ items:[{sku,quantity}], promoCode?, destinationZip?, fulfillment?:{method:"physical_ship"|"local_pickup", date?:"YYYY-MM-DD"} }`
-> `{ subtotalCents, discountCents, taxCents, shippingCents, totalCents, currency, appliedPromo, fulfillment, lines[] }`
An invalid promo returns 200 with `promoError` and no discount. Errors: 400 invalid input, 409 stock/capacity.
Physical lines require `destinationZip` when shipping. Pickup does not. One fulfillment method per cart (split orders if items disagree). Prices always come from the server catalog.

**POST /api/checkout/session**: body `{ cartItems, customerEmail, promoCode?, destinationZip?, fulfillment? }`
-> `{ sessionId, checkoutUrl, amountTotalCents, orderNumber, orderAccessToken }`. Re-validates the cart and reserves stock under a lock. Discount is sent to Stripe as a one-time coupon. `success_url` carries `?order=<n>&k=<accessToken>`. Without `STRIPE_SECRET_KEY` (non-production only) a clearly flagged `mock:true` session is returned.

**POST /api/webhooks/stripe**: handles `checkout.session.completed` (when `payment_status=paid`) and `payment_intent.succeeded`. Idempotent. If `amount_total` or currency doesn't match the stored order, the order goes to `review` and is **not** fulfilled. Always returns `{ received:true, orderNumber? }`. Bad signature -> 400.

**GET /api/orders/:orderNumber?k=<accessToken>** (new): post-purchase vault data. Returns status and fresh 24 h download URLs. Wrong or missing key -> 404.

**GET /api/downloads/:token**: 403 invalid, 410 expired, 404 asset missing. Streams with `Content-Disposition: attachment`, `Cache-Control: private, no-store`.

## 2. Schema deltas (products.json)
Added optional fields: `fulfillmentOptions[]`, `dailyCapacity`, variant `capacityUnits`. `digitalAssetPath` is never returned by the public API. `inventoryCount` for digital items is a placeholder and is not decremented.

## 3. Mounting in server/index.js
```js
import { mountCommerce } from './commerce/routes.js';
// ...create app...
mountCommerce(app);          // FIRST: before any app.use(express.json())
app.use(express.json());     // your other routes after
app.listen(4080, '127.0.0.1');
```
If a global `express.json()` runs first, the webhook returns 500 "raw body missing" (by design; it fails loudly rather than skipping verification).

## 4. New environment variables (.env, `chmod 600`)
```
STRIPE_SECRET_KEY=sk_test_...        # omit in dev to use mock checkout
STRIPE_WEBHOOK_SECRET=whsec_...      # required
DOWNLOAD_HMAC_SECRET=<32+ random chars>   # required; e.g. openssl rand -hex 32
PUBLIC_BASE_URL=http://127.0.0.1:4080
NODE_ENV=production                  # disables mock checkout
```
Optional test overrides: `COMMERCE_DATA_DIR`, `COMMERCE_CONFIG_DIR`.

## 5. Files in this bundle (copy into the repo root)
```
server/commerce/{util,catalog-service,cart-engine,checkout-stripe,webhook-handler,
                order-ledger,digital-delivery,discount-promo-engine,
                tax-shipping-calculator,routes,dev-server}.js
tools/{commerce_catalog_manager,commerce_order_fulfiller}.js   # MCP tools
scripts/{seed-commerce-catalog,scaffold-full-storefront}.mjs
tests/verify-commerce-e2e.mjs
```
MCP tool files export `{ name, description, inputSchema, handler }`. Adapt to whatever `server/tool-loader.js` expects. `commerce_order_fulfiller` also gains `mark_picked_up` for pickup orders.
Not included (still to build): `inventory-sync.js`, `customer-portal-api.js`, `src/` UI components, `public/` SPA, `start-production-stack.sh`, `server/index.js` integration.

## 6. Revised verification checklist
1. Preflight: Node 20.11, `cp .env .env.bak && chmod 600 .env`, `fuser -k 4080/tcp 4090/tcp || true`.
2. Copy bundle files, `npm i express`, `node --check` every file.
3. `node scripts/seed-commerce-catalog.mjs && node scripts/scaffold-full-storefront.mjs`
4. `node tests/verify-commerce-e2e.mjs`: must print `59 passed, 0 failed`. It uses a temp data dir and port 4081, so it never touches real data.
5. Mount `mountCommerce(app)`, start the stack, then `curl --max-time 2 http://127.0.0.1:4080/api/health`.
6. With a real test key: `stripe listen --forward-to 127.0.0.1:4080/api/webhooks/stripe` and complete one test purchase.

## 7. Known limitations (decide before going live)
- **Seeded PDFs/ZIP are placeholders.** Replace them with real files in `data/commerce/downloads/`.
- **Tax:** rates are placeholders (0%). Digital-goods tax is not computed. Consider Stripe Tax.
- Promo codes have no usage caps. Refund and dispute webhooks (`charge.refunded`, `charge.dispute.created`) aren't handled. No emails are sent (buyers rely on the success page, so add email delivery of the order link). No rate limiting.
- The ledger is re-streamed per request, which is fine at small scale. Add compaction if it grows past tens of thousands of orders.
- Order/inventory state is guarded by an in-process lock, so run a **single** Node process.
- Perishable food sales may need local cottage-food licensing, labeling, and shipping rules. That is outside this code.
