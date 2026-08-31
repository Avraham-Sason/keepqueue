# Keepqueue — Bug Report

**Date:** March 23–27, 2026 (8 sessions)
**Version:** 1.0.5
**Open bugs: 56**
**Closed and removed: 37** — the entries were deleted once each fix was verified; they remain in this file's git history.

---

## Critical (Blocks Core Functionality)

### BUG-5: Calendar View Switcher Dropdown Doesn't Open
- **Severity:** High
- **Location:** `keepqueue-client/components/CalendarComponent/event-calendar.tsx`
- **Steps to reproduce:**
  1. Navigate to Calendar page
  2. Click the view switcher dropdown button (shows "M" for Month)
- **Expected:** Dropdown opens showing Month/Week/Day/Agenda options
- **Actual:** Nothing happens — dropdown menu items never render in DOM
- **Workaround:** Keyboard shortcuts M, W, D, A work correctly
- **Impact:** Users who don't know keyboard shortcuts cannot switch calendar views

---

### BUG-8: Tablet Layout (768px) — Analytics Cards Truncated
- **Severity:** High
- **Location:** Analytics page responsive layout
- **Steps to reproduce:**
  1. View analytics page on tablet (768px width)
- **Expected:** Cards resize or reflow to fit viewport
- **Actual:** Right-column cards ("No-Show R...", "Revenue") are clipped/truncated; text cut off
- **Notes:** Sidebar overlay also squishes main content when open at this breakpoint
- **Impact:** Analytics page unusable on iPad-sized screens

---

## Medium Severity

### BUG-9: Wrong Label Under No-Show Rate Metric
- **Severity:** Medium
- **Location:** Analytics page — No-Show Rate card
- **Steps to reproduce:**
  1. Navigate to Analytics page
  2. Look at the No-Show Rate card subtitle
- **Expected:** Subtitle related to no-shows (e.g., "X no-shows" or "of total appointments")
- **Actual:** Shows "0 total reviews" — wrong metric label (reviews ≠ no-shows)
- **Impact:** Misleading data presentation

---

### BUG-10: Business Address Shows "-" on Public Booking Page
- **Severity:** Medium
- **Location:** Public booking page `/home/[businessId]`
- **Steps to reproduce:**
  1. Visit the public booking page
  2. Look at the address field (location pin icon)
- **Expected:** Shows actual business address, or field is hidden if empty
- **Actual:** Displays just "-"
- **Impact:** Customers cannot find the business location

---

### BUG-11: Multiple DialogContent Missing DialogTitle (Accessibility)
- **Severity:** Medium
- **Location:** Multiple dialog components across the app
- **Steps to reproduce:**
  1. Open any dialog (new event, edit service, etc.)
  2. Check browser console
- **Expected:** No accessibility errors
- **Actual:** Console errors: `DialogContent requires a DialogTitle for the component to be accessible for screen reader users`; also `Missing Description or aria-describedby` warnings
- **Fix:** Add `<DialogTitle>` (or wrap with `<VisuallyHidden>`) to all `<DialogContent>` components
- **Impact:** Screen readers cannot properly announce dialog content; WCAG violation

---

### BUG-12: Copy Booking Link — No User Feedback
- **Severity:** Medium
- **Location:** Dashboard — "Copy link" button
- **Steps to reproduce:**
  1. Go to Dashboard
  2. Find "Your booking page" section
  3. Click "Copy link" button
- **Expected:** Toast/snackbar confirming "Link copied to clipboard"
- **Actual:** No visual feedback — user doesn't know if the action succeeded
- **Fix:** Add a toast notification on successful copy

---

### BUG-13: Billing Currency Field Empty on Edit Details
- **Severity:** Medium
- **Location:** Edit Business Details page
- **Steps to reproduce:**
  1. Navigate to Edit Details via sidebar
  2. Scroll to billing/currency section
- **Expected:** Currency field shows the configured currency (e.g., ILS, USD)
- **Actual:** Currency field is blank/empty

---

### BUG-14: Customer Marketplace Route Returns 404
- **Severity:** Medium
- **Location:** `/customer/marketplace`
- **Steps to reproduce:**
  1. Sign in as customer
  2. Navigate to marketplace (if link exists in customer dashboard)
- **Expected:** Marketplace page loads
- **Actual:** 404 page — route not implemented
- **Impact:** Dead link in navigation

---

### BUG-15: Accessibility Mode Has No Visible Effect
- **Severity:** Medium
- **Location:** Public booking page — accessibility toggle button in navbar
- **Steps to reproduce:**
  1. Visit public booking page
  2. Click accessibility icon (person icon) in the top navbar
  3. Observe the page
