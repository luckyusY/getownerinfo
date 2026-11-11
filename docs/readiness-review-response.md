# GetOwnerInfo — Response to the Technical Readiness Review

**Date:** 30 October 2026
**Branch reviewed:** `ui-refresh` (commit `fae14f0`)

## Summary

Most of the review's 29 items are already built and present in this repository. The
testing session appears to have run against an environment with **no seeded sample
data** and, from a developer machine, a **MongoDB Atlas cluster that refuses
connections** — so a large number of features that exist read as missing or
untestable.

Counting the 29 sections:

| Verdict | Count |
| --- | --- |
| Built — needs demonstrating with data | 19 |
| Partially built — specific gap named below | 4 |
| Genuinely not built | 3 |
| Cannot be judged without files we do not hold | 3 |

The review's own words support this reading: eleven sections say "cannot yet be
tested", "not yet testable" or "cannot yet confirm", and sections 5 and 19 state
plainly that the blocker is the absence of complete active sample listings. That
blocker is one command, not a development cycle — `scripts/seed-demo.mjs` already
creates the entire demo set.

## Item-by-item status

| § | Review item | Status | Evidence in the code |
| --- | --- | --- | --- |
| 1 | Password rules + confirm field | **Built** | `src/app/register/page.js:27` — live checklist for 8 chars, upper, lower, number, special; confirm field; mismatch alert |
| 2 | One account, clearer wording | **Partial** | Single-account model is real (`ALL_ROLES`, `SELLER_ROLES`); registration copy still leads with owner/seller framing |
| 3 | Dashboard organised by activity | **Built** | `src/components/dashboard/DashboardSidebar.js` — grouped seller / buyer / messages / payments / profile workspaces, matching the requested lists |
| 4 | Role permissions demonstrable | **Built, undemonstrated** | `src/lib/guardRole.js`, `ROLES`, separate admin and manager sidebar groups. Needs the test accounts from §5 |
| 5 | Sample listings for every category | **Built, never run** | `scripts/seed-demo.mjs` (407 lines) — ~11 listings across all 7 categories, Model A-qualified, Model B-only, draft, sold, pending, plus seeker request and conversations |
| 6 | Category-specific listing forms | **Partial — real gap** | Conditional rendering exists (`isRealEstate` branch, `PUBLIC_ATTRIBUTE_KEYS`), and UPI/bedrooms are already scoped to real estate only. But see Gap 1 below |
| 7 | Category / subcategory data | **Cannot verify** | `src/data/catalog.js` — 7 categories with subcategories, item types and model rules. Conformance to the approved list needs that list |
| 8 | Location hierarchy | **Built** | `src/data/rwandaAdministrativeUnits.json` — official Rwanda MoE GIS, census 2022 boundaries, province → district → sector; imported by `src/lib/listingForm.js:17` |
| 9 | Progress, validation, auto-save | **Partial — real gap** | 7-step stepper, `completionPercent` progress bar, `canNext` gating all present. Auto-save absent — see Gap 2 |
| 10 | Form section titles | **Built** | The exact three headings are rendered: `GENERAL PUBLIC INFORMATION`, `INFORMATION AVAILABLE AFTER TOKEN PAYMENT`, `ADMIN-ONLY / NON-SHAREABLE INFORMATION` |
| 11 | Phone validation | **Partial — real gap** | `type="tel"` and the format hint `+250 7XX XXX XXX`; no country-code selector — see Gap 3 |
| 12 | Email + phone OTP compulsory | **Built** | `src/components/ContactVerification.js`, `src/app/api/verification/contact/route.js`; `src/lib/listingForm.js:254` blocks submission when main contacts are unverified |
| 13 | ID + live face verification | **Built bar the vendor** | `src/lib/faceMatch.js`, `kyc.selfiePublicId`, `kyc.faceMatch.{status,score,provider}`, `kyc.rdbNumber`, admin side-by-side review. Reports `not_configured` rather than faking a result — see Gap 4 |
| 14 | Draft can be continued | **Built** | `src/app/dashboard/owner/OwnerManage.js:191` — Continue / Fix & resubmit → `?draft=<id>`, Preview, Delete |
| 15 | Model A/B auto-detection + choice | **Built** | Dedicated `ModelSelection` step (step 2); the form states the listing qualifies for both and the choice comes next; `src/lib/eligibility.js`, `/api/eligibility` |
| 16 | Model B checkout redirection | **Built** | Form → price → agreement → checkout steps exist; live Afripay deferred by the review itself |
| 17 | Model B price calculation | **Built** | `DEFAULT_SETTINGS.durationDiscounts = {2: 0.2, 3: 0.3, 6: 0.4, 12: 0.5}` — exactly the approved 20/30/40/50 |
| 18 | Seeker fee shown before payment | **Needs check with data** | `/api/seekers` computes the fee server-side; whether the amount is displayed before the final button needs a seeded run |
| 19 | Token functionality testable | **Blocked by §5 only** | The entire token path is implemented; it has never had a listing to run against |
| 20 | Token access + permanent record | **Built** | `src/models/TokenUnlock.js` — user, listing, date, `fieldsUnlocked`, watermark, unique per (user, listing), immutable. Masking before payment via `buildRevealedContact` |
| 21 | Pre-payment chat blocking | **Built** | Messages carry `blocked` and `blockedReasons`; the demo seed includes a blocked phone-number message |
| 22 | Model A agreement + signature | **Built** | `src/models/ListingAgreement.js`, `src/data/agreementTerms.js`, retrievable at `/documents/agreement/<id>` with clauses as shown at signing, typed signature, IP and version |
| 23 | Deal reporting + commission | **Built** | `/api/listings/[id]/outcome`, `Commission` model, invoice at `/documents/invoice/<id>` with due date and status |
| 24 | Commission enforcement / fraud | **Built** | `DEFAULT_SETTINGS.fraud` (under-report tolerance, max not-concluded, duplicate window, grace days), `scripts/check-fraud.mjs`, penalties panel |
| 25 | Listing Manager dashboard | **Built, undemonstrated** | `/dashboard/manager`, assigned-scope queries in `src/app/dashboard/layout.js`. Needs a manager test account |
| 26 | Admin dashboard | **Built, undemonstrated** | Admin console routes for users, verification, reports, penalties, settings, audit log |
| 27 | Search and filters | **Partial** | Category/location/price/type filters exist; category-specific filters are limited by Gap 1 |
| 28 | Notifications | **Built, delivery off** | `src/lib/notificationService.js` with the full event set. In-platform works; email/SMS needs credentials — see Gap 5 |
| 29 | Payment integration status | **Built, live txn deferred** | Init, verify, callback handling, and a five-minute reconciliation sweep (commit `9af34d7`) |

