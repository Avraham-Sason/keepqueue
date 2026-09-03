# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Keepqueue** is a SaaS appointment management platform for small service businesses (salons, clinics, etc.). It is **one monorepo** (`Avraham-Sason/keepqueue`) holding two applications plus the infrastructure that ships them:

- `keepqueue-client/` — Next.js 16 frontend (App Router, React 19, TypeScript), deployed by Vercel
- `keepqueue-server/` — Express.js REST API (TypeScript, Firebase Admin SDK), deployed to a self-hosted VPS
- `infra/` — the host deploy script
- `firestore.rules` / `firebase.json` — database security rules, deployed to Firebase

The client and server were separate repositories until they were merged; the archived originals are `keepqueue-client` and `keepqueue-server` on GitHub. Do not push there.

---

## Commands

### Setup
Both apps read **one `.env` at the repo root**. Copy `.env.example` and fill it in — the client half is the
`NEXT_PUBLIC_*` Firebase web config, the server half is the Firebase Admin service account. Next only reads env
files from its own package, so `keepqueue-client/next.config.ts` loads `../.env` explicitly; on Vercel the
platform injects the vars and that load is a no-op.

### Client (`keepqueue-client/`)
```bash
pnpm dev        # Dev server with Turbopack
pnpm build      # Production build
pnpm lint       # ESLint (flat config in eslint.config.mjs; `next lint` was removed in Next 16)
```

### Server (`keepqueue-server/`)
```bash
npm start       # Dev server with nodemon + ts-node
npm run build   # Compile TypeScript → dist/
npm run startjs # Build then run compiled output
```

### Deploy (repo root)
There are **three** deploy targets, and a push only covers the first.

```bash
npm run deploy          # all three: push (Vercel) → VPS → Firestore rules
npm run deploy:client   # git push; Vercel builds on its own
npm run deploy:server   # ssh + infra/deploy.sh on the host
npm run deploy:rules    # firebase deploy --only firestore:rules
npm run deploy:rollback # redeploy the revision in /var/lib/keepqueue/previous-rev
npm run logs | status | health
```

`infra/deploy.sh` runs on the host: fetch, `pnpm install --frozen-lockfile`, build, and only then restart and poll `/health`. A failure before the restart leaves the running service untouched.

### Firestore rules tests
```bash
cd rules-test && npm test    # 29 assertions against the Firestore emulator
```
Run this before `deploy:rules` — the rules are the one artefact where a mistake locks real users
out, and the suite asserts both that each hole stays shut and that the product still works. It
pins `firebase-tools@13` because the current release needs JDK 21 and this machine has 17.

---

## Architecture

### Client ↔ Server Communication
- Client calls the Express API via `lib/helpers/api.ts` → `apiCall<T>(method, endpoint, url, data)`.
- Every request attaches a **Firebase ID token** as `Authorization: Bearer <token>`. `apiCall` waits for Firebase to finish restoring the session before reading the token, and retries once with a force-refreshed token on a 401.
- Server URL is `https://api.keepqueue.com` in production, `http://localhost:9000` in dev.
- Client also reads **Firestore directly** for real-time data via `lib/firebase/firestore/`. This is deliberate for reads and a known problem for writes — see *Two doors*, below.

### Two doors into the data
The browser reaches Firestore by two independent paths, and locking one does not lock the other:

```
browser ──→ api.keepqueue.com   (Express, guarded by authGuard + ownership)
   └──────→ Firestore            (directly, guarded only by firestore.rules)
```

Anything that changes access control has to be considered on both paths. `firestore.rules` is currently shaped around the collections the client still writes to directly; when those writes move behind the API, the rules can tighten to reads only.

**A `/data/*` route is not automatically safe because it is behind `authGuard()`.** A signed-in
caller is still a stranger to everyone else's records, so a route must derive its scope from
`req.user`, never from the request body. `/data/getCollection` was the counter-example — it
took the collection name and filters from the caller — and was deleted rather than patched.
`/data/getBusiness` is the other shape worth knowing: it is deliberately public, uses
`attachUserIfPresent()` to learn who is asking without rejecting anonymous callers, and returns
the full record only to the business's owner.