- **Expected:** Enhanced contrast, larger fonts, underlined links, or other accessibility improvements
- **Actual:** Button state toggles (`aria-pressed` changes from false to true, label changes to "disableAccessibilityMode") but zero visual changes are applied
- **Impact:** Accessibility feature is non-functional; misleading to users who need it

---

## Low Severity

### BUG-16: No "All Time" Option in Analytics Date Filter
- **Severity:** Low
- **Location:** Analytics page — date range filter dropdown
- **Steps to reproduce:**
  1. Navigate to Analytics
  2. Open the date range dropdown
- **Expected:** Options include "All time" for viewing complete historical data
- **Actual:** Only offers Last 7 days, Last 30 days, Last 90 days
- **Impact:** Cannot view complete business history in analytics

---

### BUG-18: LCP Image Missing `loading="eager"`
- **Severity:** Low
- **Location:** Logo image component (`/logo.png`)
- **Steps to reproduce:**
  1. Load any page
  2. Check browser console
- **Console warning:** `Image with src "/logo.png" was detected as the Largest Contentful Paint (LCP). Please add the loading="eager" property`
- **Fix:** Add `loading="eager"` to the logo `<Image>` component
- **Impact:** Performance — delays Largest Contentful Paint metric

---

### BUG-19: Duplicate Service Names on Booking Page
- **Severity:** Low
- **Location:** Public booking page — service selection (Step 1)
- **Steps to reproduce:**
  1. Visit public booking page
  2. View service list in Step 1
- **Actual:** Two services named "פילאטיס מכשירים" appear — one at ₪90 and one at ₪300
- **Notes:** May be intentional data, but there is no visual distinction besides price
- **Impact:** Customer confusion when booking — no way to tell which service is which

---

## Critical (Added in Session 2)

### BUG-22: Browser Back Button Exits Booking Wizard
- **Severity:** Medium
- **Location:** Booking wizard — `keepqueue-client/components/BookingInterface/`
- **Steps to reproduce:**
  1. Start booking flow (select service → date/time → confirm)
  2. On step 4 (confirmation), press browser Back button
- **Expected:** Returns to previous wizard step (step 2 or 3)
- **Actual:** Navigates away from the booking page entirely — returns to sign-in page
- **Root cause:** Wizard steps are managed with React state, not browser history (no `pushState`/`replaceState`)
- **Fix:** Use `window.history.pushState` for each wizard step, or intercept `popstate` event
- **Impact:** Users lose all booking progress if they press Back

---

### BUG-23: Landing Page Returns 404 — Wrong Filename
- **Severity:** Medium
- **Location:** `keepqueue-client/app/landing-page/index.tsx`
- **Steps to reproduce:**
  1. Navigate to `/landing-page`
- **Expected:** Marketing/landing page loads
- **Actual:** 404 — "This page could not be found"
- **Root cause:** File is named `index.tsx` but Next.js App Router requires `page.tsx` for routable pages
- **Fix:** Rename `index.tsx` to `page.tsx`
- **Impact:** Landing page is completely inaccessible

---

### BUG-24: Empty State Message Misleading on Search/Filter
- **Severity:** Medium
- **Location:** Appointments page — empty state component
- **Steps to reproduce:**
  1. Go to Appointments page
  2. Type "zzzznonexistent" in search box
- **Expected:** "No appointments match your search" (or similar search-specific message)
- **Actual:** "No appointments yet — Appointments will appear here when customers book"
- **Impact:** Misleading — implies no appointments exist when actually the search/filter just didn't match

---

## Low (Added in Session 2)

### BUG-27: Working Hours Section Has Duplicate Header
- **Severity:** Low
- **Location:** Edit Business Details page — Working hours section
- **Steps to reproduce:**
  1. Navigate to Edit Details
  2. Scroll to "Working hours" section
- **Expected:** Single heading
- **Actual:** "Working hours" heading and "Toggle each day and set one or more opening intervals (24h)" subtitle appear twice — once as section header and once inside the section body
- **Impact:** Visual clutter, minor UI inconsistency

---

## High (Added in Session 3)

### BUG-28: Mobile (375px) — Appointment Action Buttons Overflow/Truncated
- **Severity:** High
- **Location:** `keepqueue-client/app/business/appointments/` — appointment card action buttons
- **Steps to reproduce:**
  1. View Appointments page on mobile (375px width)
  2. Look at appointment cards with "Booked" status
- **Expected:** Action buttons wrap to multiple lines or show icons only on mobile
- **Actual:** Buttons overflow horizontally — "Mark no-show" and "Mark done" are cut off (showing "Ma...")
- **Impact:** Users on mobile cannot access Mark no-show and Mark done actions

---

## Medium (Added in Session 3)

