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

### Client (`keepqueue-client/`)
```bash
pnpm dev        # Dev server with Turbopack
pnpm build      # Production build
pnpm lint       # ESLint
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

### Server: In-Memory Cache
The server loads all Firestore collections into a singleton `CacheManager` on startup — there are **no per-request DB queries**. Data endpoints filter and transform this in-memory cache.

- `src/managers/cacheManager.ts` — typed get/set/delete/merge operations
- `src/firebase/initialCache.ts` — bootstraps cache from Firestore at startup
- API routes under `/data/*` query the cache; routes under `/actions/*` mutate Firestore and update the cache

The cache is per-process. Any correctness check that reads it (overlap detection, rate limiting) is only as strong as a single instance, and is not safe to rely on if the server is ever scaled out.

### Server: Middleware
Four middlewares in `src/middlewares/`, applied per route in this order:

| Middleware | File | What it proves |
|---|---|---|
| `authGuard(role?)` | `authGuard.ts` | the caller holds a valid Firebase token, and optionally that their account is `business` / `customer` / `staff` |
| `validateBody(schema)` | `index.ts` | the body matches a Zod schema; answers 400 otherwise |
| `requireBusinessOwnership(resolver?)` | `ownership.ts` | the caller owns the business the request names |
| `requireRecordAccess(list, idField)` | `ownership.ts` | the caller is the record's own customer, or the business it belongs to |
| `requireSelfOrBusinessOwner(field?)` | `ownership.ts` | the caller is acting for themselves, or is the business acting for a customer |
| `rateLimiter(windowMs, max)` | `rateLimiter.ts` | per-IP request ceiling, in-process |

**`authGuard` proves identity and account type, never ownership.** Without an ownership check beside it, any business owner can reach any other business's data with a valid token of their own. Every route that names a business runs both.

The ownership layer resolves the owning business from whichever identifier the route carries — `businessId` directly, or via `serviceId`, `staffId`, `reviewId`, `calendarEventId`, `waitItemId`.

### Server Route Structure

Public (no token) — the public booking page depends on these:
```
GET  /                                   GET  /actions/    GET  /data/
POST /actions/login                      ← verifies a token itself
POST /data/getBusiness
POST /data/getAvailabilityByServiceId
POST /data/getBusinessReviews
POST /data/getBusinessRatings
```

Authenticated:
```
POST /data/getCollection                 authGuard()
POST /data/getUserById                   authGuard()
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

All route handlers follow the `RouterService = (req, res, next) => void` pattern; errors call `next(error)`. Responses use `jsonOK(data)` / `jsonFailed(error)` wrappers.

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
