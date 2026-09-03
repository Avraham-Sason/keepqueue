# Keepqueue — Path to Sellable

**Produced:** 2026-09-01 · Full file-by-file audit of both apps, `firestore.rules`, and the deploy chain.
**Method:** 12 parallel auditors read every source file, verified each of the 56 bugs in `bugs.md` against current code, and reported new defects. Every claim below carries a `file:line`.

---

## TL;DR

The product is **not 56 bugs away from selling**. It is one broken identity model away from working *at all*, plus two unauthenticated PII leaks, plus a set of features that render but do nothing.

- **A user who signs up through the app today cannot use the product.** The client writes user documents with random Firestore IDs; the server keys every ownership and role check by Firebase Auth UID. Only hand-seeded users (whose doc ID happens to equal their UID) work — which is why QA passed.
- **A business owner who signs up has no way to create a business.** No UI, no endpoint, no code path anywhere. Signup → infinite loading spinner.
- **Deploying `firestore.rules` bricks login** for everyone, including the seeded accounts.
- **`/data/getBusiness` is unauthenticated and returns every customer's name, email, phone, and full appointment history.** The businessId is in the public URL.
- The business calendar's drag/edit/delete surface is wired to nothing and fires success toasts anyway.
- The client **cannot be built outside Vercel**.

Fix order matters: identity → onboarding → security → the flows that lie about working. Everything else is downstream.

**Estimated effort to sellable v1: 30–40 focused working days.**

---

## Verified state of `bugs.md`

`bugs.md` claims 56 open. Verification against current code:

| Verdict | Bugs |
|---|---|
| **Fixed, still listed** (delete them) | BUG-11 (this area), BUG-13, BUG-15, BUG-51 (partial), BUG-76, BUG-78, BUG-80, BUG-85 |
| **"Fixed" but inert** | BUG-12 — `toast.success` fires, but no `<Toaster/>` is mounted anywhere, so nothing renders |
| **Confirmed open** | BUG-5*, 8*, 9, 10, 14, 16, 18, 19, 22, 23, 24, 27, 28, 30, 31, 33, 34, 37, 38, 43, 44, 47, 49, 50, 53, 54, 55, 56, 57, 58, 60, 61, 62, 63, 64, 68, 69, 70, 73, 74, 75, 77, 81, 82, 83, 84, 89, 93 |

\* BUG-5 and BUG-8 are runtime/visual and could not be confirmed statically; the code shows no obvious defect.

**New defects found that are not in `bugs.md`:** ~16 critical, ~28 high, ~85 medium, ~70 low. The critical ones are the entire content of Phase 1 and 2 below.

---

# Phase 0 — Make the repo honest and buildable

**STATUS: done (2026-09-01).** `pnpm build` passes from a clean checkout, `pnpm lint` runs, both
`tsc --noEmit` are clean. Lint reports 17 pre-existing errors (React-Compiler rules in
`CalendarComponent/*`, `hooks/index.ts`, `ui/sidebar.tsx`, plus a `require()` in
`tailwind.config.ts`) — none introduced here; they are Phase 6 work.

### 0.1 Fix the client build
`pnpm build` fails. Chain: `lib/firebase/connect.ts:33` runs `initApp()` at module scope → eight `/business/*` pages declare `export const dynamic = 'force-static'` → Next prerenders authenticated pages at build time → Firebase initializes → `NEXT_PUBLIC_API_KEY` is undefined because the only `.env` is at the monorepo root and Next only reads env files from `keepqueue-client/`.

- Remove `export const dynamic = 'force-static'` from `app/business/{analytics,appointments,calendar,customers,dashboard,reviews,services,staff}/page.tsx`. These are per-user auth-only pages; static output buys nothing.
- Add `keepqueue-client/.env.local` (gitignored) and commit a `.env.example` listing the six required `NEXT_PUBLIC_*` names from `connect.ts:16-21`.
- **DoD:** `pnpm build` succeeds from a clean checkout with only `.env.example` copied and filled.

### 0.2 Restore lint
No lint can run by any path. `pnpm lint` → `next lint` was removed in Next 16. `npx eslint .` → ESLint 9 needs flat config. Legacy fallback → crashes on `eslint-config-next@16`'s flat-only exports.

- Migrate `.eslintrc.json` → `eslint.config.mjs`; change the script to `eslint .`.
- **DoD:** `pnpm lint` runs and reports.

### 0.3 Secrets and dependency hygiene
- Add `.env*` to `keepqueue-server/.gitignore` and the root `.gitignore`. Currently nothing stops `git add -A` from committing the Firebase Admin private key. (`keepqueue-client/ps/create_branch.ps1:16` runs exactly that.)
- **Delete `keepqueue-server/Dockerfile` + `ps/deploy.ps1`.** `Dockerfile:11-12` does `COPY . .` with the comment "including root .env", and `.dockerignore` lists only `node_modules`. `deploy.ps1` pushes that image to public Docker Hub (`avi12435/keepqueue-server`). **If this was ever run with a `.env` present, rotate the service-account key now.** This is also a dead second deploy path — the real one is `infra/deploy.sh`.
- Remove unused server deps: `core` (`^1.0.113`, never imported, generic-name package in a server holding admin credentials), `uuid`, `form-data`.
- Replace the 13 client deps pinned to `"latest"` with caret ranges at currently-locked versions.
- Fix `keepqueue-client/package.json`: `start` runs `next dev`, `test` runs `next start`. Both wrong.

### 0.4 Truth up the docs
- `CLAUDE.md` says Next.js 15 (installed: 16.1.4) and names `keepqueue-server-latest.onrender.com` as production (real: `api.keepqueue.com`).
- Delete the fixed entries from `bugs.md` per the file's own convention.

---

# Phase 1 — Identity and onboarding

**STATUS: code complete (2026-09-01), unverified at runtime.** The repo has no Firebase
credentials (the root `.env` holds only `sudo_password`), so nothing here has been exercised
against a live project. See *Phase 1 — what still needs a human* at the end of this section.

**Product decisions taken (2026-09-01):** no payment for the free pilot; businesses and users
are created by a single **admin** account through a `/admin` panel rather than self-serve
onboarding; marketplace and per-staff scheduling are in scope for later phases.

### 1.1 One identity model: user doc ID == Firebase Auth UID  ⛔ BLOCKER

**The bug.** `components/signup-form.tsx:74,82` calls `addDocument("users", ...)` → `addDoc` → **random document ID** (`lib/firebase/firestore/dataFetching.ts:45`). The server keys everything by Auth UID:

- `SLogin`: `usersMap.get(decoded.uid)` — `keepqueue-server/src/actions/services.ts:20`
- `authGuard` role lookup — `src/middlewares/authGuard.ts:28`
- `requireSelfOrBusinessOwner`: `body.userId === uid` — `src/middlewares/ownership.ts:97`
- `requireRecordAccess`: `record.userId !== uid` — `ownership.ts:78`
- `ownsBusiness`: `ownerId === uid` — `ownership.ts:34`
- `usersMap` is keyed by doc id — `src/firebase/initialCache.ts:44-47`