### BUG-30: Customer Dashboard Unreachable — No Navigation Link
- **Severity:** Medium
- **Location:** Customer-facing UI (public booking page navbar)
- **Steps to reproduce:**
  1. Sign in as customer
  2. Look for a link to "My Appointments" or "Dashboard" in the navbar
- **Expected:** Navbar has a link to customer's appointment dashboard
- **Actual:** No link to `/customer/dashboard` exists in the booking page navbar — only accessible after fresh signup or from booking success page
- **Impact:** Customers have no way to view or manage their existing appointments from the booking page

---

### BUG-31: Sidebar Active Page Highlight Incorrect After Navigation
- **Severity:** Medium
- **Location:** Sidebar navigation component
- **Steps to reproduce:**
  1. Open sidebar
  2. Navigate to Appointments page
  3. Observe the sidebar highlight
- **Expected:** "Appointments" is highlighted in the sidebar
- **Actual:** "Dashboard" remains highlighted even when on another page
- **Impact:** Users cannot tell which page they are on from the sidebar

---

## Low (Added in Session 3)

### BUG-33: Past Appointments Still Show "Booked" Status — No Auto-Expiry
- **Severity:** Low
- **Location:** Appointments / Calendar event data
- **Steps to reproduce:**
  1. View customer appointments via "View appointments" button on Customers page
  2. Look at past appointments (e.g., 29/01/2026)
- **Expected:** Past appointments auto-transition to "Done" or "Expired" after the appointment time passes
- **Actual:** Appointments from Jan/Feb 2026 still show "Booked" status in March 2026
- **Impact:** Misleading data — stale "Booked" appointments pollute reporting and views

---

### BUG-34: Repeated getBusiness API Errors — Race Condition / Duplicate Requests
- **Severity:** Low
- **Location:** Client-side API call layer
- **Steps to reproduce:**
  1. Sign in and navigate through pages
  2. Open browser console and filter for errors
- **Expected:** Clean console with no API errors during normal navigation
- **Actual:** Repeated `Error calling API: {"method":"POST","url":"getBusiness"} CanceledError` and `[object Object]` errors
- **Root cause:** Multiple components likely calling `getBusiness` simultaneously, causing request cancellation
- **Impact:** Console noise; potential unnecessary network overhead; `[object Object]` in error logging masks actual error details

---

## Critical (Added in Session 4)

### BUG-37: Massive Client-Side Firestore Bypass — 7 Collections Written Directly
- **Severity:** High (Architecture/Security)
- **Location:** Multiple client files — see affected list below
- **Description:** The client writes directly to Firestore for 7 collections, completely bypassing the Express API's validation, business logic, audit trail, and cache management.
- **Affected collections and operations:**
  - `calendar` — appointment status changes (NO_SHOW, DONE), vacation/holiday creation
  - `services` — create, update, soft-delete services
  - `staff` — create, update, soft-delete staff
  - `users` — customer blocking, owner details update, new user creation
  - `reviews` — flag/unflag reviews
  - `waitlist` — join/leave waitlist
  - `businesses` — update business details
- **Affected files:**
  - `app/business/appointments/hooks.tsx` (calendar status)
  - `app/business/calendar/Calendar.tsx` (calendar events)
  - `app/business/services/hooks.tsx` (services CRUD)
  - `app/business/staff/hooks.tsx` (staff CRUD)
  - `app/business/customers/hooks.tsx` (customer blocking)
  - `app/business/editDetails/hooks.tsx` (business + owner updates)
  - `app/business/reviews/Reviews.tsx` (review flagging)
  - `components/BookingInterface/WaitlistForm.tsx` (waitlist)
  - `components/signup-form.tsx` (user creation)
- **Impact:** Server-side cache (`CacheManager`) becomes stale; no audit trail; no server-side validation; Firestore security rules are the only protection layer. The server has corresponding API routes that are never used.
- **Fix:** Route all writes through the Express API `/actions/*` endpoints

---

## Medium (Added in Session 4)

### BUG-38: Calendar "New Event" Allows Empty Title
- **Severity:** Medium
- **Location:** `keepqueue-client/app/business/calendar/Calendar.tsx`
- **Steps to reproduce:**
  1. Go to Calendar page
  2. Click "New event"
  3. Leave title empty, click "Add"
- **Expected:** Validation error — title is required
- **Actual:** Event is created with empty title (writes directly to Firestore with no validation)
- **Impact:** Empty-titled events clutter the calendar

---

