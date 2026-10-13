# CARLA DIAMONDS

A Next.js / TypeScript jewellery storefront with an editorial design, sample catalogue, variant-aware bag, wishlist, guided or AI styling, protected administration, MongoDB persistence and Razorpay integration.

## Run locally

```powershell

npm install

Copy-Item .env.example .env.local

npm run dev

```

Open http://127.0.0.1:3000. Without configuration, browsing, search, filters, product pages, local bag/wishlist and the guided stylist work. Sample imagery and prices are explicitly labelled. A no-payment sample checkout, local photo try-on and illustrative 3D models work without credentials. Real payments, account creation and persistent submissions require configured services.

```powershell

npm run typecheck

npm test

npm run build

npm start

```

## Connect services

- **MongoDB:** Set `MONGODB_URI` to a replica set / Atlas connection. Transactions are required for checkout and stock changes. Run `npm run seed` to insert samples without overwriting existing records. Replace all samples with verified real product data before launch.

- **Authentication:** Set a random `SESSION_SECRET` of at least 32 characters, `ADMIN_EMAIL` and a bcrypt `ADMIN_PASSWORD_HASH`. The admin login is at `/admin`. Customer registration uses password hashing and an HTTP-only, signed session. Sessions expire after eight hours. There is no password-reset email flow yet.

- **Razorpay:** Set test keys and webhook secret. Configure `/api/webhooks/razorpay` for `payment.captured`. Configure automatic capture in Razorpay. The browser callback verifies its signature and retrieves capture status; only captured payments with matching amount/currency mark orders paid. Inventory and coupon reservations use MongoDB transactions. Use a test merchant account before enabling live keys.

- **AI:** Set `AI_PROVIDER=openai` or `gemini`, the corresponding key, and optionally a model. Keys stay server-side. The server shortlists available catalogue variants within budget and validates returned IDs. With no key, the stylist clearly uses a deterministic guided mode. Photo analysis intentionally returns unavailable.

- **Cloudinary:** Set the three Cloudinary environment variables to enable protected image/GLB upload. Images are limited to 10 MB with type and magic-byte checks. Attach uploaded URLs to the actual product's `images`, `model3D` or `tryOnAsset` fields.

- **APP_URL:** Must match the exact browser origin, including the port. Set it to your HTTPS production URL when deploying. Trust `x-forwarded-for` only from a proxy that overwrites it; rate limits are stored in MongoDB when configured.

## 3D and local virtual try-on

The 3D viewer includes 24 local illustrative GLB designs, orbit controls, zoom, reset and a local studio lighting environment. Sample models are explicitly labelled approximate design studies. For real products, supply calibrated GLBs with correct scale/origin. Asset failures fall back to product photography.

The studio uses MediaPipe face, pose or hand landmarks for earrings, necklaces, rings or bracelets. Camera permission follows an explicit click. In browser mode, uploaded JPEG/PNG/WebP images are processed in-browser and are not submitted to an API. Python scan mode sends captured frames to the local Python vision service; see python/README.md. Placement, size and rotation follow detected landmarks automatically. Lost tracking hides the ornament until landmarks return. Switching pieces keeps the camera running and changes the detector when needed. Before/after comparison, PNG capture and deletion controls are provided. MediaPipe runtime and face, hand and pose models are served locally. AI-generated face and hand sample photos let you try the studio without granting camera access. Only products with a `tryOnAsset` enable preview controls. This initial placement algorithm needs per-product calibration, occlusion work, real assets and device testing before production. It cannot verify fit or dimensions.

## Administration

Admin APIs enforce the signed administrator role on every request. The dashboard reports captured revenue and actual records. Products/variants, orders, coupons and review moderation are editable. Media uploads and audit logs are supported. Scheduled hero campaigns are validated and read from the database on each homepage request. Generic content/configuration records are editable as JSON; they are drafts unless specifically consumed by the storefront. Secrets must be configured in the environment, never stored in the editor.

## Order lifecycle and operational limits

- Authoritative prices, stock, quantities and coupons are validated server-side. Duplicate SKUs are rejected. Totals use integer paise.

- Creation reserves inventory transactionally before contacting Razorpay. Provider creation failure releases the reservation. Each create request has a unique idempotency key; duplicate submission keys are rejected.

- Captured webhooks are authenticated and idempotent, and amount/currency are checked. Guests access orders with a random private token stored in their browser session; account holders can access orders created under their own signed customer ID (unverified email addresses do not grant access to guest orders).

