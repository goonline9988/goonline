# ROADMAP — Multi-Vendor E-commerce Platform (WhatsApp Ordering, No Payments)

A white-label, multi-vendor storefront platform where every vendor has what feels like their own standalone e-commerce website. All purchases are handled through WhatsApp instead of online payments.

## Principles
- **No payment system.** No Buy Now, no payment gateway, no checkout payment flow, no online payment methods.
- **Order on WhatsApp** replaces purchase. Customer lands on a vendor's storefront, picks size/color/qty, clicks **Order on WhatsApp**, and WhatsApp opens with a prefilled message to that vendor's number.
- **Strict store isolation.** Each `/<slug>` storefront shows only that vendor's products, branding, and WhatsApp number. No cross-vendor product, branding, or number ever leaks.
- **White-label feel.** Each store has its own navbar, banner, logo, brand color, and WhatsApp CTA — not a shared marketplace chrome.
- **Scalable.** Slug-based routing, per-store cart, vendor-scoped data fetches.

## Stack
Next.js 16 (App Router) · Prisma 6 (Neon Postgres) · Clerk · ImageKit · Inngest · OpenAI · Redux Toolkit. Stripe removed. `qrcode.react` added.

---

## Decisions
1. **Cart:** Keep, but make it **per-store** (one WhatsApp order per vendor). Strip COD/Stripe/coupon/address from checkout; replace `Place Order` with a single WhatsApp deep-link. No cross-vendor cart (isolation).
2. **Order log:** Keep `Order`/`OrderItem` in DB; vendor updates status manually post-WhatsApp. Drop `isPaid`, `paymentMethod`, `coupon` fields, `PaymentMethod` enum, `addressId` FK.
3. **Variants:** Add `sizes String[]` and `colors String[]` to `Product`; buyer selects on product page; selection persists in `OrderItem.size`, `OrderItem.color`.
4. **Slug:** Reuse existing `Store.username @unique` as the public storefront slug. Routing moves from `/shop/[username]` to `/[username]`.
5. **Platform home:** Rebuild `/` as a **directory of stores** (cards → `/<slug>`). Remove `LatestProducts`/`BestSelling`/`CategoriesMarquee` cross-vendor sections and the `/shop` all-products listing.
6. **QR code:** Client-side via `qrcode.react`; PNG/SVG download from canvas. Encodes `${origin}/<slug>`.
7. **Coupons & Address:** Remove both entirely (model, admin page, Inngest job, promo banner, address modal + slice).
8. **Store isolation:** Strict — no cross-vendor leak in homepage, search, product-detail (`/[slug]/product/[id]` verified to belong to slug), or cart.

---

## Phase 1 — Schema & Data Foundation
- **`prisma/schema.prisma`**:
  - `Product`: add `sizes String[] @default([])`, `colors String[] @default([])`.
  - `OrderItem`: already has `quantity Int`; add `size String?`, `color String?`.
  - `Order`: remove `isPaid`, `paymentMethod`, `isCouponUsed`, `coupon`, `addressId` + `address Address` relation. Keep: `id, total, status, userId, storeId, createdAt, updatedAt, orderItems, user, store`.
  - Remove `enum PaymentMethod`.
  - Remove `model Coupon`, `model Address`.
  - `User`: remove `cart Json` column (cart moves client-side per-store). Drop `Address Address[]` relation.
  - `Store`: add `banner String?`, `brandColor String?`, `theme Json @default("{}")`, `whatsapp String?` (keep existing `contact` for general line; `whatsapp` for the deep-link).
  - Add `model Category { id, name @unique, slug @unique, image String?, createdAt, products Product[] }`. Migrate `Product.category String` → `Product.categoryId String?` + relation (backfill existing strings).
  - `OrderStatus`: keep (`ORDER_PLACED/PROCESSING/SHIPPED/DELIVERED`) for vendor manual status.
- Run `npx prisma migrate dev`. Backfill: copy `Product.category` strings into `Category`, link up.
- Remove `stripe` from `package.json`; add `qrcode.react`. `npm install`.