### BUG-43: Race Condition in Appointment Overlap Detection
- **Severity:** Critical
- **Location:** `keepqueue-server/src/actions/businesses/appointments/services.ts` lines 21-47
- **Description:** The overlap check (`hasCalendarOverlapInCache`) reads from the in-memory cache, NOT from Firestore within the transaction. Two simultaneous booking requests can both pass the overlap check and create duplicate appointments in the same time slot.
- **Race condition timeline:**
  1. Request A: checks cache → no overlap ✓
  2. Request B: checks cache → no overlap ✓ (A not yet in cache)
  3. Request A: writes to Firestore → commits
  4. Request B: writes to Firestore → commits (DUPLICATE!)
  5. Cache updates asynchronously via Firestore listener
- **Also affects:** `SRescheduleAppointment` (line 103) — same pattern
- **Root cause:** No locking mechanism, no database constraints, cache sync is async
- **Fix:** Read calendar events within the Firestore transaction (using `tx.get()`) instead of reading from cache; or add a distributed lock
- **Impact:** Double-bookings possible under concurrent load

---

## High (Added in Session 5)

### BUG-44: Business Timezone Not in Type Schema — Hardcoded Fallback
- **Severity:** High
- **Location:** `keepqueue-server/src/actions/businesses/appointments/helpers.ts` line 108
- **Description:** Business timezone is accessed via `(business as any)?.timeZone || (business as any)?.timezone || "Asia/Jerusalem"` — using `as any` type assertion because the `Business` interface does NOT include a `timezone` field. All businesses default to "Asia/Jerusalem" regardless of actual location.
- **Also affects:** Server logger (`loggerManager.ts` line 17) hardcodes "Asia/Jerusalem"
- **Fix:** Add `timezone: string` to `Business` interface in both client and server `types/global.ts`; add timezone picker to Edit Details page
- **Impact:** Businesses outside Israel will have incorrect availability calculations and appointment times

---

### BUG-47: Logo Stored as Base64 in Firestore Instead of Firebase Storage
- **Severity:** High (Architecture)
- **Location:** `keepqueue-client/app/business/editDetails/hooks.tsx` line 164
- **Description:** Business logos are stored as inline base64 data URL strings in the Firestore `businesses` document (`logoUrl` field). Firebase Storage utility functions (`uploadFileToStorage()`, `getFileUrlFromStorage()`) exist in `lib/firebase/storage.ts` but are never used for logo uploads.
- **Problems:**
  - Base64 encoding inflates file size by ~33%
  - Firestore documents have a 1MB size limit
  - No CDN caching or image optimization possible with inline data URLs
  - Every time business data is fetched, the full base64 image is transferred
- **Fix:** Use `uploadFileToStorage()` to store logo in Firebase Storage; save the download URL in Firestore
- **Impact:** Performance degradation, bandwidth waste, potential data loss on large images

---

### BUG-49: No Global React Error Boundary
- **Severity:** Medium
- **Location:** `keepqueue-client/app/layout.tsx`
- **Description:** The app has no React error boundary. Any unhandled error in a component tree will crash the entire app with a white screen. Next.js provides `error.tsx` convention for route-level error boundaries, but none are implemented.
- **Fix:** Add `error.tsx` files at root and key route segments; or wrap layout children with a custom ErrorBoundary component
- **Impact:** Unhandled errors crash the entire app with no recovery option

---

### BUG-50: Firestore Operations Fail Silently — No UI Error Feedback
- **Severity:** Medium
- **Location:** `keepqueue-client/lib/firebase/firestore/dataFetching.ts` (multiple lines)
- **Description:** All Firestore helper functions swallow errors and return fallback values:
  - `getAllDocuments()` returns `[]` on error (line 13)
  - `getDocumentById()` returns `null` (line 27)
  - `setDocument()` returns `false` (line 38)
  - `addDocument()` returns `false` (line 52)
  - `deleteDocument()` returns `false` (line 63)
  - `queryDocuments()` returns `[]` (line 100)
- No toast, no error state, no UI feedback when operations fail. Users think their action succeeded when it didn't.
- **Fix:** Propagate errors to callers; add toast notifications for write failures
- **Impact:** Users may lose data without knowing — silent write failures

---

### BUG-51: Off-by-One Day Risk for Cross-Timezone Booking
- **Severity:** Medium
- **Location:** `keepqueue-client/components/BookingInterface/hooks.ts` lines 207-230
- **Description:** When generating available date buttons, `moment().tz(userTimeZone).startOf("day")` is used as the base, but availability slots come from the server in UTC. A user in Tokyo (+09:00) booking a 9am Tel Aviv appointment may see the slot under the wrong date.
- **Also:** `withinSchedule()` (lines 175-194) uses `moment.utc()` which may incorrectly validate times if the business schedule assumes a different timezone
- **Fix:** Ensure date grouping uses business timezone, not user timezone, for slot assignment
- **Impact:** Cross-timezone users may see slots on wrong dates

---

