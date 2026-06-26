# getownerinfo — Implementation Plan

A hybrid marketplace platform where sellers list real estate, vehicles, furniture,
etc. under two monetization models, and buyers pay a **token fee** to unlock owner
contact details and exact location. Deals close off-platform; the platform enforces
commission (Model A) and penalties.

## Tech Stack (confirmed)

- **Framework:** Next.js 14 (App Router) — fullstack (UI + API routes in one repo)
- **Database:** MongoDB Atlas via Mongoose
- **Auth:** JWT + role-based access control (RBAC)
- **Media:** Cloudinary (listing images, ownership-proof docs)
- **Payments:** AfriPay (Mobile Money, Visa/Mastercard, bank transfer)
- **Styling:** Tailwind CSS
- **Notifications:** Email + SMS + in-app (pluggable; stubbed first)

## Roles

`admin` · `platform_listing_manager` · `owner` · `buyer` (buyer/tenant/client)

## Data Models (MongoDB collections)

- **User** — role, profile, verification status, KYC docs (admin-only), penalties balance
- **Category / Subcategory / ItemType** — dynamic catalog; each maps to allowed model(s)
- **PlatformSettings** — Model A price thresholds, token-fee amounts per category,
  commission rules, VAT (18%), discount tiers, penalty config (all admin-editable)
- **Listing** — category refs, owner, ownerType (owner/manager/third-party), quantity,
  location (UPI / street+house / Maps pin), price, model (A/B), duration, expiry,
  status (`draft`→`pending_approval`→`active`→`under_negotiation`→`sold/rented/expired`),
  images, ownershipProof, and **gated fields** (owner phone, keys-manager, exact address)
- **TokenUnlock** — *immutable* access record: userId, listingId, unlocked fields, timestamp
- **Payment** — type (listing_fee / token_fee / commission / penalty), method, amount,
  VAT, status, AfriPay txn ref
- **Commission** — Model A: computed amount, invoice, due date, status
- **Penalty** — type, amount, reason, status (immutable log)
- **Message / Conversation** — chat with pre-token sensitive-info filtering + blocked log
- **SeekerRequest** — buyer "wanted" posts (post fee + view token), anonymized
- **AuditLog** — *immutable* trail of every significant action
- **CookieConsent** — per-user cookie preferences

## Core Logic Engines

1. **Eligibility engine** — given category + unit count + price, decide Model A vs B
   (single-unit + thresholds → A eligible; multi-unit / resellers / below threshold → B default)
2. **Pricing engine** — duration discounts (2mo 20% / 3mo 30% / 6mo 40% / 12mo 50%),
   18% VAT-inclusive
3. **Commission engine** — Model A: on owner-reported outcome, auto-calc + invoice
4. **Token-unlock engine** — pay → reveal gated fields to that user only; watermark + OTP + log
5. **Content filter** — scan chat for phone/email/ID/name/links pre-token; block + log
6. **Penalty engine** — event-triggered (late status update, under-reporting, abuse) →
   50% of expected fee/commission + 100,000 Rwf fixed (configurable)

## Phased Build

| Phase | Deliverable |
|-------|-------------|
| **0. Foundation** | Next.js scaffold, Tailwind, `.env.local` (gitignored), Mongo + Cloudinary connection helpers, base layout, folder structure, `.gitignore` |
| **1. Auth & RBAC** | Register/login, JWT, role middleware, user model, role-routed dashboard shells |
| **2. Catalog & settings** | Category/Subcategory/ItemType models + seed; PlatformSettings (thresholds, fees, VAT, discounts, penalties) |
| **3. Listings + eligibility** | Listing model, eligibility + pricing engines, 11-step creation wizard, Cloudinary uploads, admin approval workflow |
| **4. Token unlock** | TokenUnlock model, AfriPay payment, field masking/reveal, watermark, OTP, anti-abuse logging |
| **5. Deal & commission (Model A)** | Owner outcome reporting, commission auto-calc, invoice, payment enforcement + listing restrictions |
| **6. Chat + content filter** | Conversations, sensitive-info scanner, blocked-message log, post-token free chat, admin override |
| **7. Penalties** | Trigger engine, calc, enforcement, owner + admin penalty views |
| **8. Seeker requests** | Seeker posts, post fee + view token, anonymization, chat rules, expiry/status |
| **9. Dashboards & analytics** | Owner / buyer / admin dashboards, revenue analytics, audit log views, reports |
| **10. Cookies & compliance** | Cookie consent banner + settings, security headers, Terms/Privacy pages, QA pass |

## Conventions

- All money in **Rwf**, stored as integers (no floats); VAT computed inclusively
- Immutable logs (TokenUnlock, AuditLog, Penalty) are append-only — never updated/deleted
- Gated fields never sent to the client until a valid TokenUnlock exists for that user+listing
- KYC / ID / ownership certs are **admin-only**, never exposed to buyers even post-token

## Open items to confirm during the build

- The "full detail attachment" for exact listing fees & commission % per category
  (Part 2 / Part 12 attachments) is not in the doc — I'll use configurable placeholder
  values in PlatformSettings until you provide the real numbers.
- AfriPay API docs/keys — needed for Phase 4. I'll build against a clean payment
  interface and stub it until credentials/endpoints are provided.