### Server: In-Memory Cache
The server loads all Firestore collections into a singleton `CacheManager` on startup — there are **no per-request DB queries**. Data endpoints filter and transform this in-memory cache.

- `src/managers/cacheManager.ts` — typed get/set/delete/merge operations
- `src/firebase/initialCache.ts` — bootstraps cache from Firestore at startup
- API routes under `/data/*` query the cache; routes under `/actions/*` mutate Firestore and update the cache

The cache is per-process. Any correctness check that reads it (overlap detection, rate limiting) is only as strong as a single instance, and is not safe to rely on if the server is ever scaled out.

### Identity: the users document id IS the Firebase Auth uid

This is load-bearing in three places at once, and breaking any one of them breaks the account:

- **`firestore.rules`** permits `users/{userId}` only when `userId == request.auth.uid`. A collection query filtered on `email` cannot prove that constraint, so Firestore rejects the whole query — profiles must be read **by document id**, never looked up by email.
- **Every server ownership check** resolves users by uid: `authGuard`, `requireBusinessOwnership`, `requireSelfOrBusinessOwner`, `requireRecordAccess`, and the `usersMap` cache, which is keyed by document id.
- **Both writers** honour it: client signup uses `setDocument("users", uid, ...)` and the admin endpoint uses `db.collection("users").doc(authUser.uid).set(...)`.

Profiles created any other way (the old `addDoc` path, which assigns a random id) are invisible to the server and unreadable by their own owner. `keepqueue-server/scripts/migrate-user-ids.ts` re-keys legacy documents and rewrites the references that point at the old id — run it (dry run first, then `--apply`) before deploying rules to a database that predates this contract.

### Operator account

There is exactly one admin, created by hand:

```bash
cd keepqueue-server && npm run admin:create -- admin@keepqueue.com 'a-long-password'
```

It sets the `admin` custom claim and writes `users/{uid}` with `type: "admin"`. The claim is the authority; the document only tells the client to route the session to `/admin`. The operator must sign out and back in for the new claim to appear in their ID token. Businesses and their owners are created from `/admin` — there is no self-serve business creation during the free pilot.

### Server: Middleware
Four middlewares in `src/middlewares/`, applied per route in this order:

| Middleware | File | What it proves |
|---|---|---|
| `authGuard(role?)` | `authGuard.ts` | the caller holds a valid Firebase token, and optionally that their account is `business` / `customer` / `staff` / `admin` |
| `validateBody(schema)` | `index.ts` | the body matches a Zod schema; answers 400 otherwise |
| `requireBusinessOwnership(resolver?)` | `ownership.ts` | the caller owns the business the request names |
| `requireRecordAccess(list, idField)` | `ownership.ts` | the caller is the record's own customer, or the business it belongs to |
| `requireSelfOrBusinessOwner(field?)` | `ownership.ts` | the caller is acting for themselves, or is the business acting for a customer |
| `rateLimiter(windowMs, max)` | `rateLimiter.ts` | per-IP request ceiling, in-process |

**`authGuard` proves identity and account type, never ownership.** Without an ownership check beside it, any business owner can reach any other business's data with a valid token of their own. Every route that names a business runs both.

`authGuard("admin")` is the exception: it reads the `admin` **custom claim** on the Firebase token, not `users/{uid}.type`. A user can write their own profile document, so `type` is not a security boundary; a claim can only be set by the Admin SDK. Non-admin roles still resolve through the users document, and on a cache miss `authGuard` reads through to Firestore so a just-created account does not get a spurious 403 while the snapshot listener catches up.

The ownership layer resolves the owning business from whichever identifier the route carries — `businessId` directly, or via `serviceId`, `staffId`, `reviewId`, `calendarEventId`, `waitItemId`.

### Server Route Structure

Public (no token) — the public booking page depends on these:
```
GET  /                                   GET  /actions/    GET  /data/
POST /data/getBusiness                   ← public shape; the owner's token unlocks the full record
POST /data/getAvailabilityByServiceId    ← optional staffId narrows it to one person's calendar
POST /data/getBusinessReviews            ← non-flagged only, reviewer reduced to a first name
POST /data/getBusinessRatings
POST /data/searchBusinesses              ← the marketplace directory
```