### BUG-53: Notification System Fully Stubbed — Zero Implementation
- **Severity:** Medium (Feature Gap)
- **Location:** Multiple — types, cache, TODO-SERVER.text
- **Description:** The notification system has complete infrastructure (types, cache, data query) but zero sending implementation:
  - `MessageTemplate` and `NotificationLog` types defined in both client/server
  - Collections registered in Firestore: `message_templates`, `notification_logs`
  - Cache layer configured in `cacheManager.ts`
  - Data API returns templates via `S_getBusiness` endpoint
  - User preferences modeled in `UserBase.contacts` field
  - **Missing:** No SMS/email sending logic, no template variable substitution, no scheduled reminders, no client UI for templates
  - TODO-SERVER.text sections 11-12 describe expected scope (Twilio, SendGrid, reminder scheduler)
- **Impact:** Customers receive no appointment confirmations, reminders, or notifications

---

## Low (Added in Session 5)

### BUG-54: Duplicate Date Libraries — moment + date-fns (~70KB Bloat)
- **Severity:** Low (Performance)
- **Location:** `keepqueue-client/package.json`
- **Description:** Both `moment` + `moment-timezone` and `date-fns` are dependencies. Moment.js (~5,700 lines, ~67KB minified+gzipped) is used in 6+ files (time.ts, Calendar.tsx, BookingInterface/hooks.ts, CalendarComponent/, GlobalConfig.tsx). `date-fns` is also a dependency and is tree-shakeable.
- **Fix:** Migrate moment usage to date-fns throughout the client
- **Impact:** ~50-70KB unnecessary bundle size

---

### BUG-55: Unused `motion` Package in Dependencies
- **Severity:** Low (Performance)
- **Location:** `keepqueue-client/package.json`
- **Description:** Three animation libraries are in dependencies: `framer-motion` (used in 23 components), `motion` v12.23.24 (never imported anywhere), and `gsap` (only 1 usage). The `motion` package is completely unused.
- **Fix:** Remove `motion` from package.json; evaluate removing `gsap` if only used once
- **Impact:** Unnecessary dependency bloat

---

### BUG-56: No Dynamic Imports / Code Splitting for Heavy Components
- **Severity:** Low (Performance)
- **Location:** `keepqueue-client/` — no `dynamic()` or `lazy()` usage found
- **Description:** All components are eagerly loaded. Heavy components that would benefit from code splitting:
  - `components/CalendarComponent/` — complex drag-and-drop calendar
  - `app/business/analytics/` — data-heavy charts
  - `components/BookingInterface/` — only needed on public booking page
- **Fix:** Use `next/dynamic` for route-specific heavy components
- **Impact:** Larger initial bundle, slower first load

---

### BUG-57: Duplicate Icon Libraries (lucide-react + @remixicon/react)
- **Severity:** Low (Performance)
- **Location:** `keepqueue-client/package.json`
- **Description:** `lucide-react` is used in 38 files; `@remixicon/react` is used in only 3 files (CalendarComponent/agenda-view.tsx, event-calendar.tsx, event-dialog.tsx). Consolidating on lucide-react would reduce bundle size.
- **Fix:** Replace 4 Remixicon icons with lucide-react equivalents
- **Impact:** Minor bundle size reduction (~5KB)

---

### BUG-58: No Error Tracking Service (Sentry/LogRocket)
- **Severity:** Low (Operations)
- **Location:** Entire project
- **Description:** No centralized error tracking service is configured. Client errors go to browser console only (ephemeral). Server errors go to stdout only (lost on container restart). No alerting, no error aggregation, no user session replay.
- **Fix:** Integrate Sentry or similar error tracking for both client and server
- **Impact:** Production errors go unnoticed; debugging relies on user reports

---

### BUG-60: No Login Brute-Force Protection — No Slowdown on Failed Auth
- **Severity:** Medium (Security)
- **Location:** `keepqueue-server/src/actions/services.ts` (SLogin), `keepqueue-server/src/actions/router.ts` line 9
- **Description:** The login endpoint has no progressive delay, no exponential backoff, no account lockout after failed attempts. Global rate limiter (100 req/60s) is the only protection but is too permissive for auth endpoints. No per-user rate limiting exists.
- **Fix:** Add stricter rate limiting on `/actions/login` (e.g., 5 req/min per IP); consider `express-slow-down` for progressive delays
- **Impact:** Brute-force attacks on Firebase auth tokens are not throttled beyond global limit

---