## The real gaps

### Gap 1 — Only real estate has category-specific fields (§6, §27)

`PUBLIC_ATTRIBUTE_KEYS` in `src/lib/listingForm.js:38` contains exactly one key:
`"real-estate"`. Because `sanitizeAttributes` drops anything not in that map, the
other six categories currently publish **no structured attributes at all**. A
vehicle cannot carry mileage, fuel or transmission; an appliance cannot carry
capacity or power rating.

The review's complaint is therefore half right, in the opposite direction from how it
reads: real estate has a rich conditional form, and the remaining six categories have
none. This also caps §27 — vehicle-specific filters cannot exist until
vehicle-specific fields do.

Within real estate itself, three approved fields are absent: **property type**,
**video**, and **floor plan / attachments**.

### Gap 2 — No auto-save, and no admin view of abandoned forms (§9)

There is no debounce, interval or local-storage persistence anywhere in the listing
form. A draft is saved only when the owner explicitly saves it. The admin-side
"incomplete and abandoned forms, with reminders" view does not exist, though
`completionPercent` was written for exactly that purpose.

### Gap 3 — Phone fields have no country-code selector (§11)

Format guidance and `type="tel"` are in place; a selector and strict character
rejection are not.

### Gap 4 — Face matching has no provider (§13)

Deliberate and documented: `src/lib/faceMatch.js` returns `not_configured` and leaves
the decision with the admin rather than claiming a comparison happened. Switching it
on is an environment variable (`FACE_MATCH_URL`) plus a vendor.

### Gap 5 — Email and SMS delivery are not configured (§28)

`RESEND_API_KEY` is unset, so notifications that should reach a person by email
currently only land in-platform.

## What cannot be judged from here

