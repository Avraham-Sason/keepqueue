# Keepqueue — Bug Report

**Date:** March 23, 2026
**Version:** 1.0.5
**Total bugs: 27** — Critical: 4 | High: 6 | Medium: 10 | Low: 7

---

## Critical (Blocks Core Functionality)

### BUG-1: Confirm Appointment API — Field Name Mismatch (400 Error)
- **Severity:** Critical
- **Location:** `keepqueue-client/app/business/appointments/helpers.ts`
- **Steps to reproduce:**
  1. Navigate to Appointments page
  2. Click "Confirm" on any pending appointment
- **Expected:** Appointment status changes to confirmed
- **Actual:** 400 Bad Request error
- **Root cause:** `confirmAppointment()` sends `{ eventId }` but the server Zod schema (`keepqueue-server/src/actions/businesses/appointments/schemes.ts`) expects `{ calendarEventId }`
- **Fix:** Change `{ eventId }` to `{ calendarEventId: eventId }` in `helpers.ts`
- **Impact:** No appointment can be confirmed through the UI

---

### BUG-2: Cancel Appointment API — Field Name Mismatch (400 Error)
- **Severity:** Critical
- **Location:** `keepqueue-client/app/business/appointments/helpers.ts`
- **Steps to reproduce:**
  1. Navigate to Appointments page
  2. Click "Cancel" on any appointment
- **Expected:** Appointment is cancelled
- **Actual:** 400 Bad Request error
- **Root cause:** Same as BUG-1 — `cancelAppointment()` sends `{ eventId }` instead of `{ calendarEventId: eventId }`
- **Fix:** Change `{ eventId }` to `{ calendarEventId: eventId }` in `helpers.ts`
- **Impact:** No appointment can be cancelled through the UI

---

### BUG-3: Direct URL Navigation Loses Session
- **Severity:** Critical
- **Location:** Auth/session persistence layer
- **Steps to reproduce:**
  1. Sign in as business user
  2. Navigate to dashboard successfully
  3. Type `/business/calendar` (or any protected route) directly in the browser URL bar
- **Expected:** Page loads with authenticated session
- **Actual:** Redirects to sign-in page — session token lost on full page load
- **Notes:** SPA navigation via sidebar works fine; only full page loads/refreshes lose the session
- **Impact:** Users cannot bookmark, refresh, or share any admin URL

---

## High Severity

### BUG-4: Language Toggle Causes Session Loss
- **Severity:** High
- **Location:** Language switching mechanism
- **Steps to reproduce:**
  1. Sign in as business user
  2. Open sidebar
  3. Switch language from EN to HE (or vice versa)
- **Expected:** Language changes, user stays logged in
- **Actual:** Redirects to sign-in page — session lost
- **Impact:** Users are logged out every time they change language

---

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

### BUG-6: Analytics Shows 0 Data Despite Existing Appointments
- **Severity:** High
- **Location:** Analytics page data filtering/aggregation logic
- **Steps to reproduce:**
  1. Navigate to Analytics page
  2. Select "Last 90 days" filter
  3. Note that appointments exist within this date range
- **Expected:** Metrics reflect actual appointment data
- **Actual:** All metrics show 0 (Total Bookings: 0, Revenue: 0, etc.)
- **Possible cause:** Date filtering/comparison logic mismatch, or cache data not being properly queried
- **Impact:** Analytics page is completely unusable

---

### BUG-7: Mark No-Show / Mark Done Bypass Server API
- **Severity:** High
- **Location:** `keepqueue-client/app/business/appointments/hooks.tsx`
- **Steps to reproduce:**
  1. Click "Mark No-Show" or "Mark Done" on any appointment
  2. Observe that the action succeeds (unlike Confirm/Cancel which fail)
- **Expected:** Status update goes through server API with validation
- **Actual:** Direct Firestore write via `setDocument("calendar", eventId, { status: "NO_SHOW" })` — bypasses server entirely
- **Impact:** No server-side validation, no logging, no audit trail for these status changes; inconsistent with Confirm/Cancel architecture

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

### BUG-17: Console.log Statements Left in Production Code
- **Severity:** Low
- **Location:** Multiple components
- **Steps to reproduce:**
  1. Open browser console on any page
- **Actual output:**
  - `⚡ fetching business [object Object]`
  - `currentBusiness [object Object]`
- **Notes:** `[object Object]` indicates objects are being logged via string concatenation instead of passing as separate arguments
- **Fix:** Remove all `console.log` calls or use the `logger` utility
- **Impact:** Noisy console output; minor performance overhead

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