### BUG-61: Audit Type Definitions Out of Sync Between Client and Server
- **Severity:** Medium
- **Location:** `keepqueue-server/src/types/global.ts` lines 188-189 vs `keepqueue-client/lib/types/global.ts` lines 186-187
- **Description:** The `Audit` interface has different `entity` and `action` union types:
  - **Server:** `entity: "services" | "businesses" | "calendar" | "staff" | "customers" | "waitlist" | "reviews"` / `action: "create" | "update" | "delete" | "block" | "unblock" | "moderate"`
  - **Client:** `entity: "services" | "businesses" | "calendar"` / `action: "create" | "update" | "delete"`
  - Client is missing 4 entity types and 3 action types
- **Fix:** Sync client types to match server; consider a shared types package
- **Impact:** Client TypeScript won't recognize audit records with entity "staff"/"customers"/"waitlist"/"reviews" or actions "block"/"unblock"/"moderate"

---

### BUG-62: Business.description Field Missing on Server Type
- **Severity:** Medium
- **Location:** `keepqueue-client/lib/types/global.ts` line 66 (present) vs `keepqueue-server/src/types/global.ts` (missing)
- **Description:** The `Business` interface in the client has an optional `description?: string` field that is missing from the server's Business interface. Data may be stored/retrieved inconsistently.
- **Fix:** Add `description?: string` to server's Business interface
- **Impact:** Server TypeScript won't type-check description field access

---

## Low (Added in Session 5 — continued)

### BUG-63: Missing setTimeout Cleanup — State Update on Unmounted Component
- **Severity:** Low
- **Location:** Multiple files:
  - `keepqueue-client/app/business/dashboard/components/QuickActionsSection.tsx` line 25
  - `keepqueue-client/components/BookingInterface/BookingInterface.tsx` lines 305-309, 463-466
- **Description:** Three `setTimeout` calls without cleanup in useEffect return. If components unmount before timeouts fire, React will warn about state updates on unmounted components.
  - QuickActionsSection: `setTimeout(() => setCopied(false), 2000)` after copy link
  - BookingInterface: `setTimeout(() => window.scrollTo(...), 100)` in handleNext and onDateClick
- **Fix:** Store timeout ref and clear in useEffect cleanup or use `useRef` pattern
- **Impact:** Memory leak warnings in development; minor memory leak in production

---

### BUG-64: In-Memory Rate Limiter Not Scalable
- **Severity:** Low (Architecture)
- **Location:** `keepqueue-server/src/middlewares/rateLimiter.ts`
- **Description:** Rate limiter uses an in-memory `Map<string, RateLimitEntry>` for per-IP tracking. If the server scales to multiple instances (e.g., behind a load balancer), each instance maintains its own rate limit state — effectively multiplying the allowed requests per window.
- **Fix:** Use Redis-based rate limiter (e.g., `rate-limit-redis`) when scaling to multiple instances
- **Impact:** Rate limiting ineffective with multiple server instances

---

### BUG-68: Inconsistent ID Min Length Across Schemas
- **Severity:** Medium
- **Location:** `keepqueue-server/src/data/schemes.ts` (multiple lines)
- **Description:** ID field validation is inconsistent:
  - `serviceId`, `businessId` (some schemas): `.min(5)` — good
  - `businessId` (staff, waitlist, reviews, ratings, appointments, analytics schemas): `.min(1)` — too permissive
  - All IDs in appointment schemas: `.min(1)` — too permissive
- **Fix:** Standardize all ID fields to `.min(5)` for consistency and to prevent empty-like values
- **Impact:** Weak validation allows near-empty ID strings through

---

## Low (Added in Session 5 — Zod Audit)

### BUG-69: Phone Fields Lack Min Length and Format Validation
- **Severity:** Low
- **Location:** `businesses/schemes.ts` line 25, `staff/schemes.ts` line 24, `customers/schemes.ts` line 22
- **Description:** Phone fields use `string().max(20).optional()` with no `.min()` and no regex validation. Single-character strings like "x" pass validation.
- **Fix:** Add `.min(7)` and optionally regex: `.regex(/^[\d\+\-\(\)\s]+$/)`
- **Impact:** Invalid phone numbers stored in database

---

### BUG-70: logoUrl Field Accepts Any String — No URL Validation
- **Severity:** Low
- **Location:** `keepqueue-server/src/actions/businesses/schemes.ts` line 31
- **Description:** `logoUrl: string().optional()` has no `.url()` validation, unlike `photoURL: string().url().optional()` in staff schemas. Accepts any string including malicious content.
- **Fix:** Add `.url()` validator: `logoUrl: string().url().optional()`
- **Impact:** Non-URL strings stored as logoUrl; inconsistent with staff photoURL validation

---

## Additional Bugs (from QA Sessions 6–8)