## Phase 2 — Strip Payment / Coupons / Address / Cart-as-is
- **Delete files:** `app/api/stripe/route.js`, `app/api/coupon/route.js`, `app/api/admin/coupon/route.js`, `app/admin/coupons/page.jsx`, `components/AddressModal.jsx`, `lib/features/address/addressSlice.js`, `app/api/address/route.js`, `app/(public)/loading/page.jsx` (Stripe success redirect), `components/OrderSummary.jsx` (rebuilt in Phase 5).
- **Edit `app/api/orders/route.js`:** drop Stripe, PaymentMethod, coupon lookup (lines 3,5,14,17,21-47,70-72,86-88,101-128,130-134,145-160). POST a plain WhatsApp-style order; GET scoped to user.
- **Edit `components/admin/AdminSidebar.jsx`:** remove Coupons link (line 20).
- **Edit `inngest/functions.js` + `app/api/inngest/route.js`:** remove `deleteCouponOnExpiry`.
- **Edit `components/Banner.jsx`:** remove NEW20 coupon clipboard promo (lines 9-20); replace with a generic platform banner.
- **Edit `assets/assets.js`:** remove `couponDummyData` (267-273), `dummyUserData.cart` (322), order/address dummy fields.
- **Edit vendor orders page** `app/store/orders/page.jsx`: remove Payment/Coupon `Payment`/`Paid`/`coupon` columns (lines 71,88,89-97,160-164). Add Size/Color column to modal.
- **Edit `components/Navbar.jsx`:** remove cart badge + cart link (lines 2,6,16,50-54,78-86) — cart moves to store-scoped navbar.
- **Edit `app/(public)/layout.jsx`:** remove `fetchCart`/`uploadCart`/`fetchAddress` + the cart useEffects (lines 9-10,19,25-37).

## Phase 3 — Vendor Branding & Store Settings
- Schema additions from Phase 1 drive this.
- **New `app/store/settings/page.jsx`** with form: shop name, description, logo upload, banner upload, brand-color picker, theme (optional JSON), WhatsApp number, general contact. Submit → new `PATCH /api/store/settings/route.js` (authSeller-guarded, ImageKit upload for logo/banner reusing `app/api/store/create/route.js:45-59` pattern; `folder:"logos"`/`"banners"`).
- **Edit `app/(public)/create-store/page.jsx` + `app/api/store/create/route.js`:** add `whatsapp`, `banner`, `brandColor` to the registration flow (optional fields; collect later in Settings).
- Add Settings link to `components/store/StoreSidebar.jsx`.