### BUG-20: API Endpoints Have No Authentication Middleware
- **Severity:** Critical (Security)
- **Location:** `keepqueue-server/src/data/router.ts` and all action routers
- **Steps to reproduce:**
  1. Open browser console (or use curl/Postman)
  2. Run: `fetch('http://localhost:9000/data/getBusiness', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({businessId:'GPajiLlPDRwWaJwNvWoz'}) })`
  3. Observe 200 OK response with full business data — no auth token needed
- **Affected endpoints (confirmed):**
  - `POST /data/getBusiness` → 200 (leaks business data)
  - `POST /data/getBusinessCustomers` → 200 (leaks customer PII)
  - `POST /data/getUserById` → 200 (leaks user data)
  - `POST /actions/businesses/appointments/confirm` → 500 (crashes, but not 401)
  - `POST /actions/businesses/appointments/cancel` → 500 (crashes, but not 401)
- **Root cause:** `dataRouter` only applies `validateBody()` middleware — no `authenticate` or `verifyIdToken` middleware is applied to any route
- **Fix:** Add authentication middleware to all `/data/*` and `/actions/*` routes: `dataRouter.use(authenticateMiddleware)` before route definitions
- **Impact:** Any unauthenticated user can access all business data, customer PII (names, emails, phones), and user information. Action endpoints crash instead of returning 401.

---

## High (Added in Session 2)

### BUG-21: Past Time Slots Bookable for Today
- **Severity:** High
- **Location:** `keepqueue-client/components/BookingInterface/` — date/time step
- **Steps to reproduce:**
  1. Go to public booking page
  2. Select any service, click "Continue to date and time"
  3. Select "Today"
  4. Observe time slots like 08:00, 08:30, 09:00 are all enabled and clickable
- **Expected:** Past time slots for today should be disabled/greyed out
- **Actual:** All time slots are fully clickable regardless of current time — `disabled: false, opacity: 1`
- **Fix:** Filter available time slots to exclude times before `new Date()` when selected date is today
- **Impact:** Customers can book appointments in the past

---

## Medium (Added in Session 2)

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

### BUG-25: Duration Grammar Error — "1 hours" Instead of "1 hour"
- **Severity:** Low
- **Location:** Services page — duration display
- **Steps to reproduce:**
  1. Navigate to Services
  2. Look at Personal Training card (90 minutes)
- **Expected:** "Duration: 1 hour 30 minutes"
- **Actual:** "Duration: 1 hours 30 minutes"
- **Fix:** Use singular "hour" when value is 1
- **Impact:** Grammar error visible to all users

---

### BUG-26: Currency Shows "INS" Instead of "ILS"
- **Severity:** Low
- **Location:** Services page — price display
- **Steps to reproduce:**
  1. Navigate to Services
  2. Look at any service price
- **Expected:** "Price: 60 ILS" or "Price: ₪60"
- **Actual:** "Price: 60 INS" — invalid currency code
- **Fix:** Correct the currency code from "INS" to "ILS"
- **Impact:** Incorrect currency display

---

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

## Quick Reference

| # | Severity | Bug Summary | Fix Effort |
|---|----------|-------------|------------|
| 1 | Critical | Confirm appointment 400 — field name mismatch | 1 line |
| 2 | Critical | Cancel appointment 400 — field name mismatch | 1 line |
| 3 | Critical | Direct URL navigation loses session | Medium |
| 4 | High | Language toggle causes session loss | Medium |
| 5 | High | Calendar view dropdown doesn't open | Small |
| 6 | High | Analytics shows 0 data | Medium |
| 7 | High | No-show/Done bypass server API | Medium |
| 8 | High | Tablet layout truncation | Small |
| 9 | Medium | Wrong label under No-Show Rate | 1 line |
| 10 | Medium | Address shows "-" on booking page | Small |
| 11 | Medium | DialogContent missing DialogTitle | Small |
| 12 | Medium | Copy link — no feedback | Small |
| 13 | Medium | Currency field empty | Small |
| 14 | Medium | Marketplace 404 | Medium |
| 15 | Medium | Accessibility mode no-op | Medium |
| 16 | Low | No "All time" analytics filter | Small |
| 17 | Low | Console.log in production | Small |
| 18 | Low | LCP image missing eager | 1 line |
| 19 | Low | Duplicate service names | Data issue |
| 20 | **Critical** | **No auth middleware on API endpoints** | **Medium** |
| 21 | High | Past time slots bookable for today | Small |
| 22 | Medium | Browser back exits booking wizard | Medium |
| 23 | Medium | Landing page 404 — wrong filename | 1 line (rename) |
| 24 | Medium | Misleading empty state on search | Small |
| 25 | Low | "1 hours" grammar error | 1 line |
| 26 | Low | Currency shows "INS" not "ILS" | 1 line |
| 27 | Low | Duplicate working hours header | Small |