### BUG-73: Public Booking Page — Firebase Permission Error (Business Info Missing)
- **Severity:** High
- **Location:** `/home/[businessId]` — `BookingInterface` component
- **Description:** Business name, address, and phone all show `—`. Console error: `FirebaseError: Missing or insufficient permissions.` The component queries Firestore directly for the business document, but security rules deny unauthenticated reads. Server-fetched data (`/data/getBusiness`) works fine.
- **Fix:** Remove client-side Firestore fallback and rely solely on `/data/getBusiness`, or update Firestore rules
- **Impact:** Every customer sees a broken booking page with no business info

---

### BUG-74: All 9 Footer Links Return 404
- **Severity:** Medium
- **Location:** Landing page footer
- **Description:** All footer navigation links lead to non-existent pages: `/help`, `/contact`, `/api`, `/about`, `/careers`, `/blog`, `/privacy`, `/terms`, `/marketplace`
- **Fix:** Create pages or remove links. `/privacy` and `/terms` are legally required (Israeli privacy law)
- **Impact:** Product looks unfinished; legal compliance risk for privacy/terms pages

---

### BUG-75: Invalid Business ID Shows Booking Page Instead of 404
- **Severity:** Medium
- **Location:** `/home/[businessId]`
- **Description:** Navigating to `/home/invalid-id-xyz` renders the full booking UI with empty data (all `—`) instead of showing a 404 or error message.
- **Fix:** Check if business exists and show error/404 if not
- **Impact:** Confusing UX for invalid links

---

### BUG-76: English Mode — Sign-In Page Still Shows Hebrew Text
- **Severity:** Medium
- **Location:** `/auth/signin/business` and `/auth/signin/customer`
- **Description:** With `language=en` cookie set, sign-in form labels, buttons, and links remain in Hebrew. `SignInForm` is a client component that reverts to Zustand default (Hebrew) before `LanguageInitializer` effect runs.
- **Fix:** Read language from cookie on server render or ensure Zustand hydrates before form renders
- **Impact:** i18n broken on sign-in pages

---

### BUG-77: English Mode — Landing Page Renders RTL with `lang="he"`
- **Severity:** Medium
- **Location:** Landing page root layout
- **Description:** With `language=en` cookie, first load still shows `<html dir="rtl" lang="he">`. The `LanguageInitializer` client component only updates `document.documentElement` after hydration.
- **Fix:** Read language cookie server-side in root layout to set initial dir/lang
- **Impact:** English users see RTL layout on first load

---

### BUG-78: English Mode — Testimonials and CTA Text Remain Hebrew
- **Severity:** Medium
- **Location:** Landing page testimonials and CTA sections
- **Description:** Testimonial names ("שרה כהן", "דוד לוי", "מיכל אברהם"), "מוכן להתחיל?" heading, and newsletter section don't switch to English.
- **Fix:** Add missing translation keys to `en.json`
- **Impact:** Incomplete English translation

---

### BUG-80: Booking Page Shows No Services — Empty Service Selection
- **Severity:** Medium
- **Location:** `/home/[businessId]` — Step 1
- **Description:** "בחר שירות" step shows no service cards, only the "continue" button. Services are fetched via the same failing Firestore direct query (related to BUG-73).
- **Fix:** Same as BUG-73 — fix data source
- **Impact:** Customers cannot complete a booking

---

### BUG-81: Testimonial Section Uses Placeholder Images
- **Severity:** Medium
- **Location:** Landing page testimonials
- **Description:** All 3 testimonial avatars use `/placeholder.svg?height=60&width=60`
- **Fix:** Replace with real images or remove avatars
- **Impact:** Looks unfinished

---

### BUG-82: Newsletter "Start Now" Button Has No onClick Handler
- **Severity:** Medium
- **Location:** `app/landing-page/client-components.tsx` — newsletter section
- **Description:** Entering email and clicking "התחל עכשיו" does nothing — no click handler, no network request, no feedback.
- **Fix:** Add form submission handler or remove the section
- **Impact:** Newsletter feature is non-functional

---

### BUG-83: Nav Link #pricing Points to Non-Existent Section
- **Severity:** Medium
- **Location:** Landing page header navigation
- **Description:** "תמחור" (Pricing) nav link targets `#pricing` anchor, but no element with `id="pricing"` exists on the page.
- **Fix:** Add pricing section or remove the nav link
- **Impact:** Pricing nav leads nowhere

---

### BUG-84: Custom 404 Page Missing — Using Next.js Default
- **Severity:** Medium
- **Location:** All unknown routes
- **Description:** Default Next.js 404 page with no branding, no navigation, no "Go Home" button.
- **Fix:** Create `app/not-found.tsx` with branded 404 page
- **Impact:** Poor UX on invalid routes

---

### BUG-89: Heading Hierarchy Skips Levels (A11y)
- **Severity:** Low
- **Location:** Landing page
- **Description:** `H1 → H3` (skips H2) for business/customer cards; `H2 → H4` (skips H3) for testimonial names. WCAG 2.1 AA recommends sequential heading levels.
- **Fix:** Use proper heading hierarchy

