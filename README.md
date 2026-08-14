# GoCart. — Multi-tenant Storefronts with WhatsApp Ordering

A white-label, multi-vendor e-commerce platform where every vendor has what feels like their own standalone e-commerce website. All purchases are handled through **WhatsApp** instead of online payments.

## Principles
- **No payment system.** No Buy Now, no payment gateway, no checkout payment flow. Customers add to cart, then click **Order on WhatsApp** to open a prefilled chat with that vendor.
- **Strict store isolation.** Each `/<slug>` storefront shows only that vendor's products, branding, and WhatsApp number.
- **White-label feel.** Each store has its own navbar, banner, logo, brand color, and WhatsApp CTA — not a shared marketplace chrome.
- **Per-store cart.** One WhatsApp order per vendor; no cross-vendor cart.

## Stack
Next.js 16 (App Router) · Prisma 6 (Neon Postgres) · Clerk · ImageKit · Inngest · OpenAI · Redux Toolkit · `qrcode.react`.

## Getting started

```bash
npm install
cp .env.example .env   # fill in Clerk, Neon, ImageKit, OpenAI, etc.
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page lists all live stores. Each store lives at `/<slug>`.

## Key flows
1. **Vendor** signs in, applies to open a store at `/create-store`, uploads logo / WhatsApp / brand color.
2. **Admin** approves the store at `/admin/approve`.
3. **Vendor** adds products (with optional sizes / colors) at `/store/add-product` and edits them at `/store/manage-product`.
4. **Customer** visits `/<slug>`, browses, adds items to the per-store cart, and clicks **Order on WhatsApp** at `/<slug>/cart` — a wa.me link opens with a prefilled order message containing the items, size, color, quantity, and total.
5. The same click also creates an in-app order log (`status=ORDER_PLACED`) that the vendor can update at `/store/orders` (PROCESSING → SHIPPED → DELIVERED).
6. Vendor gets a **QR code** at `/store/qr` that encodes their storefront URL.

## What's gone vs. the original GoCart
- No Stripe, no PaymentMethod enum, no `isPaid` flag.
- No coupons, no `Coupon` model, no `/admin/coupons`, no banner promo.
- No shipping address collection; orders are conversations on WhatsApp.
- No global cart; cart is per-store and lives in the browser (`localStorage`).
- `/shop` and `/product/:id` are replaced by `/<slug>` and `/<slug>/product/:id`.

## Project structure (highlights)
- `app/(public)/[username]/...` — vendor storefront (home, product, cart)
- `app/store/...` — vendor dashboard (products, orders, QR, settings)
- `app/admin/...` — admin dashboard (approve stores, suspend/delete, products, categories)
- `app/api/orders` — logs WhatsApp orders
- `lib/whatsapp.js` — wa.me link + phone number sanitizer
- `lib/features/cart/cartSlice.js` — per-store cart, persisted in `localStorage`
- `prisma/schema.prisma` — see models `Store`, `Product`, `Order`, `OrderItem`, `Category`