**Consequence:** every account created through the app's own signup gets 403 on booking-create, 403 on every role-gated route ("User not found"), and can never own a business. Only hand-seeded users work.

**And it gets worse with the rules deployed.** `firestore.rules:61-63` is `allow read, write: if signedIn() && userId == uid()`.
- Signup's random-ID `addDoc` is **denied**. `addDocument` swallows the error and returns `false`; `signup-form.tsx` ignores the return value. Result: a Firebase Auth account with no profile, and no recovery path (retry hits `auth/email-already-in-use`).
- Login runs `queryDocument("users","email","==",email)` (`lib/store/authStore.ts:32`) — a **collection query**. Firestore evaluates queries against the rule; an email filter cannot prove `userId == uid()`, so it is rejected outright. `queryDocument` swallows it, returns `null`, `login()` calls `signOut` and returns `authErrorTypeMismatch`. The same query in the `onAuthStateChanged` listener (`authStore.ts:75`) calls `clearSession()`.

**So: `npm run deploy` publishing these rules bricks sign-in for 100% of users.**

**Fix (do all four, they are one change):**
1. Signup: `setDoc(doc(db,'users', credential.user.uid), ...)` instead of `addDocument`. Check the return; on failure delete the Auth user or surface an error — currently `signup-form.tsx:85-92` has no `else` branch at all.
2. Login and the auth listener: `getDocumentById("users", firebaseUser.uid)` instead of the email query.
3. Wire the client to `POST /actions/login` after Firebase sign-in. It is currently **dead code with zero callers** — meaning `lastLoginAt` never updates and `setCustomUserClaims` never syncs. Its `isNew` branch (`actions/services.ts:40-48`) is already designed for exactly this handoff.
4. **Migration:** existing prod users have random-ID docs. Write a one-off Admin script: for each `users` doc, look up the Auth user by email, copy the doc to `users/{uid}`, rewrite referencing `userId`/`ownerId` fields in `calendar`/`waitlist`/`reviews`/`businesses`, then delete the old doc. Run it before deploying the rules.

**DoD:** fresh signup → login → book → cancel works end to end for both roles, with `firestore.rules` deployed.

### 1.2 Business creation — admin panel  ⛔ BLOCKER

**There is no way to create a business.** Grep for `addDocument("businesses"` or any server business-create returns nothing. The server exposes only `/actions/businesses/update`. `firestore.rules:42` even permits `create if ownerId == uid()` — no code uses it. Business signup writes `ownedBusinessIds: []` and redirects to `/business`, where `useBusinessProxy` (`app/business/hooks.ts:57-67`) waits forever for a business that cannot exist.

**Time from business signup to a bookable page today: infinite.** Every existing business was seeded by hand in Firestore.

**Built instead of a self-serve wizard** (per the pilot decision): a single operator account
creates businesses and their owners.

- `authGuard("admin")` reads the **`admin` Firebase custom claim**, not `users/{uid}.type` — a
  user can write their own profile document, so `type` is not a security boundary; a claim can
  only be set by the Admin SDK.
- `keepqueue-server/scripts/create-admin.ts` (`npm run admin:create -- <email> '<password>'`)
  creates or promotes the one operator: sets the claim and writes `users/{uid}` with
  `type: "admin"`.
- `POST /actions/admin/{overview,users/create,businesses/create,businesses/setActive}`. Business
  creation writes the business and pushes its id onto the owner's `ownedBusinessIds` in one
  batch, so an owner is never left pointing at a business they do not own. Every write also
  seeds the in-memory cache so the next request does not race the snapshot listener. Write
  routes carry a 20/min limiter of their own.
- `/admin` page behind `AuthGuard requiredRole="admin"`.
- `/business` no longer spins forever for an owner with no business: it shows a "no business
  linked yet — contact support" card.

**DoD:** admin creates an owner + business; the owner signs in and reaches a working dashboard
and a bookable public page.

### 1.3 Fix `useBusiness` — one character, wide blast radius

`app/business/hooks.ts:13`:
```ts
const finalBusinessId = businessId || isBusinessOwner ? (user as BusinessOwner)?.ownedBusinessIds?.[0] : "";
```
`||` binds tighter than `?:`, so this parses as `(businessId || isBusinessOwner) ? owned[0] : ""` — **the passed `businessId` is never used.**

Consequences:
- Public booking page (`app/home/[businessId]/components/client.tsx:7`): anonymous/customer visitors get `undefined`, the query is disabled, and the page silently falls back to direct Firestore reads — the current root cause of BUG-73/BUG-10/rating-always-0.
- A signed-in owner visiting **another** business's booking page loads **their own** business's services and calendar under the other business's URL.

**Fix:** `businessId || (isBusinessOwner ? (user as BusinessOwner)?.ownedBusinessIds?.[0] : "")`. Also have `BookingInterface` assert `currentBusiness.id === businessId` before using it.

### 1.4 Mount the Toaster

`components/ui/sonner.tsx` defines a `Toaster`. **Nothing imports it.** Every `toast()` call in the app is silently discarded: copy-link, all calendar toasts, editDetails save feedback.

- Render `<Toaster/>` once in `app/layout.tsx` inside `ThemeProvider`.
- Fix `sonner.tsx:15-17` while you're there: it sets `--normal-bg: var(--popover)`, but this project's CSS vars hold bare HSL triplets (`0 0% 100%`), not colors. Needs `hsl(var(--popover))` or toasts render unstyled.
- **DoD:** a failed save shows a visible error.

---

### Phase 1 — what still needs a human

Steps 1 and 2 are **done** (2026-09-01, against the live `keepqueue` project):

- The root `.env` is filled. `keepqueue-server/src/firebase/helpers.ts` now loads it — a bare
  `dotenv.config()` resolves against the working directory and never found the monorepo root,
  so every server script would have exited at boot.
- `migrate:user-ids --apply` ran. **Not one users document had been keyed by uid** (`already
  correct: 0`), confirming the contract was broken for every account, not some. `avi@biz.com`
  and `noa@customer.com` were re-keyed and 13 references rewritten; a re-run now reports
  `already correct: 2, to migrate: 0`.
- The four seeded users with no Auth account, and the two businesses they owned (Alpha Spa,
  Beta Cuts — 0 appointments between them), were deleted: 9 documents. Gamma Fitness, its 7
  services and 12 events are untouched. A full pre-change snapshot was written with
  `scripts/dump-firestore.ts`.

Steps 3 and 4 below still need the Firebase project.

1. **Fill `.env` at the repo root from `.env.example`.** The client half is the six
   `NEXT_PUBLIC_*` values, the server half is the Admin service account. Without them the
   server exits at boot and the client runs against an unconfigured Firebase app.