---

### BUG-93: No Hamburger Menu on Mobile Landing Page
- **Severity:** Low
- **Location:** Landing page header, viewport ≤ 768px
- **Description:** Desktop nav links hidden via `md:flex` but no mobile nav alternative. Navigation links completely unreachable on small screens.
- **Fix:** Add hamburger menu with mobile nav drawer
- **Impact:** Mobile users cannot navigate from landing page header

---

## Quick Reference

| # | Severity | Bug Summary | Fix Effort |
|---|----------|-------------|------------|
| 5 | High | Calendar view dropdown doesn't open | Small |
| 8 | High | Tablet layout truncation | Small |
| 9 | Medium | Wrong label under No-Show Rate | 1 line |
| 10 | Medium | Address shows "-" on booking page | Small |
| 11 | Medium | DialogContent missing DialogTitle | Small |
| 12 | Medium | Copy link — no feedback | Small |
| 13 | Medium | Currency field empty | Small |
| 14 | Medium | Marketplace 404 | Medium |
| 15 | Medium | Accessibility mode no-op | Medium |
| 16 | Low | No "All time" analytics filter | Small |
| 18 | Low | LCP image missing eager | 1 line |
| 19 | Low | Duplicate service names | Data issue |
| 22 | Medium | Browser back exits booking wizard | Medium |
| 23 | Medium | Landing page 404 — wrong filename | 1 line (rename) |
| 24 | Medium | Misleading empty state on search | Small |
| 27 | Low | Duplicate working hours header | Small |
| 28 | High | Mobile appointment buttons overflow/truncated | Small |
| 30 | Medium | Customer dashboard unreachable — no nav link | Small |
| 31 | Medium | Sidebar active page highlight incorrect | Small |
| 33 | Low | Past appointments still show "Booked" — no auto-expiry | Medium |
| 34 | Low | Repeated getBusiness API errors / race condition | Medium |
| 37 | High | Massive client-side Firestore bypass — 7 collections written directly | Large |
| 38 | Medium | Calendar "New event" allows empty title | Small |
| 43 | **Critical** | **Race condition in appointment overlap detection** | **Large** |
| 44 | High | Business timezone not in type schema — hardcoded fallback | Medium |
| 47 | High | Logo stored as base64 in Firestore instead of Firebase Storage | Medium |
| 49 | Medium | No global React error boundary | Medium |
| 50 | Medium | Firestore operations fail silently — no UI error feedback | Medium |
| 51 | Medium | Off-by-one day risk for cross-timezone booking | Medium |
| 53 | Medium | Notification system fully stubbed — zero implementation | Large |
| 54 | Low | Duplicate date libraries (moment + date-fns) — ~70KB bloat | Medium |
| 55 | Low | Unused `motion` package in dependencies | 1 line |
| 56 | Low | No dynamic imports / code splitting for heavy components | Medium |
| 57 | Low | Duplicate icon libraries (lucide-react + @remixicon/react) | Small |
| 58 | Low | No error tracking service (Sentry/LogRocket) | Medium |
| 60 | Medium | No login brute-force protection — no slowdown | Small |
| 61 | Medium | Audit type definitions out of sync client/server | Small |
| 62 | Medium | Business.description field missing on server type | 1 line |
| 63 | Low | Missing setTimeout cleanup — memory leak risk | Small |
| 64 | Low | In-memory rate limiter not scalable to multi-instance | Medium |
| 68 | Medium | Inconsistent ID min length across schemas | Small |
| 69 | Low | Phone fields lack min length and format validation | Small |
| 70 | Low | logoUrl accepts any string — no .url() validation | 1 line |
| 73 | High | Public booking page Firebase permission error — business info missing | Medium |
| 74 | Medium | All 9 footer links return 404 | Medium |
| 75 | Medium | Invalid business ID shows booking page instead of 404 | Small |
| 76 | Medium | English mode: sign-in still shows Hebrew text | Medium |
| 77 | Medium | English mode: landing page renders RTL with lang="he" | Medium |
| 78 | Medium | English mode: testimonials and CTA remain Hebrew | Small |
| 80 | Medium | Booking page shows no services — empty selection | Medium (BUG-73) |
| 81 | Medium | Testimonial section uses placeholder images | Small |
| 82 | Medium | Newsletter "Start Now" button non-functional | Small |
| 83 | Medium | Nav #pricing link points to non-existent section | Small |
| 84 | Medium | Custom 404 page missing — Next.js default | Small |
| 89 | Low | Heading hierarchy skips levels (A11y) | Small |
| 93 | Low | No hamburger menu on mobile landing page | Medium |