Authenticated:
```
POST /data/getMyAppointments             authGuard()                    ← scope comes from the token
POST /data/getUserById                   authGuard() + self-or-own-customer
POST /actions/businesses/appointments/create      authGuard() + requireSelfOrBusinessOwner
POST /actions/businesses/appointments/cancel      authGuard() + requireRecordAccess
POST /actions/businesses/appointments/reschedule  authGuard() + requireRecordAccess
POST /actions/businesses/waitlist/add             authGuard() + requireSelfOrBusinessOwner
POST /actions/businesses/waitlist/delete          authGuard() + requireRecordAccess
POST /actions/businesses/reviews/create           authGuard() + requireSelfOrBusinessOwner
```

Business-owner only — all `authGuard("business") + requireBusinessOwnership`:
```
POST /actions/businesses/update
POST /actions/businesses/appointments/confirm|updateStatus
POST /actions/businesses/services/create|update|delete
POST /actions/businesses/staff/create|update|delete
POST /actions/businesses/customers/block|unblock|update
POST /actions/businesses/reviews/moderate
POST /data/getBusinessCustomers|getBusinessStaff|getBusinessWaitlist
POST /data/getBusinessAppointments|getBusinessAnalytics
```

Operator only — all `authGuard("admin")`, which checks the Firebase custom claim:
```
POST /actions/admin/overview                 ← every business and user, for the admin panel
POST /actions/admin/users/create             ← creates the Auth account and users/{uid} together
POST /actions/admin/businesses/create        ← creates the business and links it to its owner
POST /actions/admin/businesses/setActive
```

All route handlers follow the `RouterService = (req, res, next) => void` pattern; errors call `next(error)`. Responses use `jsonOK(data)` / `jsonFailed(error)` wrappers.

**Errors:** throw an `AppError` (`helpers/appError.ts`) when the message is written for the
caller — the global handler shows those with their status. Everything else is answered with a
flat 500 `Internal server error`, because a raw Firestore error carries the project id and
document path and this handler is reachable from unauthenticated routes.

**Rate limits:** `rateLimiter(windowMs, max, scope, perUser)`. The `scope` matters — without it
every limiter shares one counter per IP and a strict per-route ceiling is spent by traffic to
unrelated routes. `createLimiter()` (10/min, keyed by uid) guards every endpoint that mints a
document, so the ceiling follows the account rather than the network.

### Staff scheduling: a business is several resources, not one

`CalendarEvent.staffId` decides whose calendar an event occupies.

- **With `staffId`** the event blocks only that person, which is what lets two staff take the
  same hour.
- **Without it** the event blocks the whole business. That covers vacation and holiday blocks,
  and also every appointment made before staff scheduling existed — old data keeps behaving
  exactly as it did.

`StaffMember.serviceIds` says who can perform what; **an empty list means "anything", not
"nothing"** — no staff record has ever had it filled, and reading it strictly would make every
existing person ineligible overnight. Availability for a service is the union across eligible
staff, so a slot is offered while anyone can take it. When a booking names no staff member the
server picks the first free eligible one *inside the transaction*, so the choice cannot go stale
between the check and the write.

### Firestore indexes

`findOverlappingEvent` queries `calendar` by `businessId` + `end >`, which needs the composite
index in `firestore.indexes.json`. **`deploy:rules` deploys rules and indexes together** — an
index that is missing or still building makes every booking fail with `FAILED_PRECONDITION`, and
a fresh index takes a few minutes to build after deploy.

### Notifications

`src/notifications/` sends the booking confirmation, the cancellation notice, and a reminder a
day before. Delivery goes to Resend over plain HTTPS — one POST is not worth an SDK in a server
holding Firebase admin credentials.

**It is off until configured.** With no `resend_api_key` / `notification_from` the attempt is
still recorded in `notification_logs` with status `FAILED` and a "not configured" reason, so the
feature can be deployed and inspected before signing up to a provider. Set both to turn it on.

Reminders are an in-process sweep every 15 minutes over the cache (`notifications/reminders.ts`),
not a job queue. A send is claimed by creating `notification_logs/{eventId}_reminder` with
`create()`, which fails if it exists — so a restart, or a second instance, cannot send twice.
`npm run check:reminders` covers the window with no credentials.