2. **Dry-run the id migration, read the output, then apply it:**
   ```bash
   cd keepqueue-server && npm run migrate:user-ids
   ```
   It prints every move and everything it refuses to touch. Only then re-run with `-- --apply`.
   The planner's decisions are covered by `npm run check:migration` (8 assertions, no
   credentials needed); the destructive half decides nothing on its own.
3. **Create the operator account**, then sign out and back in so the claim reaches the token:
   ```bash
   cd keepqueue-server && npm run admin:create -- admin@keepqueue.com '<password>'
   ```
4. **Only after 2 and 3 succeed, deploy the rules** (`npm run deploy:rules`). Before the
   migration, publishing them locks every legacy account out.
5. **Walk the flow end to end** on a real project: admin creates an owner and a business →
   owner signs in → dashboard loads → public booking page shows the business → a customer signs
   up, books, and cancels.

`deploy:rules` now passes `--project keepqueue`, so it no longer depends on a machine-local
`firebase use`. `deploy:rollback` is still shell-dependent (§5.7) — do not rely on it yet.

### ⚠ Deploy gate — CLEARED 2026-09-02 (§2.1 is done)

Fixing the `useBusiness` precedence bug has a side effect worth naming. Before the fix the
public booking page never actually reached `/data/getBusiness` for anonymous visitors — the
query was disabled, so the page silently fell back to direct Firestore reads that return only
the business profile and its services. **Now the fix works, every visitor's browser downloads
the real `/data/getBusiness` payload — which includes the business's entire customer list,
every appointment joined to its customer's email and phone, the waitlist, and the message
templates** (§2.1).

The endpoint was already unauthenticated and dumpable with curl, so this is not a new hole in
the API. But it does put that data into every ordinary visitor's browser and network log,
which is a materially worse exposure than a hole nobody is walking through. Split the public
and owner payloads (§2.1) **in the same release** as this fix, or hold the client deploy.

**Resolved.** §2.1 shipped, so the client and server can now go out together. The server half
must be deployed **first or at the same time** — the client fix makes the booking page call
`/data/getBusiness` for real, and it is the server that decides what comes back.

---

# Phase 2 — Security and PII

**STATUS: complete (2026-09-02).** All seven items closed and verified against the running server
and the Firestore emulator, not by reading. The suites are checked in and re-runnable:

| Command | What it proves |
|---|---|
| `cd rules-test && npm test` | 29 assertions on `firestore.rules` (emulator) |
| `npx ts-node scripts/probe-getbusiness.ts <businessId>` | public vs owner payload split |
| `npx ts-node scripts/probe-data-scoping.ts` | `/data/*` cannot read other people's records |
| `npx ts-node scripts/probe-calendar-dos.ts` | six calendar-shutdown attacks all refused |
| `npx ts-node scripts/probe-booking-happy-path.ts` | the guards did not break a real booking |
| `npx ts-node scripts/probe-block-customer.ts` | blocking works and only for the right business |
| `npx ts-node scripts/probe-hardening.ts` | no leaked internals, create ceiling, CORS refusal |
| `npm run check:migration \| check:appointment-rules \| check:cors` | pure logic, no credentials |

The `probe-*` scripts need the server on `localhost:9000` and write to the real project; each one
cleans up after itself.

*3–4 days. Do this before a single real customer's phone number is in the database.*

### 2.1 `/data/getBusiness` is an unauthenticated customer-list dump  ✅ DONE 2026-09-02

`data/router.ts:21` — `validateBody` only, **no `authGuard`** (it is public because the booking page needs it). But `S_getBusiness` returns:
- `customers`: full `Customer[]` — `data/services.ts:100`
- `calendar` joined to the **full user object** per event (email, phone, contacts) — `services.ts:72-83`
- `waitlist` joined to user — `services.ts:85-91`
- `reviews` joined to user — `services.ts:96-97`
- `messageTemplates` — `services.ts:70`

The businessId is in the public `/home/[businessId]` URL. **Anyone on the internet can dump a business's entire customer list and appointment history.** The `authGuard` on `/data/getBusinessCustomers` is moot.

**Fix:** split the endpoint.
- `getPublicBusiness` (public): profile + **active** services + availability + review text/rating with **displayName only**.
- `getBusiness` (authGuard('business') + requireBusinessOwnership): everything else.

This also unblocks the booking page's open `TODO` at `components/BookingInterface/hooks.ts:74` — the direct-Firestore fallback exists only because there is no safe public endpoint.

**Built:** one route, response shaped by who is asking, rather than two routes the client could
call the wrong one of. `attachUserIfPresent()` (`middlewares/attachUser.ts`) identifies a caller
who presents a token and lets an anonymous one through, so the route stays public while
`S_getBusiness` can branch. Non-owners get: profile with `ownerId` blanked, **active** services
only, availability, their **own** appointments with the joined user stripped, non-flagged reviews
with the reviewer reduced to first name and photo, and empty `customers`/`waitlist`/`staff`/
`messageTemplates`. A business with `isActive === false` returns "not found" to non-owners. The
owner (and the operator claim) still gets the full record, unchanged.

Verified against the running server and live data with `scripts/probe-getbusiness.ts`, which
mints an ID token per role through a custom token — no passwords involved:

```
anonymous  services=5  calendar=0   customers=0  emailsVisible=none   ownerId=""
customer   services=5  calendar=5   customers=0  emailsVisible=none   ownerId=""
owner      services=7  calendar=12  customers=1  emailsVisible=avi@biz.com,noa@customer.com
```

The customer's `calendar=5` is exactly her own appointments — the "my appointments" path still
works without seeing anyone else's. `services=5` versus the owner's `7` is the inactive-service
filter.

### 2.2 `/data/getCollection` is unscoped bulk exfiltration  ✅ DONE 2026-09-02

`data/router.ts:19` — `authGuard()` with no role, no ownership. `S_getCollection` returns `cacheManager.get(collectionName)` filtered **only by caller-supplied conditions** (`data/services.ts:13-30`), and conditions are optional. `collectionName` only needs 4–20 chars.

Any signed-in customer can POST `{collectionName:"users"}` and receive every user's email and phone. Also `calendar`, `reviews`, `staff`, `waitlist`, `notificationLogs`.

**Fix:** allow-list collections per role, and force-inject a scope filter derived from `req.user`, never from the body. Note the customer dashboard depends on this endpoint — replace that call with a purpose-built `getMyAppointments` rather than trying to keep `getCollection` general.

