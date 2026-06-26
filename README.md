# getownerinfo

Hybrid marketplace platform. Sellers list real estate, vehicles, furniture and more
under two monetization models; buyers pay a **token fee** to unlock verified owner
contact details and exact location. Deals close off-platform; the platform enforces
commission (Model A) and penalties.

See [PLAN.md](PLAN.md) for the full architecture and phased build plan.

## Stack

- **Next.js 14** (App Router) — fullstack
- **MongoDB Atlas** via Mongoose
- **JWT** auth (HttpOnly cookie) + role-based access control
- **Cloudinary** for media
- **AfriPay** for payments (pending credentials)
- **Tailwind CSS**

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run seed                 # categories, settings, initial admin
npm run dev                  # http://localhost:3000
```

The seed creates an admin (`admin@getownerinfo.local` / `ChangeMe123!` by default —
override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`). Change the password after
first login.

`.env.local` is gitignored. Never commit secrets.

## Project structure

```
src/
  app/
    api/auth/         register · login · logout · me
    api/health/       DB connectivity check
    dashboard/        role-routed dashboards (admin · manager · owner · buyer)
    login, register, listings, page.js (landing)
  components/         SiteHeader · DashboardShell · LogoutButton
  lib/                db · env · auth · api · cloudinary · constants · guardRole
  models/             User (more added per phase)
```

## Roles

`admin` · `platform_listing_manager` · `owner` · `buyer` (buyer/tenant/client)

## Build status

- ✅ Phase 0 — Foundation (scaffold, DB, Cloudinary, env)
- ✅ Phase 1 — Auth & RBAC
- ✅ Phase 2 — Catalog, settings, eligibility + pricing engines
- ✅ Phase 3 — Listings, creation wizard, uploads, admin approval, browse
- ✅ Phase 4 — Token-fee unlock (payments, OTP, immutable access log, reveal)
- ✅ Phase 5 — Deal outcome, commission, enforcement, anti-cheating flag
- ✅ Phase 6 — Chat with pre-unlock content filtering + admin override
- ✅ Phase 7 — Penalties (immutable log, enforcement, severe→blacklist)
- ✅ Phase 8 — Seeker requests (post fee, anonymized, view-token unlock)
- ✅ Phase 9 — Analytics (revenue/usage rollups) + audit-log viewer
- ✅ Phase 10 — Cookie consent, security headers, Terms/Privacy

**All 10 phases complete.**