A booking is never failed by a notification: every send is fire-and-forget behind
`notifyInBackground`.

### CORS and preview deployments

`src/helpers/cors.ts` holds the origin rules, deliberately free of Firebase and Express imports
so `npm run check:cors` can exercise them without credentials.

- `allowed_origins` **replaces** the built-in list (`keepqueue.com`, `www.keepqueue.com`,
  `localhost:3000/3001`); it does not add to it.
- `vercel_preview_scope` is the trailing segment of a Vercel preview URL — the `acme` in
  `https://keepqueue-abc123-acme.vercel.app`. **Unset, preview origins are refused.** The
  pattern used to be `/^https:\/\/keepqueue-[a-z0-9-]+\.vercel\.app$/`, which matches any
  Vercel project whose name starts with `keepqueue` — including one an attacker creates.
- A request with no `Origin` header is allowed: CORS governs browsers, not curl or
  server-to-server calls. Bearer tokens are the actual authentication.

`express` runs behind Caddy in production, so `trust proxy` is set to 1. The per-IP rate limiter reads `X-Forwarded-For` through it, and Caddy overwrites rather than appends that header so a client cannot spoof it. Both halves are required.

### Client: Zustand State
Four persisted stores in `lib/store/`:
- `authStore` — logged-in user and type (`business` | `customer`)
- `businesses` — currently active business context
- `settingsStore` — language (`he`|`en`), RTL, accessibility, timezone
- `appointmentsStore` — appointment list filters and selection

`authStore` subscribes to `onAuthStateChanged` at module scope: **Firebase is the source of truth**, and the persisted store is a cache of it. A signed-out Firebase session clears the store. Do not treat `isAuthenticated` from localStorage as proof of a live session.

All stores use a `createSelectors()` utility (`lib/store/utils.ts`) that enables granular subscriptions: `useAuthStore.user()` instead of `useAuthStore(s => s.user)`.

### Client: App Router Layout
```
/app
  /                          ← landing page
  /auth/signin/business|customer
  /auth/signup/business|customer
  /auth/reset-password
  /business/dashboard|calendar|appointments|customers|services|staff|analytics|reviews|editDetails
  /customer/dashboard
  /home/[businessId]         ← public booking flow
  /home/booking-success
```
`app/landing-page/` holds components, not a route — its entry is `index.tsx`, not `page.tsx`, so `/landing-page` 404s.

Minimize `'use client'`; prefer React Server Components. Use dynamic imports for heavy components.

### Internationalization
- Translations in `lib/translations/en.json` and `he.json`.
- `useLanguage()` hook exposes `t(key)`, `isRtl`, `lang`.
- Hebrew uses RTL layout (`dir="rtl"`, sidebar on right).

### Shared Types
Client and server hold **separate copies** of the same type definitions, kept in sync by hand:

- client: `keepqueue-client/lib/types/global.ts`
- server: `keepqueue-server/src/types/global.ts`

They do drift. When touching a shared shape, change both in the same commit.

Key types: `User`, `Business`, `Service`, `CalendarEvent`, `WaitItem`, `NotificationLog`, `MessageTemplate`.
`NotificationType = "sms" | "email"` — WhatsApp has been removed.

---

## Key Conventions

- **Functional components only**, no class components.
- **Tailwind + shadcn/ui + Radix UI** for all UI — no inline styles.
- Custom Tailwind utilities: `.center`, `.col`, `.full`, `.ellipsis`.
- ESLint rules disabled project-wide: `no-explicit-any`, `no-unused-vars`, `exhaustive-deps`.
- Path aliases: `@/*` → client root, `@translations/*` → `lib/translations/`.
- `.gitattributes` pins `*.sh` and friends to LF: production is Linux, and a CRLF script fails there as a missing interpreter.

---

## Known Issues

`bugs.md` tracks open defects; `tests.md` is the QA report they came from. Entries are deleted once a fix is verified — git history keeps them, so a bug absent from the file is closed, not forgotten. The header carries the open count.

`tests.md` predates a large round of fixes and describes findings that are now resolved. Read it as a record of what was found, not as current state.
