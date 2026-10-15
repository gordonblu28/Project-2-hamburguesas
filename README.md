# Stack House Burgers

Website and online ordering app for a burger restaurant: an editorial, animated marketing site plus a working menu, cart,
pickup/delivery checkout and order confirmation.

> **All business details are placeholders.** The address, phone number, hours, prices, tax rate, delivery zones and
> reviews are sample data. Edit `config/restaurant.ts` and `config/menu.ts` before launch.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional
npm run dev                  # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | TypeScript (strict) |
| `npm run lint` | ESLint (Next.js core-web-vitals + TS rules) |
| `npm test` | Unit and component tests (Vitest) |
| `npx playwright test` | End-to-end journey at desktop and mobile sizes (run `npm run build` first; set `PLAYWRIGHT_CHROMIUM_PATH` to use a preinstalled Chromium) |

## Where things live

```
config/restaurant.ts   name, colors, contact, hours, holidays, closures, ordering rules, delivery zones, tax, payments
config/menu.ts         categories, products, prices (integer cents), modifier groups
app/                   routes: / /menu /order /checkout /order-confirmation/[id] /location /contact /our-story + legal pages
app/api/               checkout (POST), orders (GET ?id=), availability (GET), webhooks/stripe (POST)
lib/menu/pricing.ts    modifier validation + pricing + totals; shared by browser and server
lib/availability/      time-zone-aware hours, open/closed status, schedulable slots (via @date-fns/tz)
lib/orders/            order service (validation, idempotency, status rules), repository (storage boundary)
lib/payments/          Stripe Checkout provider + demo mode
lib/cart/              persisted cart (zustand + localStorage), UI state
components/art/        illustrated, layered SVG food art + the asset map (FoodArt.tsx)
components/animations/ GSAP hero + ScrollTrigger burger story, reveal helpers
```

## How ordering works

1. The cart stores product ids, selected modifier ids and quantities — never prices.
2. The browser shows an *estimate* using the same pricing module as the server.
3. `POST /api/checkout` validates everything with Zod, re-prices from `config/menu.ts`, checks product availability,
   modifier rules, delivery zone and minimum, the requested time against opening hours, and the payment method.
4. Each checkout attempt carries an idempotency key; repeated or concurrent submissions return the same order, and a
   reused key with a different payload is rejected (409). The checkout endpoint is rate limited per IP (in-memory).
5. Orders get an unguessable UUID (used in the confirmation URL) and a short human reference (e.g. `SH-4F7K2`).

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, sitemap and payment redirects |
| `STRIPE_SECRET_KEY` | Enables real online payments through Stripe Checkout |
| `STRIPE_WEBHOOK_SECRET` | Verifies `POST /api/webhooks/stripe` (events: `checkout.session.completed`, `…expired`, `…async_payment_*`) |
| `ORDER_STORE` | `file` (default, dev only) or `memory`. Other values throw until a database repository is added |
| `ALLOW_DEMO_PAYMENTS` | `true`/`false`. Defaults to allowed outside production. Demo payments never charge a card |

## Production status — what is and isn't connected

- **Database:** not connected. Orders are written to `.data/orders.json` on the server running the app. This does not
  work on serverless hosting and is not durable. `docs/database.sql` sketches a Postgres/Supabase schema; implement
  `OrderRepository` for it.
- **Payments:** Stripe Checkout is implemented server-side (amounts from the server, idempotent session creation,
  signed webhooks), but no credentials are configured, so it is untested against a live Stripe account. Without a key,
  online payment shows as a clearly labelled demo (dev) or is hidden (production). "Pay at pickup" works as an
  in-person method.
- **Restaurant notification:** orders are **not** transmitted to the restaurant (no POS, email, SMS or tablet
  integration). Confirmation pages say so for demo orders.
- **Staff tools:** no admin dashboard yet. Status transitions are enforced in `lib/orders/status.ts`, ready to be called
  from an authenticated admin API.
- **Photography:** the site ships with original, illustrated SVG food art (layered burgers that power the exploded
  scroll animation). Add real photography per product via `image.photo` in `config/menu.ts`.
- **Legal pages** are drafts and must be reviewed by a lawyer.
- **Maps:** a stylised map links out to Google Maps; no embedded map or API key. Set `restaurant.geo` only with
  verified coordinates (it is then included in structured data).
- **Rate limiting** is in-memory, per instance — use a shared store in multi-instance production.