## Phase 4 — Isolated Slug Storefront (`/<slug>`)
- **New route `app/(public)/[username]/page.jsx`** (single dynamic segment; Next static routes take priority so reserved paths still match). Fetch `GET /api/store/data?username=…` (existing API already isolates products). Render store-scoped layout (own navbar/banner, NO platform Banner/Navbar/Footer).
- **New layout** `app/(public)/[username]/layout.jsx` → renders `StoreNavbar` (store logo+name+WhatsApp CTA, store-scoped search, per-store cart icon) instead of marketplace chrome.
- **Store-scoped product detail:** new `app/(public)/[username]/product/[productId]/page.jsx` — fetch single product, verify `product.storeId === <store's id>`, else `notFound()`. Drop the shared `/product/[productId]` route (or keep as a redirect).
- **Store-scoped cart page:** `app/(public)/[username]/cart/page.jsx` — cart state keyed by `storeId` (redux `cartByStore: { [storeId]: { items } }`). Checkout = single WhatsApp deep-link to that store's `whatsapp` number listing all items + size/color/qty.
- **Search** inside store scope only (`?q=` filter on the store's own products).
- **Redirect** old `/shop/<username>` → `/<username>` (301) for back-compat; delete `app/(public)/shop/[username]` and `app/(public)/shop` listing.
- **`/api/products/route.js`:** repurpose to `?storeId=` scoped or deprecate; platform home no longer needs it.

## Phase 5 — Per-Store Cart + WhatsApp Checkout
- **Rewrite `lib/features/cart/cartSlice.js`** keyed by `storeId`: `addToCart({storeId, product, size, color, qty})`, `removeFromCart`, `clearStoreCart(storeId)`. No server persistence — local + localStorage.
- **New `components/OrderSummary.jsx`** (store-scoped): lists items for `storeId`, builds WhatsApp message:
  ```
  Hello <Store name>,

  I want to order:
  1. Product: Nike Air | Size: 8 | Color: Black | Qty: 1
  2. Product: ... | ...

  Store: Classic Shoes
  ```
  `<a href={https://wa.me/<digits-only whatsapp>?text=encodeURIComponent(msg)} target="_blank">Order on WhatsApp</a>`.
- On click, POST to `/api/orders` to create the in-app log (`status=ORDER_PLACED`, items with size/color), then open WhatsApp.
- **Per-product "Order on WhatsApp"** on the product-detail page: same wa.me link with a single product (single-item shortcut) per the spec example.
- Sanitize `whatsapp`: strip non-digits, drop leading `+`; if no country code, default-prefix (configurable env `DEFAULT_WA_COUNTRY`).

## Phase 6 — QR Code (Client-side)
- **New `app/store/qr/page.jsx`** (vendor dashboard): shows QR rendered from `${origin}/<username>` via `qrcode.react`. Buttons: **Download PNG** and **Download SVG** (build SVG string from the QR matrix; PNG from canvas `.toDataURL`).
- Add QR link to `components/store/StoreSidebar.jsx`.
- Optionally also show QR on the public storefront footer for scan-to-share, plus a **download/view QR** card on the store Settings page.

## Phase 7 — Vendor Dashboard Gaps
- **Product edit + delete:** new `PATCH /api/store/product/route.js` (update fields + replace images via ImageKit) and `DELETE /api/store/product/route.js`. New edit UI in `app/store/manage-product/page.jsx` (modal/inline edit) + delete button.
- **Variants** in add-product/edit forms: size & color multi-input (comma-separated or chip input) → stored as `String[]`.
- **Categories:** replace hardcoded list (`app/store/add-product/page.jsx:11`) with `GET /api/categories` (public) reading from DB.
- **Orders page** refined (already kept in Phase 2 edits): add small filters (status, date) — optional.

## Phase 8 — Admin Dashboard Gaps
- **Vendor delete:** new `DELETE /api/admin/store/route.js` (`prisma.store.delete` cascades `Product`; manually unlink/clean `Order`/`Rating`). Delete button in `app/admin/stores/page.jsx`. Rename "toggle isActive" → "Suspend/Unsuspend".
- **Product moderation:** new `app/admin/products/page.jsx` + `GET /api/admin/products` (all products w/ store), with `Hide`/`Delete` actions (`PATCH inStock`/`DELETE /api/admin/product`).
- **Category CRUD:** new `app/admin/categories/page.jsx` + `app/api/admin/category/route.js` (GET/POST/PATCH/DELETE). Sidebar link.
- **Commission (optional stub):** add `commissionPercent Float @default(0)` to `Store` (or `Category`). Admin UI to set per-vendor/per-category. Dashboard revenue card keeps gross sum; add a separate "projected commission" calc (display-only, no payment flow).
- **Dashboard cards** `app/api/admin/dashboard/route.js`: remove revenue dependency on Stripe-paid; count all orders regardless of `isPaid` (gone).

## Phase 9 — Cleanup & Verify
- Remove `.env` Stripe keys; `npm uninstall stripe`.
- Update `.env.example` (`DEFAULT_WA_COUNTRY`, keep `ADMIN_EMAIL`, imagekit, clerk, neon, currency, openai).
- Lint + typecheck: `npm run lint`, `npm run build`.
- Manual flow test: register a vendor → admin approves → vendor adds product w/ size/color + whatsapp → visit `/<slug>` → add to cart → Order on WhatsApp (deep-link opens, message correct, store's own number) → vendor order log row created → vendor updates status.
- Update `README.md` (and consider `How_To_Run_Project.pdf` text).

---

## File-impact rollup
- **New (~20):** `[username]/page.jsx`, `[username]/layout.jsx`, `[username]/product/[productId]/page.jsx`, `[username]/cart/page.jsx`, `app/store/qr/page.jsx`, `app/store/settings/page.jsx`, `PATCH/DELETE /api/store/product`, `PATCH /api/store/settings`, `app/admin/categories`, `app/admin/products`, `app/api/admin/category`, `app/api/admin/products`, `app/api/admin/store` (DELETE), `app/api/categories`, rewritten `cartSlice.js` + `OrderSummary.jsx`, new `StoreNavbar`-scoped chrome.
- **Delete (~12):** `app/api/stripe`, `app/api/coupon`, `app/api/admin/coupon`, `app/api/address`, `app/admin/coupons`, `components/AddressModal`, `lib/features/address/addressSlice`, `app/(public)/loading`, old `OrderSummary.jsx`, plus `/shop` listing + `/shop/[username]` after redirect.
- **Edit (~15):** `prisma/schema.prisma`, `app/api/orders/route.js`, `app/(public)/layout.jsx`, `components/Navbar.jsx`, `components/store/StoreSidebar`, `components/admin/AdminSidebar`, `app/admin/page.jsx`, `inngest/functions.js`, `app/api/inngest/route.js`, `components/Banner.jsx`, `assets/assets.js`, `app/store/orders/page.jsx`, `app/store/manage-product/page.jsx`, `app/(public)/create-store/page.jsx` + `/api/store/create`, `app/api/products/route.js`, `app/(public)/page.jsx` (store directory).
- **Deps:** `−stripe`, `+qrcode.react`.

---

## Quick reference — confirmed codebase anchors
- Storefront slug: `prisma/schema.prisma:150` (`Store.username @unique`) → reused as `/<slug>`.
- Existing isolated store fetch: `app/api/store/data/route.js:16-25`.
- Product page (no variants, no WhatsApp): `components/ProductDetails.jsx:11,16,59-71`.
- Variants absent: `prisma/schema.prisma:28-45` (Product) and `app/api/store/product/route.js:18-23` (create).
- Store `contact` exists (`schema.prisma:156`) but unused customer-facing; only `components/admin/StoreInfo.jsx:28` renders it. New `whatsapp` field added.
- No QR code references anywhere; no QR lib in `package.json`.
- Admin gate email env: `middlewares/authAdmin.js`. Seller gate: `middlewares/authSeller.js` (returns `store.id` iff `status === 'approved'`).
- ImageKit upload pattern (reusable for banner/QR/logo-edit): `app/api/store/create/route.js:44-59`, `app/api/store/product/route.js:29-46`.