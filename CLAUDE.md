# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Keepqueue** is a SaaS appointment management platform for small service businesses (salons, clinics, etc.). It has two sub-projects:

- `keepqueue-client/` — Next.js 15 frontend (App Router, React 19, TypeScript)
- `keepqueue-server/` — Express.js REST API (TypeScript, Firebase Admin SDK)

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

---

## Architecture

### Client ↔ Server Communication
- Client calls the Express API via `lib/helpers/api.ts` → `apiCall<T>(method, endpoint, url, data)`.
- Every request attaches a **Firebase ID token** as `Authorization: Bearer <token>`.
- Server URL is `https://keepqueue-server-latest.onrender.com` in production, `http://localhost:9000` in dev.
- Client also reads **Firestore directly** for real-time data via `lib/firebase/firestore/`.

### Server: In-Memory Cache
The server loads all Firestore collections into a singleton `CacheManager` on startup — there are **no per-request DB queries**. Data endpoints filter and transform this in-memory cache.

- `src/managers/cacheManager.ts` — typed get/set/delete/merge operations
- `src/firebase/initialCache.ts` — bootstraps cache from Firestore at startup
- API routes under `/data/*` query the cache; routes under `/actions/*` mutate Firestore and update the cache

### Server Route Structure
```
POST /actions/login
POST /actions/businesses/appointments/create
POST /actions/businesses/appointments/confirm
POST /actions/businesses/appointments/cancel
POST /data/getCollection
POST /data/getBusiness
POST /data/getAvailabilityByServiceId
POST /data/getBusinessCustomers
POST /data/getUserById
```
All route handlers follow the `RouterService = (req, res, next) => void` pattern; errors call `next(error)`.

Request bodies are validated with **Zod** via `validateBody<T>(schema)` middleware before reaching handlers. Responses use `jsonOK(data)` / `jsonFailed(error)` wrappers.

### Client: Zustand State
Three persisted stores in `lib/store/`:
- `authStore` — logged-in user and type (`business` | `customer`)
- `businessesStore` — currently active business context
- `settingsStore` — language (`he`|`en`), RTL, accessibility, timezone

All stores use a `createSelectors()` utility (`lib/store/utils.ts`) that enables granular subscriptions: `useAuthStore.user()` instead of `useAuthStore(s => s.user)`.

### Client: App Router Layout
```
/app
  /auth/signin/business|customer
  /business/dashboard|calendar|appointments|customers|services|analytics|reviews|editDetails
  /customer/dashboard
  /home/[businessId]     ← public booking flow
  /landing-page
```
Minimize `'use client'`; prefer React Server Components. Use dynamic imports for heavy components.

### Internationalization
- Translations in `lib/translations/en.json` and `he.json`.
- `useLanguage()` hook exposes `t(key)`, `isRtl`, `lang`.
- Hebrew uses RTL layout (`dir="rtl"`, sidebar on right).

### Shared Types
Both client and server share the same type definitions in their respective `src/types/global.ts` files — keep them in sync manually.

Key types: `User`, `Business`, `Service`, `CalendarEvent`, `WaitItem`, `NotificationLog`, `MessageTemplate`.
`NotificationType = "sms" | "email"` — WhatsApp has been removed.

---

## Key Conventions

- **Functional components only**, no class components.
- **Tailwind + shadcn/ui + Radix UI** for all UI — no inline styles.
- Custom Tailwind utilities: `.center`, `.col`, `.full`, `.ellipsis`.
- ESLint rules disabled project-wide: `no-explicit-any`, `no-unused-vars`, `exhaustive-deps`.
- Path aliases: `@/*` → client root, `@translations/*` → `lib/translations/`.
