# Carla Diamonds

A Next.js 16 / React / TypeScript jewellery storefront with a protected boutique manager, Supabase Postgres, Supabase Storage, catalogue styling, and optional Razorpay checkout.

## Local setup

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000. Administration is at `/admin`.
Do not overwrite an existing `.env.local`; it contains private local configuration.

## Supabase setup

1. Open your project SQL Editor: https://supabase.com/dashboard/project/xtarpbqfgaykxhuqqoqf/sql/new
2. Paste and run `supabase/setup.sql`. It creates only `carla_*` application tables and functions, enables RLS, restricts database access to the app server, and creates the `carla-jewellery` photo bucket. The script is re-runnable and does not drop existing data.
3. Configure the server environment locally and in Vercel:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-server-secret-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
ADMIN_EMAIL=your-admin-email
ADMIN_PASSWORD_HASH=your-bcrypt-hash
SESSION_SECRET=your-strong-random-secret
```

The project URL is the base URL, without `/rest/v1/`. The Supabase secret key must never have a `NEXT_PUBLIC_` prefix. No password or secret key is committed. In dotenv files, escape dollar signs in bcrypt hashes; Vercel's variable editor accepts the raw hash.

Run `npm run setup:admin` from a trusted server/workspace with the private admin email and bcrypt hash configured. This stores a hashed administrator record in the RLS-protected Supabase content table. Once a database administrator exists, it takes precedence over bootstrap environment credentials. No plaintext password is stored. Customer accounts use bcrypt hashes in the private `carla_customers` table and the website's signed HTTP-only session cookie; they are separate from Supabase Dashboard logins and Supabase Auth users. Public/publishable API keys cannot read customer records or invoke write functions.

`npm run seed` initializes the existing 24 labelled sample products once. It preserves an existing catalogue and never repopulates a catalogue after an administrator deletes all products. Replace sample prices and illustrative images with verified store inventory before accepting purchases.

## Boutique manager

- Create, edit, publish, draft and delete jewellery.
- Upload up to eight JPEG/PNG/WebP photographs per piece, up to 4 MB each.
- Set necklaces, earrings, rings or bracelets; select New Arrival status.
- Manage prices, metal, purity, weight, gemstones, sizes and stock.
- Create collections and assign jewellery to them.
- Publish page headings, descriptions, body text and cover photographs.
- Add, hide, edit and delete Store Stories and homepage campaign photographs.
- Keep try-on content archived without exposing it to customers.

Production data uses Supabase exclusively. Product photos are delivered by Supabase Storage. Products, site settings, customer records, wishlists, reviews, newsletter subscriptions, contact messages and orders are persisted in Postgres. Database requests go through the Next.js server and existing role checks. No MongoDB dependency or connection is required.

Before Supabase is configured, local development can store catalogue edits and accounts in ignored `.data/`. Production rejects filesystem writes. A failed Supabase request never silently falls back to local storage.

## Payments and styling

Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` to enable live checkout. Configure the `payment.captured` webhook at `/api/webhooks/razorpay`. Checkout totals and stock are revalidated inside the Postgres reservation transaction. Row locks protect the final stock unit, and payment processing is idempotent. Inventory is restored if payment-provider order creation fails. Abandoned reservations still require provider reconciliation; no automatic refund or fulfilment is claimed.

With no payment provider configured, the interface identifies unavailable checkout or clearly labelled sample mode. Never enter real card details in the sample simulator.

Set `OPENAI_API_KEY` or `GEMINI_API_KEY` to enable optional AI styling; otherwise the stylist uses labelled catalogue filtering. `GOLD_API_TOKEN` enables indicative server-side gold rates. Provider failures never fabricate rates or successful payments.

## Archived virtual try-on

Virtual try-on and the 3D viewer are removed from public navigation, cards, product pages and homepage promotion. Former studio/viewer URLs redirect to `/shop`. Their source, GLB designs and local tracking assets remain in the repository for future use and are not imported by the storefront.

## Verification

```powershell
npm run typecheck
npm test
npm run build
npm run verify:supabase
```

The Supabase integration check creates clearly named temporary records, verifies product writes, duplicate references, concurrent last-stock reservation, stock release, amount checks, duplicate payment events, image storage and anonymous-access restrictions, then removes its test records. It never makes a real payment.

## Deployment

Push to the GitHub `main` branch connected to the Carla Diamonds Vercel project. This project requires verified commits: use signed Git commits or GitHub's verified web editor. Set production environment variables before deployment. Verify `/admin` login, an image upload, draft/publish/delete, public category pages, and the hidden studio redirects on the deployed domain. Credentials and local uploaded data are excluded from Git and deployment packages.


## Saved SQL Editor query

[Carla Diamonds - Supabase setup](https://supabase.com/dashboard/project/xtarpbqfgaykxhuqqoqf/sql/1b70091b-44de-4676-91cc-3e385e21bc60) contains the executed setup query. The readable, re-runnable source is kept in `supabase/setup.sql`.