- Reservations for abandoned payment windows are deliberately **not automatically released**: doing so without reconciling the provider could oversell after delayed capture. A production reconciliation worker and refund workflow are required. `expiresAt` is advisory metadata, not a TTL deletion index.

- Payment notifications, password reset, account deletion automation, advanced tax/shipping, production returns/refunds and multi-device guest-order recovery remain launch work. No email delivery is claimed. Contact/newsletter records are persisted when MongoDB is configured.

- Review display only uses approved persisted records; there are no fabricated testimonials. Merchant identity, policies, product certifications and contact details must be finalized before sales.

## Assets

The catalogue has 24 unique local AI-generated product images, six each for necklaces, earrings, rings and bracelets. Category pages, new arrivals and collection edits are separate routes. Next Image optimizes local catalogue and editorial assets, and a local fallback handles missing images. Editorial Unsplash photos are saved locally; only Google Fonts needs an external request. See [asset sources and generation prompts](public/images/ASSET-SOURCES.md). Replace concept assets and sample prices with verified merchant data before launch.

## Deployment

Deploy this standard Next.js app to Vercel or a Node host with access to MongoDB and the configured providers. It has not been published automatically: the requested Mongoose/transactional MongoDB backend needs a compatible Node runtime. Set environment variables, deploy with HTTPS, initialize indexes, configure Razorpay webhooks, and perform the integration tests below first.

## Live-service acceptance checks

The offline test suite checks money, schemas and signature verification. With actual service credentials, additionally verify concurrent purchases of the last stock unit, coupon exhaustion, database rollback on payment-provider failure, duplicate webhooks, wrong signature/currency/amount, delayed capture, account isolation, unauthorized admin access and uploaded asset failures. Test camera permission denial, stop/unmount cleanup, face/hand/pose tracking and mobile performance with calibrated assets. These live checks cannot be passed using sample records alone.


## Verified in this workspace

Production build, strict TypeScript validation, twelve unit tests and nine sample-mode API smoke checks passed. Browser checks covered desktop/mobile layouts, product navigation, wishlist, bag quantities, authoritative checkout total, sample checkout controls, guided styling, search, category filtering and quick view. Additional browser checks verified local face, hand and pose tracking on sample photos and a rendered 3D model. The sample checkout stores orders in session storage without invoking payments. Live MongoDB/Razorpay/provider integration and camera tracking with actual product assets remain unverified.



## Face scan styling

Every catalogue card, quick view and product page links to that product in the try-on studio. Choose **Scan my face**, then use the camera, upload a portrait or scan the sample. The scan checks for one face and estimates length relative to breadth from local landmarks, accounting for image dimensions. It creates an optional catalogue styling edit and previews the first available earring on that portrait. Selecting another recommended earring or necklace reuses the portrait; rings and bracelets need a hand or wrist photo. Recommendations are simple editorial rules, not scientific suitability or fit predictions. In Browser face scan mode, neither photos nor proportions are uploaded or saved in browser storage. Clear scan & photo removes the result and preview; active camera tracks stop on clear, close or unmount.


Python point-by-point tracking, setup and privacy details: [python/README.md](python/README.md).


### Demo checkout

The bag and checkout include photo order summaries, quantity/removal controls, saved pieces, responsive delivery fields and a demo-details shortcut. Sample checkout opens an explicitly labelled payment simulator with UPI, card and net banking choices. Success creates a session-only sample receipt; simulated failure and cancellation keep the bag for retry. No payment credentials are collected, no money is charged and no fulfilment is triggered. Live Razorpay checkout remains separate and requires configured services.

### Carla Diamonds branding and store media

The supplied logo drives the plum/ivory theme and is used for the site header, footer, payment gateway, browser icon, Apple icon and social metadata. Run `Start-Carla.cmd` locally. Existing browser-storage and authentication identifiers remain stable so saved bags and sessions survive the rebrand. The old layered-chain product URL redirects to its renamed page.

`/store-stories` includes all 15 owner-supplied reels and the photo carousel, with video/photo filtering and progressive loading. The homepage features original store photographs plus three Instagram embeds. Embeds load directly from Instagram with a permanent original-post link when playback is restricted. This is a curated collection of current embeds, not an authenticated auto-sync of future posts. Add future links in `lib/instagram.ts`, or connect the store account before implementing an API-backed feed. Sample catalogue products remain labelled and are not presented as inventory inferred from Instagram.
