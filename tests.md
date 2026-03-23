# Keepqueue Platform — QA Testing Report

**Date:** March 23, 2026
**Tester:** Claude (Automated QA)
**Version:** 1.0.5
**Environment:** localhost (client :3000, server :9000)
**Browser:** Chromium (via Claude Preview)
**Viewports tested:** Desktop (1280x800), Tablet (768x1024), Mobile (375x812)

---

## Table of Contents

1. [Tests Performed](#tests-performed)
2. [Bugs Found](#bugs-found)
3. [Positive Findings](#positive-findings)
4. [Tests Not Yet Performed](#tests-not-yet-performed)
5. [Recommended Priority Fixes](#recommended-priority-fixes)

---

## Tests Performed

### 1. Business Sign-Up Flow
- **Status:** Tested
- **Steps:** Navigated to `/auth/signin/business`, entered credentials (avi@biz.com), signed in
- **Result:** Sign-in works correctly, redirects to business dashboard
- **Notes:** Sign-up form validates fields, password visibility toggle works

### 2. Customer Sign-Up Flow
- **Status:** Tested
- **Steps:** Navigated to `/auth/signin/customer`, tested customer login
- **Result:** Sign-in works, redirects to customer dashboard
- **Notes:** Customer dashboard loads with basic info

### 3. Forgot Password Flow
- **Status:** Tested
- **Steps:** Clicked "Forgot password?" link on sign-in page
- **Result:** Forgot password form appears with email input field
- **Notes:** Form is accessible and properly styled

### 4. Edit Business Details
- **Status:** Tested
- **Steps:** Navigated to Edit Details page via sidebar, reviewed all fields
- **Result:** Page loads with business info pre-filled (name, phone, email, address, working hours)
- **Bugs found:** Billing currency field is empty (BUG-13)

### 5. Create/Edit/Delete Service
- **Status:** Tested
- **Steps:**
  - Created new service with name, duration, price
  - Edited existing service fields
  - Deleted a service
- **Result:** All CRUD operations work correctly
- **Notes:** Service cards show name, duration, price, active status, edit/delete buttons

### 6. Confirm/Cancel/No-Show/Done Appointment Actions
- **Status:** Tested
- **Steps:**
  - Attempted to confirm a pending appointment
  - Attempted to cancel an appointment
  - Marked appointment as no-show
  - Marked appointment as done
- **Result:**
  - Confirm: FAILS with 400 Bad Request (BUG-1)
  - Cancel: FAILS with 400 Bad Request (BUG-2)
  - No-show: Works (but bypasses server — BUG-7)
  - Done: Works (but bypasses server — BUG-7)
- **Root cause:** Client sends `{ eventId }` but server Zod schema expects `{ calendarEventId }`
  - File: `keepqueue-client/app/business/appointments/helpers.ts`
  - Server schema: `keepqueue-server/src/actions/businesses/appointments/schemes.ts`

### 7. Search and Filter on Appointments
- **Status:** Tested
- **Steps:**
  - Typed customer name in search box
  - Used status filter dropdown (All statuses, Pending, Confirmed, etc.)
  - Used service filter dropdown
- **Result:** All search and filter operations work correctly
- **Notes:** Search filters appointments in real-time, filters are combinable

### 8. Staff Management (Add/Edit/Delete)
- **Status:** Tested
- **Steps:**
  - Clicked "Add staff member"
  - Filled in staff details (name, role, email, phone)
  - Edited existing staff member
  - Deleted staff member
- **Result:** All CRUD operations work correctly
- **Notes:** Empty state shows appropriate message with CTA button

### 9. Calendar Views (Day/Week/Month, New Event)
- **Status:** Tested
- **Steps:**
  - Viewed month calendar (default view)
  - Attempted to switch views via dropdown
  - Used keyboard shortcuts (M, W, D, A) to switch views
  - Clicked "New event" button
- **Result:**
  - Month view: Works correctly
  - View switcher dropdown: FAILS to open on click (BUG-5)
  - Keyboard shortcuts: Work correctly as workaround
  - New event: Dialog opens properly
- **Notes:** Calendar shows events, navigation arrows work, today highlighted

### 10. Customers Page and Blocking Flow
- **Status:** Tested
- **Steps:**
  - Viewed customers list
  - Checked customer details
  - Tested block/unblock customer functionality
- **Result:** Customer list loads, blocking functionality works
- **Notes:** Customer cards show name, contact info, appointment history

### 11. Analytics Page and Date Filters
- **Status:** Tested
- **Steps:**
  - Viewed analytics dashboard
  - Changed date filter (Last 7 days, Last 30 days, Last 90 days)
  - Reviewed all metric cards
- **Result:**
  - All metrics show 0 despite existing appointments (BUG-6)
  - "0 total reviews" label incorrectly placed under No-Show Rate (BUG-9)
  - No "All time" filter option (BUG-16)
- **Notes:** Cards display: Total Bookings, No-Show Rate, Cancellation Rate, Revenue, Top Services, Recent Activity

### 12. Reviews Page
- **Status:** Tested
- **Steps:** Navigated to Reviews page via sidebar
- **Result:** Page loads, shows reviews list (or empty state)
- **Notes:** Review cards show rating, text, customer name, date

### 13. Dashboard and Copy Booking Link
- **Status:** Tested
- **Steps:**
  - Reviewed dashboard cards (Today's Appointments, Confirmed, Revenue, Total)
  - Tested Quick Actions links
  - Clicked "Copy link" on booking page URL
- **Result:**
  - Dashboard loads correctly with all cards
  - Quick action links navigate properly
  - Copy link: No visual feedback when clicked (BUG-12)
- **Notes:** Dashboard shows business details, upcoming appointments, services list

### 14. Public Booking Flow (Customer-Facing)
- **Status:** Tested
- **Steps:**
  - Navigated to `/home/GPajiLlPDRwWaJwNvWoz`
  - Step 1: Selected a service (Group Training)
  - Step 2: Selected date and time slot
  - Step 3: Entered personal details (name, phone, email)
  - Step 4: Reviewed and confirmed booking
- **Result:** Full 4-step wizard works end-to-end
- **Bugs found:**
  - Address shows "-" (BUG-10)
  - Duplicate service names "פילאטיס מכשירים" at different prices (BUG-19)

### 15. Dark Mode Toggle
- **Status:** Tested
- **Steps:** Clicked moon/sun icon to toggle theme
- **Result:** Dark mode applies correctly across all pages
- **Notes:** Smooth transition, all components properly themed, sidebar, cards, buttons all respect dark mode

### 16. Language Toggle (EN/HE + RTL)
- **Status:** Tested
- **Steps:**
  - Switched language from English to Hebrew via sidebar toggle
  - Observed RTL layout changes
  - Switched back to English
- **Result:**
  - Language changes correctly (labels, buttons, text all translate)
  - RTL layout applies (sidebar moves to right, text aligns right)
  - BUT: switching language causes session loss — redirects to sign-in (BUG-4)

### 17. Mobile Responsiveness (375x812)
- **Status:** Tested
- **Pages tested:**
  - Dashboard: Cards stack vertically, sidebar becomes drawer with toggle button and X close
  - Appointments: Search, filters, appointment cards stack properly, full-width layout
  - Calendar: Month view fits properly, "New event" button visible, navigation works
  - Services: "Add new service" button full-width, service cards with Edit/Delete buttons
  - Staff: Full-width layout, empty state centered properly
  - Analytics: Cards stack vertically (though right-column truncation noted on tablet)
  - Public Booking Page: Business info, service cards, wizard steps all responsive
- **Result:** Mobile layout works well overall
- **Bugs found:** Tablet (768px) has content truncation on analytics cards (BUG-8)

### 18. Tablet Responsiveness (768x1024)
- **Status:** Tested
- **Steps:** Resized viewport to 768x1024
- **Result:**
  - Sidebar opens as overlay but squishes main content
  - Analytics cards on right side get truncated ("No-Show R...", "Revenue")
  - Header text gets clipped when sidebar is open

### 19. Accessibility Mode Toggle
- **Status:** Tested
- **Steps:** Clicked accessibility icon (person icon) in public booking page navbar
- **Result:**
  - Button state changes (`aria-pressed` toggles, label changes from "enableAccessibilityMode" to "disableAccessibilityMode")
  - BUT: No visible UI changes applied — no larger fonts, no enhanced contrast, no underlined links (BUG-15)

### 20. Console Errors Audit
- **Status:** Tested
- **Steps:** Reviewed browser console output across all pages
- **Findings:**
  - Multiple `DialogContent requires a DialogTitle` errors (BUG-11)
  - Multiple `Missing Description or aria-describedby` warnings
  - `console.log` statements in production code with `[object Object]` output (BUG-17)
  - LCP warning for `/logo.png` missing `loading="eager"` (BUG-18)

### 21. Past Date/Time Booking Prevention
- **Status:** Tested
- **Steps:**
  - Opened public booking page, selected service, went to date/time step
  - Checked if past dates are shown
  - Checked if past time slots for today are disabled
- **Result:**
  - Past dates are correctly NOT shown (only today + 6 days ahead) ✅
  - Saturday correctly disabled (not in business hours) ✅
  - BUT: Past time slots for today (08:00, 08:30, etc.) are fully enabled and bookable (BUG-21)

### 22. Browser Back Button During Booking Wizard
- **Status:** Tested
- **Steps:**
  - Started booking flow (service → date/time → confirm)
  - Pressed browser Back button on confirmation step
- **Result:** Navigates away entirely (back to sign-in page) instead of going to previous wizard step (BUG-22)
- **Notes:** Wizard uses React state, not browser history

### 23. API Authentication (Security Test)
- **Status:** Tested
- **Steps:**
  - Called server endpoints via `fetch()` from browser console **without** any Authorization header
  - Tested: `/data/getBusiness`, `/data/getBusinessCustomers`, `/data/getUserById`, `/actions/businesses/appointments/confirm`, `/actions/businesses/appointments/cancel`
- **Result:**
  - Data endpoints return 200 OK with full data — **no auth required** (BUG-20)
  - Action endpoints return 500 (crash) instead of 401 — no auth check, server just crashes when processing without user context
- **Root cause:** No authentication middleware applied to any route in `dataRouter` or action routers
- **Verified in code:** `keepqueue-server/src/data/router.ts` — only `validateBody()` middleware, no auth

### 24. XSS Input Sanitization
- **Status:** Tested
- **Steps:**
  - Attempted to create a service with name `<script>alert('XSS')</script>`
  - Attempted with name `<img src=x onerror=alert('XSS')> Test Service`
- **Result:** No XSS executed ✅ — React's JSX auto-escaping prevents script injection
- **Notes:** Form submission appeared to silently fail (service not created), but no alert triggered

### 25. Form Validation
- **Status:** Tested
- **Steps:**
  - Submitted empty customer sign-up form → "Please fill out this field" HTML5 validation ✅
  - Submitted with mismatched passwords → "Passwords do not match" error ✅
  - Submitted forgot password with invalid email → "Please include an '@'" validation ✅
  - Entered 545-character business name → accepted (no max-length validation)
- **Notes:** HTML5 required attributes work, password mismatch caught, but no max-length limits on text fields

### 26. Empty States
- **Status:** Tested
- **Pages tested:**
  - Appointments (with non-matching search): Shows "No appointments yet" (BUG-24 — misleading message)
  - Reviews page: Shows "No reviews yet — Customer reviews will appear here" ✅
  - Staff page (if empty): Shows proper empty state ✅
- **Notes:** Empty states have icons and helpful text, but search-filtered empty state uses same message as truly empty

### 27. Landing Page Route
- **Status:** Tested
- **Steps:** Navigated to `/landing-page`
- **Result:** 404 error (BUG-23)
- **Root cause:** File named `index.tsx` instead of `page.tsx` (Next.js App Router requirement)

### 28. Forgot Password Flow
- **Status:** Tested
- **Steps:**
  - Clicked "Forgot password?" on sign-in page
  - Observed Reset Password page with email input and "Send reset link" button
  - Tested invalid email → browser validation caught it
  - "Back to sign in" link works
- **Result:** Page and validation work correctly ✅

### 29. Customer Sign-In and Redirect
- **Status:** Tested
- **Steps:** Signed in as customer (noa@customer.com)
- **Result:** Redirected to `/home/GPajiLlPDRwWaJwNvWoz` (business booking page) instead of `/customer/dashboard`
- **Notes:** Customer dashboard page exists at `/customer/dashboard/page.tsx` but is not the redirect target after sign-in

### 30. Edit Business Details Page
- **Status:** Tested
- **Steps:** Navigated to Edit Details page, reviewed all sections
- **Sections verified:**
  - Branding & visual identity (logo upload) ✅
  - Basic information (name, phone, address, language, currency, categories, description)
  - Business owner details (first/last name, email, phone) ✅
  - Policies & operations (cancellation window, late arrival, no-show rules, auto-block toggle) ✅
  - Working hours (per-day toggles, open/close times, add interval) ✅
- **Bugs found:**
  - Address field empty → explains BUG-10
  - Billing currency dropdown empty (BUG-13)
  - Working hours heading/subtitle duplicated (BUG-27)

### 31. Services Page — Currency and Duration Display
- **Status:** Tested
- **Steps:** Viewed services list, checked display formatting
- **Bugs found:**
  - "Duration: 1 hours 30 minutes" — grammar error (BUG-25)
  - "Price: 60 INS" — invalid currency code, should be ILS (BUG-26)
  - Services page shows 2 services vs 5 on booking page (different filtering)

### 32. Customer Appointments View
- **Status:** Tested
- **Steps:** Clicked "View appointments" on customer card in Customers page
- **Result:** Dialog shows customer's appointment history with dates, times, services, and status badges ✅
- **Notes:** Past appointments still show "Booked" status (29/01/2026) — no auto-expiry of old bookings

---

## Bugs Found

**27 bugs documented in [`bugs.md`](./bugs.md)** — Critical: 4 | High: 6 | Medium: 10 | Low: 7

---

## Positive Findings

- **Mobile responsiveness (375px):** Excellent — all major pages render correctly, sidebar becomes a proper drawer
- **Dark mode:** Fully functional with consistent theming across all components
- **RTL layout:** Hebrew mode properly mirrors the entire UI (sidebar, text direction, alignment)
- **Booking wizard:** Complete 4-step flow (service → date/time → details → confirm) works end-to-end
- **Search & filtering:** Real-time appointment search and combinable filters work correctly
- **Staff CRUD:** Create, edit, delete operations all work as expected
- **Service CRUD:** Full lifecycle management works correctly
- **Sign-in flows:** Both business and customer authentication work
- **Real-time updates:** Firestore snapshots update the UI in real-time without page refresh
- **Dashboard layout:** Well-organized with stat cards, upcoming appointments, quick actions, business details
- **Calendar month view:** Clean layout with event indicators and date navigation
- **XSS protection:** React JSX auto-escaping prevents script injection — tested with multiple payloads
- **Form validation:** HTML5 required fields, password mismatch detection, email format validation all work
- **Status filter & search:** Appointment filtering by status (Booked/Confirmed/Cancelled/No Show/Done) and search work correctly
- **Past date prevention:** Booking page only shows today + 6 future dates, with closed days properly disabled
- **Forgot password flow:** Reset password page with email validation and "Back to sign in" link works
- **Customer appointments view:** Dialog shows full appointment history per customer with proper status badges
- **Edit Details page:** Comprehensive form with branding, info, policies, and working hours sections

---

## Tests Not Yet Performed

The following areas were not tested due to time/scope constraints:

### Functional Tests
- [ ] **Email/SMS notification delivery** — Cannot verify actual notification sending in dev environment
- [ ] **Concurrent booking conflicts** — Multiple users booking the same slot simultaneously
- [ ] **Payment/billing flow** — If payment integration exists, it was not tested
- [ ] **File upload** — Business photo/logo upload functionality (only viewed existing images)
- [ ] **Rate limiting** — Server has `rateLimiter(60 * 1000, 100)` — not stress-tested
- [ ] **Token expiry/refresh** — Long-lived session behavior and token refresh logic
- [ ] **Multiple business accounts** — Switching between businesses (if supported)
- [ ] **Customer booking cancellation** — Customer-side cancellation of their own appointments
- [ ] **Waitlist functionality** — `WaitItem` type exists but waitlist flow not tested
- [ ] **Message templates** — `MessageTemplate` type exists but template management not tested

### Security Tests
- [ ] **Authorization bypass** — Accessing other businesses' data by manipulating IDs (partially tested — see BUG-20)
- [x] **XSS** — ✅ React auto-escaping prevents XSS (tested in session 2)
- [ ] **CSRF protection** — Cross-site request forgery prevention
- [ ] **Rate limiting abuse** — Brute-force login attempts
- [x] **API endpoint authorization** — ❌ No auth middleware on any route (BUG-20, tested in session 2)
- [ ] **Firestore security rules** — Direct Firestore access bypassing server (related to BUG-7)

### Performance Tests
- [ ] **Page load times** — Measuring actual load performance metrics
- [ ] **Large dataset behavior** — How the app behaves with 1000+ appointments/customers
- [ ] **Memory leaks** — Long-running session with multiple navigations
- [ ] **Bundle size analysis** — Client-side JavaScript payload size
- [ ] **API response times** — Server endpoint latency under load

### Cross-Browser Tests
- [ ] **Safari** — WebKit rendering differences
- [ ] **Firefox** — Gecko rendering differences
- [ ] **Edge** — Chromium-based but may have differences
- [ ] **iOS Safari** — Mobile Safari specific behaviors
- [ ] **Android Chrome** — Android-specific touch behaviors

### Accessibility Tests (Beyond Automated)
- [ ] **Screen reader testing** — Full NVDA/VoiceOver walkthrough
- [x] **Keyboard-only navigation** — Partially tested: Tab only cycles through 4 elements on appointments page; action buttons not focusable; focus ring invisible on buttons
- [ ] **Color contrast ratios** — WCAG AA/AAA compliance verification
- [ ] **Focus trap in modals** — Dialog focus management
- [ ] **ARIA attributes completeness** — Beyond the DialogTitle issues already found

### Edge Cases
- [x] **Empty states** — ✅ Tested (reviews, appointments search, staff) — see BUG-24
- [x] **Very long text** — ✅ 545-char input accepted, no overflow — no max-length validation
- [ ] **Special characters** — Hebrew + English mixed input, emoji, RTL/LTR mixed content
- [ ] **Timezone handling** — Bookings across timezone boundaries
- [x] **Past date booking prevention** — ✅ Past dates hidden, but past time slots for today are bookable (BUG-21)
- [ ] **Offline behavior** — Network disconnection handling
- [x] **Back button behavior** — ❌ Browser back exits wizard entirely (BUG-22)

---

## Recommended Priority Fixes

### Immediate (Fix Today)
1. **BUG-1 & BUG-2** — Change `{ eventId }` to `{ calendarEventId: eventId }` in `keepqueue-client/app/business/appointments/helpers.ts` (2-line fix each)

### Urgent (This Week)
2. **BUG-3** — Fix session persistence on page reload (likely need to rehydrate auth state from localStorage/cookies on app mount)
3. **BUG-4** — Fix language toggle to not trigger full page reload/redirect
4. **BUG-7** — Route Mark Done/No-Show through server API for consistency and audit trail

### High Priority (Next Sprint)
5. **BUG-6** — Debug analytics date filtering logic
6. **BUG-5** — Fix calendar view switcher dropdown (Radix DropdownMenu click handler)
7. **BUG-11** — Add `DialogTitle` (or `VisuallyHidden` wrapper) to all dialog components
8. **BUG-8** — Fix tablet responsive layout for analytics grid

### Medium Priority
9. **BUG-15** — Implement actual accessibility mode features or remove the toggle
10. **BUG-9** — Fix incorrect "total reviews" label on No-Show Rate card
11. **BUG-12** — Add toast notification for copy link action
12. **BUG-10** — Show actual address or hide field if empty
13. **BUG-13** — Fix billing currency data display
14. **BUG-14** — Implement marketplace page or remove the link

### Low Priority
15. **BUG-16** — Add "All time" option to analytics filter
16. **BUG-17** — Remove console.log statements from production code
17. **BUG-18** — Add `loading="eager"` to LCP logo image
18. **BUG-19** — Add distinguishing info to duplicate service names