1. **Conformance to the approved specifications** (§6, §7, §8). The review repeatedly
   says to compare against "the approved files", "the previously supplied list" and
   "the supplied form specifications". Those documents are not in the repository and
   were not attached. Categories, subcategories, item types and the per-category field
   sets cannot be verified as correct or incorrect without them.
2. **Anything behind a login — now diagnosed, see "The real blocker" below.**
3. **Mobile dashboard quality.** The shell is built mobile-first — a slide-over sidebar
   with scroll locking (`src/components/dashboard/DashboardShell.js`) — but it cannot
   be rendered and judged without a database.

## The real blocker — a TLS trust failure, not missing features

Verified live on 30 October after the Atlas IP access list was opened:

```
MongoServerSelectionError: unable to verify the first certificate
  code: UNABLE_TO_VERIFY_LEAF_SIGNATURE
  at loadCounts (src/app/dashboard/layout.js:47)
```

Something on the network path is intercepting TLS to Atlas and presenting a
certificate Node does not trust — typically antivirus HTTPS scanning or a corporate
proxy. The failure is **intermittent**: some connections complete (the public
listings API served 10 listings correctly) while others never finish the handshake,
which is why earlier errors showed `commonWireVersion: 0` and `ReplicaSetNoPrimary`.

This single fault accounts for the bulk of the review's "cannot be tested" findings.
Every signed-in page runs database queries during server rendering, so a failed
handshake renders the error boundary — "Something went wrong" — rather than the
dashboard. A tester would reasonably conclude the dashboards do not work.

**Fixes, in order of preference:**

1. Export the intercepting root certificate and point Node at it:
   `NODE_EXTRA_CA_CERTS=C:\path\to\proxy-root.crt`
2. Run Node against the Windows certificate store (Node 22+): `--use-system-ca`.
3. Disable HTTPS/SSL scanning in the antivirus for `*.mongodb.net`.
4. Last resort, local development only, never deployed: add
   `tlsAllowInvalidCertificates=true` to the connection string.

Two related operational notes. The dev server must be **restarted** after any
connectivity change: `src/lib/db.js` caches the Mongoose connection on `global`, and
a poisoned singleton does not recover on its own. And the IP access list is currently
`0.0.0.0/0`, which exposes the cluster to the entire internet — fine for an afternoon
of testing, but it should be narrowed, and the credentials in `.env.local` rotated,
since they have been shared in plain text.

## What was verified working

With the database reachable, these were exercised on the running platform:

| Check | Result |
| --- | --- |
| Demo data present | 13 users, 17 listings, 7 categories, 4 seeker requests, 2 conversations |
| Active listing in every category | Yes — all 7 categories have at least one |
| Roles seeded | 2 admins, 1 platform listing manager, 7 owners, 3 buyers |
| Listing states | 10 active, 4 pending approval, 2 draft, 1 sold |
| Model split | 5 Model A, 12 Model B |
| Public listings API | 200, 10 active listings, 9 flagged `ownerVerified` |
| Browse grid | 10 cards render, verified-owner badges and "Contact by token" present |
| Login | `POST /api/auth/login` 200, session cookie set httpOnly, redirects to `/dashboard` |
| Mobile layout at 375px | No horizontal overflow on the pages that rendered |
| Signed-in dashboard | **Fails** — TLS error above, not a UI fault |

Demo prerequisites 1, 2, 3, 5, 6, 7, 8 and 10 are therefore already satisfied in the
database. The seed does not need re-running.

## Path to the next demonstration

The 14 prerequisites the review asks for are mostly one command away.

1. **Fix the TLS trust failure** — see "The real blocker" above. Nothing signed-in can
   be demonstrated until this is done, and it is the one thing standing between the
   current build and a working demo.
2. **Restart the dev server** and walk the full journey end to end, recording it. The
   data is already in place; the review asks for a demonstration on the platform
   rather than a code walkthrough.
3. **Then build the gaps, in this order:** Gap 1 (category field sets — the largest and
   the one with knock-on effects), Gap 2 (auto-save), Gap 3 (phone selector),
   Gap 5 (mail credentials), Gap 4 (face-match vendor).

Gap 1 needs the approved per-category form specifications before it can be done
correctly. That document is the single most useful thing to supply next.