**Built: the endpoint is deleted, not constrained.** It had exactly one caller — the customer
dashboard — and that call was broken anyway (it sent `field`, the schema requires `fieldName`,
so it 400'd every time and the dashboard silently showed "no appointments"). Securing a
"query any collection with caller-supplied filters" endpoint is a losing position; removing it
ends the whole class. Gone with it: `getCollectionSchema` (the `value: any()` prototype-pollution
surface of §2.7) and `data/helpers.ts`'s `checkCondition`, which silently returned false for
every Timestamp comparison and never walked the dotted paths its own schema advertised.

`POST /data/getMyAppointments` replaces it: `authGuard()`, scope taken from `req.user.uid` and
not from the body, business and service names resolved server-side because a customer cannot
read either collection. The dashboard now also surfaces load and cancel failures instead of
rendering them as an empty list, and shows which business each appointment belongs to.

### 2.3 `/data/getUserById` returns any user to any caller  ✅ DONE 2026-09-02
`data/router.ts:27` — `authGuard()` only; `S_getUserById` returns the raw user record for any uid (`data/services.ts:177-192`). **Fix:** self, or a business owner fetching their own customer, with a trimmed projection.

**Built.** Self and the operator claim get the full record; a business owner gets only a user
who is actually one of their customers, projected to the nine fields the customers page uses.
Everyone else gets 403. This is what made the `authGuard` on `/data/getBusinessCustomers`
meaningful — the same data used to be one unguarded request away.

### 2.4 Public reviews endpoint leaks reviewer PII and flagged content  ✅ DONE 2026-09-02
`S_getBusinessReviews` (`data/services.ts:232`) attaches the full user document to every review, on an unauthenticated route, **and returns flagged reviews** — unlike `S_getBusinessRatings` which filters them (`services.ts:249`). **Fix:** project to `displayName`, filter `flagged`. Done alongside §2.1 — both the standalone
endpoint and the reviews inside `getBusiness` now go through one `publicReviewer()` projection
(id, first name, photo) and drop flagged entries.

### 2.5 A customer can shut down any business's calendar  ✅ DONE 2026-09-02

`createAppointmentSchema` accepts `type: VACATION|HOLIDAY|OTHER|APPOINTMENT` and `source: web|admin|import` from any caller (`appointments/schemes.ts:10-11`). The guard `requireSelfOrBusinessOwner` passes whenever `body.userId === uid` (`ownership.ts:90-107`). Non-`APPOINTMENT` types skip the service check (`services.ts:12-16`), and `hasCalendarOverlapInCache` blocks on every non-terminal event regardless of type (`helpers.ts:25`).

So any customer can POST a `VACATION` event spanning months against **any** businessId and kill all availability for that business permanently.

**Fix:** reject `type !== "APPOINTMENT"` and `source !== "web"` unless the caller owns the business.

**Built — and the stated fix alone was not enough.** `requireOwnerForNonBookingEvent()`
(`middlewares/ownership.ts`) does exactly what the line above says, but it leaves the hole open:
overlap detection blocks on *any* non-terminal event, so `type: "APPOINTMENT"` with `end` ninety
days out empties the calendar just as well. Closing 2.5 therefore also needed a bound on the
booking itself, in `SCreateAppointment` **and** `SRescheduleAppointment` (the customer can reach
both): the span must match the service's `durationMin` within a minute of clock slack, and the
start must be in the future.

The `zenum` cast in `appointments/schemes.ts` typed `type` and `source` as `any`, which is what
let those fields be reasoned about so loosely — replaced with real `z.enum`, and the
single-member `z.union([number()])` wrappers dropped.

`scripts/probe-calendar-dos.ts` attempts all six attacks as an ordinary customer against the
running server and cleans up after itself; `scripts/probe-booking-happy-path.ts` proves the
guards did not break a real book → reschedule → cancel. `npm run check:appointment-rules`
covers the two pure rules with assertions and no credentials.

**Found while testing:** the happy-path probe failed its reschedule step with 404 *Resource not
found*. Not a regression — `requireRecordAccess` resolves the record from the in-memory cache,
which the snapshot listener fills a moment after the write, so a just-booked appointment did not
exist yet as far as the API was concerned. Its slot also still looked free. Every appointment
write now merges into the cache synchronously (`cacheCalendarEvent`), which fixes the 404 and
narrows — but does not close — the double-booking race of BUG-43.

### 2.6 `firestore.rules` — four holes  ✅ DONE 2026-09-02

- **Self-write on `/users` (`:61-63`)** grants the account write access to fields with authorization meaning. A blocked customer can delete the businessId from their own `blockedByBusinessIds` and **unblock themselves**. Any customer can set `type: "business"` on their own doc; the cache ingests it and `authGuard('business')` passes. Tenant isolation survives only because every business route also runs `requireBusinessOwnership` — but the role check itself is worthless. **Fix:** restrict self-write to a field allow-list via `request.resource.data.diff(resource.data).affectedKeys().hasOnly([...])`, excluding `type`/`businessIds`/`blockedByBusinessIds`; move block state to a per-business list the customer cannot touch.
- **Cross-tenant theft on `/staff` and `/message_templates` (`:78-86`)**: `write if ownsBusiness(resource.data.businessId) || ownsBusiness(request.resource.data.businessId)` — the second disjunct lets any owner steal another business's docs into their own tenant; the first lets them push docs into a victim's. Same on `/services` update (`:49`) — an owner can flip their service's `businessId` to a competitor's, injecting services into the victim's public booking page. **Fix:** require ownership of both old and new, or forbid changing `businessId`.
- **`/calendar` create (`:67`)**: `creatingOwnRecord()` lets any signed-in user create events with any `businessId`, any time, any status — bypassing availability, double-booking prevention, and the status state machine. The customer booking path goes through the API; this disjunct serves no legitimate flow. **Fix:** drop it.
- **`/businesses` update (`:43`)** lets the owner write **any** field, including the server-computed `ratingAvg`/`ratingCount` rendered on the public page. A business can write itself a 5.0 with 9999 reviews. **Fix:** field allow-list.

**Built, and tested against the Firestore emulator** — `rules-test/rules.test.mjs`, 29 assertions,
run with `cd rules-test && npm test`. Both directions are asserted: nine cases prove the product
still works (owner edits their business, creates a service, blocks out a vacation; a customer
signs up, edits their own name, reads their own appointment; anyone reads a business and its
services) and twenty prove each hole is shut.

`/users` is now split into create and update: `type` is fixed at creation and immutable
afterwards, and an update may touch only the seven fields the profile form edits. That is what
stops a blocked customer clearing their own `blockedByBusinessIds`, a customer promoting
themselves to `business`, and a customer overwriting the private `notes` their salon keeps about
them. `/services`, `/staff` and `/message_templates` split `read/write` into the four verbs and
pin `businessId` across updates, closing theft in both directions. `/calendar` create no longer
accepts `creatingOwnRecord()` and update no longer accepts `isOwnRecord()` — bookings belong to
`/actions/businesses/appointments/*`, which validates the slot and bounds the duration; the only
browser write left is the owner's own block. `/businesses` update is an allow-list that excludes
`ownerId`, `isActive`, `ratingAvg` and `ratingCount`.

**Note on the emulator:** `firebase-tools` now requires JDK 21 and this machine has 17, so the
test script pins `firebase-tools@13`. Installing a JDK was not worth doing to the machine for a
dev-only check.

**Consequence that had to be handled in the same pass:** blocking a customer wrote
`blockedByBusinessIds` on *the customer's* users document from the owner's browser. The rules
have never allowed that — the write was denied every time, `setDocument` swallowed the error, and
the dialog closed as though it had worked, so the feature has been silently dead. Tightening the
rules does not cause that, but it does make it permanent, so the client now calls the existing
`/actions/businesses/customers/{block,unblock}` endpoints, which run on the Admin SDK and report
success or failure with a toast. Verified end to end by `scripts/probe-block-customer.ts`.

### 2.7 Smaller, still real  ✅ DONE 2026-09-02
- **Login brute-force (BUG-60):** `/actions/login` inherits only the global 100/60s limiter. Add a 5–10/min limiter on that route and on the create endpoints (a single client can currently mint ~100 Firestore docs/min).
- **CORS preview regex** `/^https:\/\/keepqueue-[a-z0-9-]+\.vercel\.app$/` (`helpers/index.ts:35`) matches any Vercel project named `keepqueue-*`, including an attacker's, admitted with `credentials:true`. Impact is bounded (Bearer auth, not cookies) but pin the slug.
- **No token revocation:** `verifyIdToken(token)` without `checkRevoked` (`firebase/helpers.ts:250`). A disabled account keeps full access for up to an hour. There is no force-logout capability at all.
- **Error handler leaks internals:** `middlewares/index.ts:18` returns `err?.message` verbatim; Firestore admin errors carry project and document paths, and reach unauthenticated clients.

**Built.**

- *Brute force / record spam:* `/actions/login` no longer exists (§1.1), so only the second half
  applied. `rateLimiter` gained a `scope` (separate limiters no longer share one counter) and a
  `perUser` mode, and `createLimiter()` — 10/min keyed by uid — now guards appointment, review,
  waitlist, service and staff creation. Keyed by account, not by network, so a shared office IP
  does not exhaust it for everyone and one account cannot escape it by changing address.
- *CORS:* the preview pattern is now built from `vercel_preview_scope` and pinned to the team
  slug, so it matches this account's previews and not a `keepqueue-*` project anyone can create.
  Unset, previews are refused rather than wildcarded. `credentials: true` is gone (the API
  authenticates with Bearer tokens, never cookies), and a disallowed origin now gets a clean CORS
  refusal instead of being handed to the error handler as a 500. The rules live in
  `src/helpers/cors.ts`, kept free of Firebase imports so `npm run check:cors` runs without
  credentials.
- *Token revocation:* `verifyIdToken(token, true)`. A disabled or revoked account is now cut off
  on its next request instead of keeping access until the token expires. Costs one user-record
  lookup per authenticated request — the right trade at pilot traffic, worth revisiting if
  latency starts to matter.
- *Error leak:* a new `AppError` carries a message written for the caller plus its status. The
  global handler shows those and answers everything else with a flat 500 `Internal server error`,
  and now emits the same `{success,error}` shape as every other response instead of `{message}`.
  The domain throws in the appointment services were converted, so "Cannot reschedule a cancelled
  appointment" still reaches the user — with a 422 rather than a 500.

Verified by `scripts/probe-hardening.ts` against the running server: unknown appointment → 404
with no project or document path in the body, the 11th create in a minute → 429, disallowed
origin → no `access-control-allow-origin` header and no 500.

---

# Phase 3 — Features that render but do nothing

*5–7 days. Every item here currently lies to the user.*

### 3.1 The business calendar is a no-op  ⛔
`app/business/calendar/Calendar.tsx:178` renders `<CalendarComponent events={events}/>` with **no** `onEventAdd`/`onEventUpdate`/`onEventDelete`. In controlled mode `CalendarComponent` only forwards to those undefined callbacks (`CalendarComponent.tsx:144-167`). So dragging an appointment, editing it, deleting it, and creating one all persist **nothing** — and `event-calendar.tsx:189-251` fires success toasts for every dead action. The UI snaps back on the next 10-second refetch.

**Fix:** wire `onEventUpdate` → the existing `/actions/businesses/appointments/reschedule` endpoint (already built, `appointments/router.ts:12`), `onEventDelete` → cancel, `onEventAdd` → create. Never toast success unless the callback resolves.

### 3.2 Analytics is permanently zero
`app/business/analytics/hooks.tsx:17,50` tests `"seconds" in e.start`. Calendar data arrives from the Express API, where Admin-SDK Timestamps serialize as `{_seconds,_nanoseconds}` — **never** `{seconds}`. So `ts = 0`, every appointment fails `ts >= cutoff`, and every KPI renders 0.

**Fix:** use the existing `timestampToMillis()` from `lib/helpers/time.ts` (it handles both shapes). Better: call `/data/getBusinessAnalytics`, which already computes correctly (`data/services.ts:307-365`) and is currently **never called by the client**. The client's own version also has no upper date bound, so "Last 7 days" includes next month's bookings.

### 3.3 The customer dashboard never loads
`app/customer/dashboard/page.tsx:41` sends `conditions:[{field:"userId",...}]`; the server schema requires `fieldName` (`data/schemes.ts:14-16`). Zod strips the unknown key → 400 → the `catch` only `console.error`s → "no appointments" forever.

Combined with 3.4, **a signed-in customer has no working place to see their appointments anywhere in the product.**

**Fix:** replace with a scoped `getMyAppointments` endpoint (see 2.2) and surface fetch errors.

### 3.4 Returning customers never see their bookings on the booking page
`components/BookingInterface/hooks.ts:80` queries `calendar` by `businessId`; `firestore.rules:66` allows calendar reads only per-doc — a businessId-only query is rejected wholesale. The error is swallowed, so `customerAppointments` is always empty and the on-page cancel card never renders.

### 3.5 Blocking a customer does nothing — three independent failures
1. `app/business/customers/hooks.tsx:25,49` writes `setDocument("users", customerId, ...)` — a business writing a *customer's* doc, which `firestore.rules:61-63` denies. `setDocument` returns `false`, the hook ignores it, the dialog closes as success.
2. The blocked customer can rewrite their own flag (2.6).
3. Even if set, `SCreateAppointment` **never reads `blockedByBusinessIds`** — a blocked customer books normally.

**Fix:** route block/unblock through the existing `/actions/businesses/customers/block` endpoint, and enforce the flag in `SCreateAppointment` and `SAddToWaitlist`.

### 3.6 Every service/staff/review write fails silently
`setDocument`/`addDocument` return `false` on failure and never throw, so every `try/catch` around them is dead code and every caller ignores the boolean: `Services.tsx:27-33`, `services/hooks.tsx:14`, `Staff.tsx:26-31`, `staff/hooks.tsx:36`, `Reviews.tsx:22`. On any Firestore failure the dialog closes, the list refetches, no error appears, and the user believes it saved.

**Fix:** make the helpers throw (or check every boolean) and show an error toast. This is BUG-50's real blast radius.

### 3.7 Sign-out doesn't sign out
`app/business/components/business-sidebar.tsx:149` — the sign-out button is a bare `<Link href="/">`. It never calls `authStore.logout()`, never signs out of Firebase, never clears the persisted stores. **On a shared machine the next person walks straight back into the dashboard.**

### 3.8 Dashboard stats are fiction
- `StatsSection.tsx:39` compares `"2026-09-01"` (ISO, UTC) against `timestampToString(..., "DD/MM/YY")` → `"01/09/26"`. Never equal. "Today's appointments" is always 0.
- `StatsSection.tsx:41`: `const totalRevenue = 0;` displayed as `₪0` with the caption "from completed appointments".
- The "Confirmed" card's description is `t("totalAppointments")`.

---

# Phase 4 — Booking correctness

**STATUS: complete (2026-09-02).** Verified against the running server with
`scripts/probe-booking-correctness.ts` — including a genuine concurrency test that fires two
bookings for the same slot at once and asserts exactly one wins.

- **4.1 double-booking race — closed.** The overlap check now runs inside the transaction via
  `tx.get` (`findOverlappingEvent`), so Firestore has a read set to conflict on and aborts the
  loser. The query filters on `end > start` rather than a range on `start`, because a vacation
  opened weeks earlier still overlaps today. Needs the composite index on `(businessId, end)` —
  added as `firestore.indexes.json`, wired into `firebase.json`, and **deployed**.
- **4.2 booking validation — closed.** Service must belong to the business and be active, the
  span must match `durationMin`, `start` must be in the future, and the window must fall inside
  the opening hours `computeBusinessAvailability` already knew about and nobody consulted.
- **4.3 state machine — closed.** Confirm only from `BOOKED`; cancel refused on `DONE`/`NO_SHOW`
  and bound by `policy.cancellationWindowMin` for customers; reschedule refused on `NO_SHOW` and
  resets a customer-moved `CONFIRMED` back to `BOOKED`; attendance status only on a started
  appointment, never on a vacation block. A cancellation reason no longer overwrites the
  customer's own notes.
- **4.4 double response — closed.** The transaction returns a result and the handler answers
  once, outside the callback that Firestore may retry.
- **4.5 cache lag — closed** in Phase 2 (`cacheCalendarEvent`).
- **4.6 lifecycle — closed by normalising on read.** Analytics treats a past `BOOKED`/`CONFIRMED`
  appointment as completed rather than pretending nothing happened, and counts revenue only for
  what was actually delivered. No scheduler was built.
- **4.7** is the booking wizard, owned by the client work.
- **4.8 timezone — field added** to `Business` on both sides in Phase 1 and now read directly
  instead of through `as any`. The DST offset arithmetic remains (see Phase 6).

*4–5 days. These produce wrong data rather than no data.*

### 4.1 Double-booking race (BUG-43) — still fully open
`SCreateAppointment` wraps the check in `db.runTransaction`, but the check is `hasCalendarOverlapInCache` (`helpers.ts:20-28`) which reads the **in-memory cache**, and the transaction performs **no `tx.get`** of calendar docs — so Firestore's optimistic concurrency has nothing to conflict on. Two concurrent bookings both pass and both commit. Reschedule is identical (`services.ts:103`).

**Fix:** `tx.get` the affected calendar range inside the transaction and re-check there. (Lazy alternative: a per-`(businessId, slotStart)` lock document written in the same transaction — cheaper to reason about, same guarantee.)

### 4.2 The server barely validates a booking
The **only** server-side check on a booking's time is overlap. Nothing verifies:
- the slot lies inside the business's operating hours (`computeBusinessAvailability` exists and is not consulted)
- `end - start` matches `service.durationMin` (+padding)
- `start` is in the future — **a customer can book 1970 or 03:00**, which then pollutes analytics
- `service.businessId === businessId` — **business A's service can be booked under business B**, and analytics then bills the foreign price
- `service.active` — soft-deleted services are still listed and bookable

Padding is advertised in availability (`data/services.ts:149-158`) but never reserved at write time, so back-to-back bookings ignore it entirely.

### 4.3 Appointment state machine has no guards
- **Confirm** rejects only `CANCELLED` → a `DONE` or `NO_SHOW` appointment can be reset to `CONFIRMED`, silently rewriting history and analytics (`services.ts:63`).
- **Cancel** rejects only already-`CANCELLED` → a completed appointment can be flipped to `CANCELLED`, removing its revenue (`services.ts:80`). `Business.policy.cancellationWindowMin` is never read — a customer can cancel one minute before.
- **Reschedule** blocks only `CANCELLED`/`DONE` → a `NO_SHOW` event can be moved to the future *keeping* its `NO_SHOW` status (`services.ts:100`).
- **updateStatus** allows `DONE`/`NO_SHOW` on future events and on `VACATION` events, with no path back from a mistake.

### 4.4 Response bug on every overlap
On overlap, the transaction callback calls `res.json(jsonFailed)` and returns, then execution continues to `res.json(jsonOK(...))` at `services.ts:49` → `ERR_HTTP_HEADERS_SENT` on **every** overlap. Identical in reschedule. Also: `res.json` inside a transaction callback is unsafe — the callback can be retried.

### 4.5 The cache lags every write
Every action writes Firestore only; the cache fills via `onSnapshot`. So `requireRecordAccess` and `businessIdFrom.calendarEvent` resolve from cache (`ownership.ts:73,26`) and **404 on a just-created appointment**. Cancelling right after booking hits this. **Lazy fix:** on cache miss, fall back to a direct Firestore `get` in the middleware — one function, covers every route.

### 4.6 No appointment lifecycle (BUG-33)
Nothing anywhere transitions a past `BOOKED` event. The only path to `DONE`/`NO_SHOW` is the owner clicking each one. Analytics completion and no-show rates are therefore structurally meaningless. **Lazy fix:** normalize on read (treat past `BOOKED` as expired in analytics and display) rather than building a scheduler.

### 4.7 Booking wizard holes
- Changing the date **keeps the previously selected time** (`hooks.ts:331`), so a user can submit a time not offered on the new date — and since the server does no schedule validation (4.2), it is accepted.
- The time grid is hardcoded `06:00–22:00` **in the viewer's timezone** (`hooks.ts:264`), so cross-timezone users see available dates with no times.
- Availability is fetched once per service selection and never refreshed — stale slots at confirm time.
- Service cards are `<div onClick>` with no `role`, `tabIndex`, or key handler (`BookingInterface.tsx:386`) — **step 1 is impossible from the keyboard, so the whole flow is.**
- Browser Back exits the wizard entirely (BUG-22) — state is plain `useState` with no history integration.

### 4.8 Timezone
`Business` has **no** `timezone` field on either side. The server reads `(business as any)?.timeZone || ... || "Asia/Jerusalem"` (`appointments/helpers.ts:109`), so every business is Israel. Add the field to both `types/global.ts` files in the same commit, add a picker to Edit Details. Separately, slot offsets are added as fixed milliseconds from local midnight (`helpers.ts:98-100`), so on DST-transition days every slot shifts an hour.

---

# Phase 5 — What "sellable" actually requires

*8–12 days.*

### 5.1 Notifications (BUG-53)  ✅ BUILT 2026-09-02 — needs one API key to switch on
Types, cache slots, and template plumbing exist. **Zero sending code** — no Twilio, SendGrid, nodemailer, or scheduler dependency anywhere. No `NotificationLog` is ever written. And the cache subscribes to `messageTemplates`/`notificationLogs` while the real collections are `message_templates`/`notification_logs` (`initialCache.ts:12-13` vs `types/global.ts:200-201`), so **even stored templates would never load**.

Minimum sellable version: booking confirmation email + a reminder 24h before.

**Built.** `src/notifications/` sends a booking confirmation, a cancellation notice and a
day-before reminder, in Hebrew or English per the business's `lang`. Delivery is a single POST to
Resend — no SDK, **no new dependency**. Reminders are a 15-minute sweep over the cache, not a job
queue; a send is claimed by creating `notification_logs/{eventId}_reminder` with `create()`,
which fails if it exists, so a restart or a second instance cannot double-send.

The collection-name mismatch is gone: `initialCache` derives the cache key from
`firestoreCollections`, so `message_templates` is actually subscribed and lands on the
`messageTemplates` key the data layer reads. `tsc` now rejects a future collection whose derived
key is not a real cache slot.

**It is off until you provide a key.** With `resend_api_key` / `notification_from` unset, every
attempt is still recorded in `notification_logs` with status `FAILED` and a "not configured"
reason — deployable and inspectable now, one env var away from live. Resend was chosen for being
a plain HTTPS call; any provider with an HTTP API is a small edit in one file.
`npm run check:reminders` covers the window with no credentials.

### 5.2 Reviews — customers cannot leave one, and cannot read one
`SCreateReview` is complete server-side. **No client code calls it and no review form exists** anywhere. Reviews are also never *displayed* — only a numeric count renders on the booking page, and the public `getBusinessReviews`/`getBusinessRatings` endpoints are never called. PRD features 7 and 8 are unimplemented.

Also fix while building: `SCreateReview` doesn't check that the cited appointment belongs to the reviewer or the business (cross-appointment "verified" reviews), a business owner can publish reviews as arbitrary users via `requireSelfOrBusinessOwner`, and moderating a review never recomputes the business's rating.

### 5.3 Waitlist  ✅ BUILT 2026-09-02
**Built — the smart half exists now.** Cancelling an appointment offers the freed slot by email
to everyone whose preferred window covers it, best priority and longest wait first
(`notifications/waitlist.ts`). It is an offer, not a reservation: the first to book gets it and
the booking endpoint arbitrates that race properly — far less machinery than holding a slot with
an expiry and a release path.

Joining was wide open and is now validated: business and service must exist and match, the
service must be active, the window must not already be in the past, and one customer cannot queue
twice for the same service. **`priority` is no longer accepted from the request** — a customer
could send `999999` and jump the queue they were waiting in.

Verified by `scripts/probe-waitlist.ts` and `npm run check:waitlist`.

**Still to do:** `WaitlistForm` remains unimported, so there is no way to join from the UI yet.

### 5.4 Staff  ✅ BUILT 2026-09-02 (server); booking-page picker pending
`CalendarEvent` had **no `staffId`**, so availability treated the business as a single resource
and two staff could not take parallel appointments.

**Decision: build it.** `CalendarEvent.staffId` exists on both sides. Availability, overlap
detection and the opening-hours check are all staff-aware: a person's own bookings block only
them, while an event with no `staffId` is a business-wide closure and blocks everybody — which is
what every appointment made before this change is, so old data keeps behaving exactly as it did.

A booking may name a staff member or leave it to the server, which assigns the first eligible
free one **inside the booking transaction** so the choice cannot go stale between check and
write. `serviceIds` decides who can perform what, and an empty list means "anything" — no staff
record has ever had it filled, and reading it strictly would make every existing person
ineligible. Availability for a service is the union across eligible staff, so a slot is offered
while anyone can take it rather than only while everyone can.

Verified by `scripts/probe-staff-scheduling.ts`: two staff take the same hour, neither is booked
twice, auto-assignment refuses when all are busy, and a business-wide block still stops everyone.

**Still to do:** the booking page has no staff picker yet (the server assigns automatically
without one), and the staff form cannot edit `operationSchedule` or `serviceIds` — so per-staff
hours and service restrictions are settable only directly in Firestore.

### 5.5 Policy settings  ✅ ENFORCED 2026-09-02
`cancellationWindowMin`, `lateThresholdMin`, `noShowAutoBlock`, `noShowLimit` were collected in
Edit Details and read by **nothing**.

**Enforced.** `cancellationWindowMin` applies in `SCancelAppointment` — to customers, not to the
business, which is not bound by the window it sets for others. `noShowAutoBlock` + `noShowLimit`
apply in `SUpdateAppointmentStatus`: marking a no-show counts that customer's history with this
business and blocks them at the limit, writing an audit record. Counting at the transition keeps
the rule where the event is, instead of in a job that has to go looking for it. The response
carries `autoBlocked` so the owner can be told it happened.

`lateThresholdMin` stays unused — it describes a front-desk workflow the product does not have.
Left alone deliberately rather than half-enforced.

### 5.6 Legal — required before any real customer data
No `/privacy`, no `/terms`, no cookie consent — yet the footer links to both. The platform stores names, phones, emails, and appointment histories for Israeli users; the Privacy Protection Law (incl. Amendment 13, in force since Aug 2025) requires a privacy notice. Also missing: data export and account deletion (right of erasure would currently require manual Firestore surgery), and email verification (`sendEmailVerification` is never called — anyone can register an address they don't own).

**Also:** `app/page.tsx:53-57` hardcodes `aggregateRating 4.9` with `ratingCount 120` in the landing page's JSON-LD. No such reviews exist. That is a Google structured-data policy violation with manual-action risk. **Remove it.**

### 5.7 Ops — you cannot currently recover from a bad day
- **No backups.** `firebase.json` is rules-only; no PITR configuration anywhere. A bad write or a rules mistake is unrecoverable.
- **No error tracking** (BUG-58). Server logs die with journalctl rotation; client errors vanish.
- **No error boundaries** — no `error.tsx` or `global-error.tsx` anywhere, and no `not-found.tsx` (BUG-49/BUG-84). Any render error is a white screen.
- **Production cannot be rebuilt.** `infra/deploy.sh:28` requires `infra/scripts/setup-keepqueue.sh` — **that file does not exist**. The systemd unit, service user, and the env file with 11 Firebase Admin vars are provisioned by nothing in the repo. If the VPS dies, there is no path back. Commit the setup script.
- **`deploy:rollback` is broken under any POSIX shell.** `package.json:11` embeds `$(cat /var/lib/keepqueue/previous-rev)` inside a double-quoted ssh string — under bash/pwsh it expands *locally* to empty and `deploy.sh:22` defaults to `origin/main`, silently redeploying the newest code instead of rolling back. It works today only because cmd.exe passes `$(...)` through literally. Single-quote the remote command.
- **`deploy:rules` fails on a fresh machine.** `.firebaserc` defines the alias `keepqueue`, not `default`, and the script passes no `--project`.
- **The snapshot listener can hang the server at boot.** `firebase/helpers.ts:314` — the `onSnapshot` error callback only logs; it never resolves or rejects. One transient error on initial listen and `initSnapshot` never returns, `startServer` is never reached, and the process sits there with no HTTP server and no exit. Add a reject and a startup timeout.
- **No graceful shutdown.** No `SIGTERM` handler, so every rolling deploy aborts in-flight requests.
- **Server startup footgun:** `initEnvVariables(['port'])` requires a **lowercase** `port` var and exits if missing, while resolution prefers uppercase `PORT` (`helpers/index.ts:54-55`).

### 5.8 Open product decisions — yours, not mine

1. **Monetization.** No payment, subscription, billing, or plan code exists anywhere. The PRD defines no monetization at all, and the landing nav links to a `#pricing` section that doesn't exist. Needed: pricing model (per-business subscription vs per-booking fee), provider (Stripe vs an Israeli processor for local cards/invoices), and whether customer-side payments (deposits, no-show fees) are in scope for v1.
2. **Marketplace.** Three live links and full translations in both locales point at a route that doesn't exist. It is the customer-acquisition story your own landing page sells. Build it or strip the links.
3. **Staff scheduling** (5.4) — build or drop.
4. **Branding.** A business's public page is `keepqueue.com/home/<opaque-firestore-id>`. No vanity slug, no custom domain. Competitors lead with this.

---

# Phase 6 — Polish

**STATUS: largely done (2026-09-02).**

- **Hebrew now has a font.** `layout.tsx` loaded Inter with the latin subset only while the
  product's default language is Hebrew, and `globals.css` had been asking for `--font-heebo` /
  `--font-rubik` that nothing ever defined — so every Hebrew character fell back to a system
  font. Heebo and Rubik are loaded with the hebrew subset and the variables are real.
- **Tailwind v4 classes in a v3.4 project** generated no CSS, silently, across ten `components/ui`
  files. Most visibly `sm:max-w-100` on `dialog.tsx`, which is why every dialog was nearly
  full-screen on desktop. All converted to v3 syntax; zero v4 syntax remains.
- **Dead code deleted:** `lib/firebase/firestore/snapshots.ts` (265 lines, the documented
  "realtime Firestore reads" architecture that no longer exists), `events-popup.tsx`,
  `InDevelop.tsx`, `TextType.tsx`, the zero-byte `home/[businessId]/components/server.tsx`, and
  `CalendarComponent.tsx` with its 130 lines of demo events.
- **Bundle:** four packages removed — `@remixicon/react` (4 icons moved to lucide), `motion` (2
  components moved to framer-motion), `gsap` (its only consumer was the deleted TextType), and
  `tailwindcss-animated` (never registered in the Tailwind config).
- **Lint: 17 errors → 9.** The nine left are React-Compiler rules inside the vendored calendar
  (`draggable-event`, `event-dialog`, `month-view`) and `ui/sidebar.tsx` — library code, worth a
  deliberate pass rather than a rushed one.
- `useIsMobile` was setting state inside an effect and returning `false` on the first render, so
  every mobile layout painted desktop first. Rewritten on `useSyncExternalStore`.

**Not done:** the import cycles through `components/CalendarComponent/index.ts`, and the
remaining `bugs.md` mediums and lows.

---

## Phase 6 — original list

*4–6 days. Only after everything above.*

- **Landing page:** 9 footer links 404 (BUG-74), `#pricing` has no target (BUG-83), newsletter button has no handler (BUG-82), testimonial avatars are `/placeholder.svg` (BUG-81), no mobile hamburger (BUG-93), heading levels skip (BUG-89).
- **i18n:** missing keys render as raw strings in both languages — `appointment`, `noServices`, `name`, and all three `accessibilityMode` keys (so the accessibility button announces `enableAccessibilityMode` to screen readers). Hardcoded English in the calendar block dialog and `"Unknown Customer"`. **Hebrew has no font**: `layout.tsx:13` loads Inter latin-only while `--font-heebo`/`--font-rubik` are referenced in CSS but never defined.
- **First paint mixes languages** for `en` users: server components read the cookie, client components SSR with the store default `he`. The language toggle also reloads before the cookie write flushes, so the choice can revert.
- **Tailwind v4 classes in a v3.4 project** silently generate nothing across `components/ui/*` — most visibly `sm:max-w-100` on `dialog.tsx:60`, so **every dialog is nearly full-screen on desktop**.
- **Bundle:** three animation libraries (framer-motion in 21 files, motion in 2, gsap in 1 — whose only usage is commented out but still imported), moment + moment-timezone + date-fns, two icon libraries, two Radix stacks (`radix-ui` mono-package *and* 10 scoped packages — two copies of the dialog primitive), zero `next/dynamic` anywhere.
- **Dead code to delete:** `lib/firebase/firestore/snapshots.ts` (~265 lines, zero importers — the documented "real-time Firestore reads" architecture no longer exists; it's a 10s poll), `WaitlistForm`, `EventsPopup`, `InDevelop`, `useStaffForm`, `addAuditRecord`, `app/home/[businessId]/components/server.tsx` (zero bytes), the 130 lines of demo `sampleEvents` shipping inside the production calendar wrapper, and the orphan `/home/booking-success` page.
- **Import cycles** through `components/CalendarComponent/index.ts` — every calendar module participates. Works today only because all cyclic bindings are referenced lazily inside function bodies. Have leaf modules import from `./helpers` directly.
- Remaining `bugs.md` mediums and lows: 9, 10, 16, 19, 24, 27, 28, 31, 34, 38, 47, 54–57, 61–63, 68–70, 75, 77, 84.

---

## Suggested sequencing

| Phase | Days | Gate |
|---|---|---|
| 0 — buildable + honest | 2 | `pnpm build` and `pnpm lint` pass from a clean checkout |
| 1 — identity + onboarding | 5–7 | fresh signup → bookable page → booking → cancel, with rules deployed |
| 2 — security + PII | 3–4 | no unauthenticated PII; no cross-tenant read or write |
| 3 — features that lie | 5–7 | every button either works or is gone |
| 4 — booking correctness | 4–5 | concurrent-booking test passes; invalid slots rejected |
| 5 — sellable minimum | 8–12 | confirmation email sends; privacy + terms live; backups on; rollback tested |
| 6 — polish | 4–6 | Lighthouse measured (not before — every category has open blockers today) |

**Total: 31–43 days.**

Phases 0–2 are non-negotiable and non-parallel. Phase 3 can overlap Phase 4. Phase 5's decisions (5.8) should be made **during** Phase 1 so the build doesn't stall waiting on them.

## Do not deploy `firestore.rules` until §1.1 is done and migrated

`npm run deploy` runs all three targets including `deploy:rules`. With the current client, publishing those rules ends all sign-in. Use `npm run deploy:client` / `deploy:server` individually until the identity migration has run.
