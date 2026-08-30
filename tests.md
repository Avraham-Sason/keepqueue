# Keepqueue Platform — QA Testing Report

**Date:** March 23–27, 2026 (8 sessions)
**Tester:** Claude (Automated QA)
**Version:** 1.0.5
**Environment:** localhost (client :3000, server :9000)
**Browser:** Chromium (via Claude Preview)
**Viewports tested:** Desktop (1280x800), Tablet (768x1024), Mobile (375x812)
**Total tests:** 68 | **Total bugs:** 93 (see [bugs.md](./bugs.md))
**Fix status:** 3 fixed 2026-08-30 (BUG-1, BUG-2, BUG-29) | 90 open

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
- **Fix status:** Fixed 2026-08-30 — `helpers.ts:5` and `helpers.ts:9` now send `{ calendarEventId: eventId }` (BUG-1, BUG-2). Verified with `npx tsc --noEmit`, no new type errors. Not re-tested at runtime. BUG-7 (no-show/done bypass server API) still open.

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

### 33. Customers Page — View Appointments & Block Customer (Session 3)
- **Status:** Tested
- **Steps:**
  - Navigated to Customers page via sidebar
  - Reviewed customer card (Noa Levi — Active, name, email, phone, 4 appointments)
  - Clicked "View appointments" → modal shows all 4 appointments with status and dates
  - Clicked "Block" → confirmation dialog appears with proper warning message
  - Cancelled the block action
- **Result:** Both features work correctly ✅
- **Bugs found:** No search/filter on customers page (minor gap); past appointments still show "Booked" (BUG-33)
- **Notes:** Block confirmation dialog has proper UX with cancel/confirm buttons

### 34. Reviews Page (Session 3)
- **Status:** Tested
- **Steps:** Navigated to Reviews & Ratings page
- **Result:** Page loads correctly with "No reviews yet — Customer reviews will appear here" empty state ✅
- **Notes:** Clean empty state with icon, no errors

### 35. Staff Management — Add Staff Dialog (Session 3)
- **Status:** Tested
- **Steps:**
  - Navigated to Staff Management page
  - Clicked "Add staff member"
  - Verified dialog fields: First name, Last name, Email, Phone, Role dropdown (Employee/Manager/Owner), Color tag, Notes
  - Tested mixed Hebrew/English/emoji input: "אברהם Test 🏋️" — accepted correctly ✅
  - Tested XSS payload in last name: `O'Brien <script>alert(1)</script>` — accepted without execution ✅
- **Result:** Form renders correctly, inputs accept mixed character sets ✅
- **Notes:** Empty state shows dual CTA (header button + body button)

### 36. Focus Trap in Modal Dialogs (Session 3)
- **Status:** Tested
- **Steps:**
  - Opened "Add staff member" dialog
  - Counted focusable elements inside dialog: 11 (inputs, buttons, selects, textarea)
  - Focused last element and pressed Tab
  - Verified focus stayed inside dialog
- **Result:** Focus trap works correctly ✅ — Radix Dialog handles focus management properly
- **Notes:** Focus cycles through all 11 elements and wraps back to the first

### 37. Dark/Light Mode Toggle and Cross-Page Theme (Session 3)
- **Status:** Tested
- **Steps:**
  - Started in dark mode, toggled to light mode via sidebar button
  - Verified Staff page in light mode — clean, good contrast ✅
  - Verified Dashboard in light mode — cards readable, avatar visible ✅
  - Verified Appointments page in light mode — filters, cards, badges all properly themed ✅
- **Result:** Theme toggle works, both modes render correctly across pages ✅
- **Bugs found:**
  - Theme toggle button has no `aria-label` (BUG-32)
  - Sidebar highlights "Dashboard" even when on Appointments page (BUG-31)

### 38. Mobile Responsive Layout — 375px (Session 3)
- **Status:** Tested
- **Pages tested at 375px:**
  - **Appointments:** Filters stack vertically ✅, but action buttons overflow — "Mark no-show" and "Mark done" truncated (BUG-28)
  - **Dashboard:** Cards stack vertically ✅, services as badges ✅, Quick Actions stacked ✅
  - **Public booking page:** Business info card ✅, service selection cards stack ✅, step indicator visible ✅
  - **Booking step 2 (date/time):** Date buttons in 2-column grid ✅, time slots in 2-column grid ✅
- **Result:** Good overall mobile layout, but appointment action buttons are inaccessible on mobile (BUG-28)
- **Notes:** BUG-21 (past time slots bookable) confirmed on mobile too

### 39. Customer Sign-In and Dashboard Access (Session 3)
- **Status:** Tested
- **Steps:**
  - Signed in as customer (noa@customer.com) via `/auth/signin/customer`
  - Observed redirect destination
  - Searched for "My Appointments" or "Dashboard" link in navbar
  - Attempted to navigate to `/customer/dashboard` directly
- **Result:**
  - Customer sign-in redirects to public booking page `/home/GPajiLlPDRwWaJwNvWoz` — NOT to customer dashboard
  - No link to customer dashboard exists in the booking page navbar (BUG-30)
  - Direct URL navigation to `/customer/dashboard` loses session (BUG-3 again)
- **Notes:** Customer dashboard code exists and has cancel functionality, but is effectively unreachable

### 40. Customer Cancel Appointment — Code Review (Session 3)
- **Status:** Tested (code review)
- **Steps:** Read `keepqueue-client/app/customer/dashboard/page.tsx` line 86
- **Result:** `handleCancel()` sends `{ eventId }` — same field name mismatch as BUG-1/BUG-2 (BUG-29)
- **Fix status:** Fixed 2026-08-30 — `page.tsx:86` now sends `{ calendarEventId: eventId }` (BUG-29). Verified with `npx tsc --noEmit`, no new type errors. Not re-tested at runtime.
- **Notes:** Even if customer could reach the dashboard, cancellation would fail with 400 error — BUG-30 (dashboard unreachable) is still open, so this path stays untestable via the UI.

### 41. API Error Logging Quality (Session 3)
- **Status:** Tested
- **Steps:** Reviewed console errors during normal navigation
- **Result:** Repeated `Error calling API: getBusiness` errors with both `CanceledError` and `[object Object]` (BUG-34)
- **Notes:** `[object Object]` indicates error objects being concatenated as strings instead of properly serialized — masks actual error details

### 42. Server-Side Code Review — Auth Middleware (Session 4)
- **Status:** Tested (code review)
- **Steps:** Read all server router files and middleware implementations
- **Result:**
  - `authGuard` middleware exists at `middlewares/authGuard.ts` — fully functional with Firebase token verification and role-based checks (business/customer/staff)
  - **NOT applied to ANY router** — confirmed across all 9 routers (BUG-41)
  - All routes only use `validateBody()` for Zod schema validation
- **Impact:** Confirms and deepens BUG-20 finding — auth was designed but never wired up

### 43. Server-Side Code Review — setCustomClaims Privilege Escalation (Session 4)
- **Status:** Tested (code review)
- **Steps:** Read `keepqueue-server/src/actions/services.ts` lines 52-66
- **Result:** `POST /actions/setCustomClaims` accepts `{ userId, claims }` and calls `auth.setCustomUserClaims(userId, claims)` with **no authentication, no authorization, no input validation** beyond checking that both fields exist (BUG-35)
- **Impact:** Any user can escalate privileges for any Firebase user — critical security vulnerability

### 44. Server-Side Code Review — CORS Configuration (Session 4)
- **Status:** Tested (code review)
- **Steps:** Read `keepqueue-server/src/helpers/index.ts` line 38
- **Result:** `app.use(cors())` — no origin restrictions configured (BUG-36)
- **Impact:** Combined with BUG-20, any website can access all API endpoints

### 45. Client-Side Firestore Direct Write Audit (Session 4)
- **Status:** Tested (code review)
- **Steps:** Searched all client code for `setDocument`, `addDocument`, `deleteDocument` calls
- **Result:** Found **9 files** across **7 Firestore collections** that write directly, bypassing the server API (BUG-37)
- **Collections affected:** calendar, services, staff, users, reviews, waitlist, businesses
- **Impact:** Server cache goes stale, no audit trail, no server-side validation on most write operations

### 46. Session Persistence Root Cause Analysis (Session 4)
- **Status:** Tested (code review)
- **Steps:**
  - Read `lib/store/authStore.ts` — Zustand persist middleware stores auth to localStorage
  - Searched for `onAuthStateChanged` — **zero results** in entire codebase
  - Read `lib/firebase/connect.ts` — only initializes Firebase Auth object, no listeners
  - Read `components/config/Language.tsx` — language toggle calls `window.location.reload()`
- **Result:** Root cause of BUG-3 and BUG-4 identified (BUG-39):
  - No `onAuthStateChanged()` listener to sync Firebase auth with Zustand
  - Zustand rehydrates asynchronously on page load → race condition
  - Components render with `user === null` before rehydration completes
  - Language toggle triggers full page reload → same race condition

### 47. Analytics Data Query Root Cause Analysis (Session 4)
- **Status:** Tested (code review)
- **Steps:**
  - Read server `data/services.ts` — `S_getBusinessAnalytics` filters by `e.created.toMillis() >= periodStart`
  - Read client `analytics/hooks.tsx` — filters by `e.start.seconds * 1000 >= cutoff`
- **Result:** Root cause of BUG-6 identified (BUG-40) — server filters by creation date, client filters by appointment start date. This mismatch causes analytics to return 0 when appointments exist.

### 48. Calendar "New Event" Form Validation (Session 4)
- **Status:** Tested
- **Steps:**
  - Clicked "New event" on Calendar page
  - Observed form: Title, Type (Vacation/Holiday/Other), Start date, End date
  - Left title empty and clicked "Add"
- **Result:** No validation error — empty title accepted (BUG-38)
- **Notes:** Create event dialog does have a proper `DialogTitle` (unlike most other dialogs)

### 49. Edit Details Form Review (Session 4)
- **Status:** Tested
- **Steps:** Navigated to Edit Details, inspected all form fields
- **Result:** All fields populated correctly (name, phone, owner info, working hours, policies)
- **Findings:**
  - Address field is empty — confirms root cause of BUG-10
  - Billing currency shows "ILS" (previously reported empty in BUG-13 — may have been updated)
  - "Save changes" button present
  - Working hours section has per-day toggles with open/close times ✅

### 50. Business Sign-Up Form Validation (Session 4)
- **Status:** Tested
- **Steps:**
  - Navigated to business sign-up page
  - Verified form fields: First name, Last name, Email, Phone, Password, Confirm password
  - Submitted with empty fields → HTML5 "Please fill out this field" validation ✅
  - Submitted with mismatched passwords → "Passwords do not match" error ✅
- **Result:** Sign-up form validation works correctly ✅

---

### 51. Bundle Size Analysis (Session 5)
- **Status:** Tested (code review)
- **Steps:** Analyzed package.json dependencies, import patterns, dynamic imports, tree-shaking
- **Result:**
  - Duplicate date libraries: moment + moment-timezone + date-fns (BUG-54)
  - 3 animation libraries: framer-motion (23 uses), `motion` (0 uses — BUG-55), gsap (1 use)
  - No `dynamic()` or `lazy()` imports anywhere — all heavy components eagerly loaded (BUG-56)
  - Duplicate icon libraries: lucide-react (38 files) + @remixicon/react (3 files) (BUG-57)
  - Firebase imports properly tree-shakeable (good)
  - 74 custom Tailwind keyframes, many potentially unused
- **Estimated bundle reduction potential:** 115-180KB

### 52. Timezone Handling Review (Session 5)
- **Status:** Tested (code review)
- **Steps:** Traced date creation, storage, display, and conversion across client and server
- **Result:**
  - Dates stored as UTC Firestore Timestamps (good)
  - Business timezone accessed via `(business as any)?.timeZone` — not in type schema (BUG-44)
  - Hardcoded "Asia/Jerusalem" fallback in server helpers and logger
  - Server availability computation is timezone-aware with DST handling (good)
  - Client booking flow converts to UTC correctly via `moment.utc().valueOf()` (good)
  - Off-by-one day risk for cross-timezone users (BUG-51)
  - `withinSchedule()` uses `moment.utc()` which may misvalidate against non-UTC schedules

### 53. Concurrent Booking & Overlap Detection Review (Session 5)
- **Status:** Tested (code review)
- **Steps:** Analyzed `hasCalendarOverlapInCache`, `SCreateAppointment`, `SRescheduleAppointment`, cache sync architecture
- **Result:**
  - Overlap detection math is correct — edge cases (same time, back-to-back, partial overlap) all handled properly
  - Cancelled/Done/No-Show correctly excluded from overlap checks
  - **Critical:** Overlap check reads from in-memory cache, NOT within Firestore transaction (BUG-43)
  - No locking mechanism, no database constraints
  - Async cache sync creates race condition window for double-bookings
  - Reschedule self-overlap bug — appointment detects itself as conflict (BUG-45)
  - No validation that start < end in Zod schema (BUG-52)
  - No validation that start is in the future

### 54. Message Templates & Notification System Review (Session 5)
- **Status:** Tested (code review)
- **Steps:** Traced MessageTemplate and NotificationLog types through entire codebase
- **Result:**
  - Type definitions complete in both client and server
  - Firestore collections registered (message_templates, notification_logs)
  - Cache layer configured and operational
  - Data API returns business templates via S_getBusiness
  - User notification preferences modeled (UserBase.contacts)
  - **Zero implementation:** No sending logic, no template editor UI, no variable substitution, no scheduled reminders (BUG-53)
  - TODO-SERVER.text describes expected scope (Twilio, SendGrid, reminder scheduler)

### 55. Firestore Security Rules Review (Session 5)
- **Status:** Tested (code review)
- **Steps:** Searched for firestore.rules, firebase.json, firestore.indexes.json; audited all client-side direct writes
- **Result:**
  - **No firestore.rules file exists** — database completely unprotected (BUG-42)
  - No firebase.json configuration file
  - 12 client files perform direct writes to 7 collections with zero authorization checks
  - No ownership verification before writes (any user can modify any document by ID)
  - Client can write false audit records
  - No schema validation on client-side writes (Zod not used)
  - Deepens BUG-37 finding with additional detail

### 56. File Upload & Image Handling Review (Session 5)
- **Status:** Tested (code review)
- **Steps:** Traced logo upload flow from UI through FileReader to Firestore storage
- **Result:**
  - Logo upload converts to base64 via FileReader.readAsDataURL() — stored inline in Firestore (BUG-47)
  - No file size validation — can exceed Firestore 1MB document limit (BUG-46)
  - No server-side MIME validation — `logoUrl: string().optional()` accepts any string
  - Browser-side `accept="image/png,image/jpeg,image/webp"` easily bypassed
  - Firebase Storage utility exists (`uploadFileToStorage()`) but never used for logos
  - `<Image>` component uses `unoptimized` prop — no Next.js optimization
  - photoURL field on User and StaffMember types — same pattern potential

### 57. Token Expiry & Refresh Review (Session 5)
- **Status:** Tested (code review)
- **Steps:** Traced token lifecycle from creation through API calls to server verification
- **Result:**
  - Token retrieved on every API call via `auth.currentUser?.getIdToken()` (without forceRefresh)
  - No 401 response handling in API client (BUG-48)
  - No axios interceptor for token retry
  - No `onIdTokenChanged` listener for proactive refresh
  - No `onAuthStateChanged` listener (already BUG-39)
  - Server error handler returns 500 for all errors including auth failures — makes client-side 401 detection impossible
  - Auth state persisted to localStorage but never revalidated
  - No session timeout UI or auto-logout
  - React Query retries once but no token-aware retry strategy

### 58. Error Handling Patterns Review (Session 5)
- **Status:** Tested (code review)
- **Steps:** Audited error handling across all server route handlers, client API calls, Firestore operations, and UI feedback
- **Result:**
  - **Server:** Good — all Express handlers use try/catch + next(error); Zod validation returns 400 with details
  - **Client API:** Good — custom ApiError class, error message extraction
  - **Client Firestore:** Bad — all operations swallow errors, return fallback values (BUG-50)
  - **UI feedback:** Inconsistent — booking flow shows errors; service/staff operations fail silently
  - **No global error boundary** — unhandled errors crash entire app (BUG-49)
  - **No error tracking service** — no Sentry/LogRocket (BUG-58)
  - Intentional error suppression in booking hooks: `catch (_) { // ignore }`
  - `addAuditRecord()` uses `console.log()` instead of `console.error()` for errors
  - Server app.ts top-level catch only calls `process.exit(1)` with no logging

---

### 59. Rate Limiting & DoS Protection Review (Session 5)
- **Status:** Tested (code review)
- **Steps:** Analyzed rate limiter implementation, body size limits, security headers, login protection
- **Result:**
  - Custom rate limiter exists: 100 req/60s per IP, in-memory Map store, auto-cleanup every 5min (good)
  - Applied globally to all routes (no per-route overrides)
  - No helmet.js or security headers (BUG-59)
  - No login brute-force protection — no slowdown on failed auth (BUG-60)
  - express.json() uses default 100KB limit (not explicitly configured — BUG-65)
  - In-memory store not scalable to multi-instance (BUG-64)
  - No API key mechanism
  - No CSRF protection

### 60. Type Synchronization Client-Server Audit (Session 5)
- **Status:** Tested (code review)
- **Steps:** Compared global.ts and business.ts type files between client and server line by line
- **Result:**
  - Timestamp import differs (firebase-admin vs firebase) — expected, different SDKs
  - `Business.description` field exists in client but NOT in server (BUG-62)
  - Audit interface entity types mismatch: server has 7 entity types, client has 3 (BUG-61)
  - Audit interface action types mismatch: server has 6 action types, client has 3 (BUG-61)
  - Business.ts files are in sync (minor whitespace differences only)

### 61. Memory Leaks & React Patterns Review (Session 5)
- **Status:** Tested (code review)
- **Steps:** Searched for useEffect without cleanup, setInterval/setTimeout without clear, addEventListener without remove, missing dependencies
- **Result:**
  - 3 missing setTimeout cleanups in QuickActionsSection and BookingInterface (BUG-63)
  - Most event listeners properly cleaned up (EventsPopup, EventCalendar, Sidebar, useIsMobile — all good)
  - Firestore onSnapshot returns unsubscribe function properly
  - TextType.tsx and CountUp.tsx properly clean up timeouts (good)
  - useCurrentTimeIndicator properly cleans up interval (good)
  - GlobalConfig.tsx has missing dependency in useEffect (minor)
  - React Query configured with reasonable defaults (staleTime: 5s, retry: 1)

---

### 62. Zod Validation Completeness Audit (Session 5)
- **Status:** Tested (code review)
- **Steps:** Analyzed all 8 Zod schema files, compared against TypeScript interfaces, checked for injection vectors
- **Result:**
  - validateBody middleware properly uses safeParse() and returns 400 (good)
  - `getCollectionSchema` has `value: any()` and unconstrained `fieldName` — prototype pollution risk (BUG-66)
  - No cross-field validation anywhere: end > start, to >= from, endMin > startMin (BUG-67)
  - Inconsistent ID min length: some min(5), most min(1) (BUG-68)
  - Phone fields lack min length and regex (BUG-69)
  - logoUrl missing .url() validation unlike staff photoURL (BUG-70)
  - `/actions/login` and `/actions/setCustomClaims` have NO validateBody middleware
  - Enum validation is proper throughout (good)
  - Email/URL validation present in staff schemas (good)
  - Schema-interface alignment is good — all required fields covered
  - Notes fields consistently capped at 2000 chars (good)

---

### 63. API Authentication Audit — Full Endpoint Scan (Session 6)
- **Status:** Tested
- **Steps:** Sent unauthenticated requests (no Authorization header) to all 25 API endpoints via curl
- **Result:**
  - `/actions/login` (empty body) → 500 (BUG-86)
  - `/actions/setCustomClaims` → 200 with no auth (BUG-35)
  - All 17 `/actions/businesses/*` routes → 400 instead of 401 (BUG-20)
  - `/data/getBusinessCustomers` → 200, exposes PII (BUG-20)
  - `/data/getUserById` → 200, exposes PII (BUG-20)
  - `/data/getBusiness` (empty body) → 200 with error body (BUG-79)
  - `/data/getCollection` (valid) → 400 ✅
  - `/data/getAvailabilityByServiceId` (valid) → 200 ✅
  - 15x concurrent `/data/getBusiness` → all 200 ✅

### 64. English / i18n Mode Testing (Session 7)
- **Status:** Tested
- **Steps:** Set `language=en` cookie and tested landing page, sign-in, and booking pages
- **Result:**
  - Landing page first load: RTL with `lang="he"` (BUG-77)
  - After client hydration: LTR with `lang="en"` ✅
  - Sign-in page: Hebrew persists (BUG-76)
  - Testimonials and CTA: Hebrew (BUG-78)
  - Language toggle button: Works after click ✅

### 65. Landing Page Full Audit (Session 7)
- **Status:** Tested
- **Steps:** Tested all landing page sections, CTAs, nav links, footer, newsletter, and responsive layout
- **Result:**
  - Hero section: Renders correctly ✅
  - CTA buttons: Dead divs (BUG-72)
  - Footer links: All 9 return 404 (BUG-74)
  - Newsletter button: Non-functional (BUG-82)
  - #pricing nav link: No target section (BUG-83)
  - Testimonial images: Placeholders (BUG-81)
  - Copyright: Shows 2024 (BUG-87)
  - Mobile (375px): No hamburger menu (BUG-93)

### 66. Public Booking Page — Invalid Business IDs (Session 7)
- **Status:** Tested
- **Steps:** Navigated to `/home/invalid-id-xyz` and `/home/<script>alert(1)</script>`
- **Result:**
  - Invalid ID: Shows empty booking UI instead of 404 (BUG-75)
  - XSS attempt: Properly escaped ✅
  - Valid business: Firebase permission error (BUG-73), no services shown (BUG-80)

### 67. Client TypeScript Compilation (Session 8)
- **Status:** Tested
- **Steps:** Ran `cd keepqueue-client && npx tsc --noEmit`
- **Result:** 7 errors in 4 files (BUG-85)
- **Notes:** Server TypeScript compiles cleanly (0 errors) ✅

### 68. Custom 404 and Debug Pages (Session 8)
- **Status:** Tested
- **Steps:** Navigated to `/nonexistent`, `/business/fake`, `/test`
- **Result:**
  - Unknown routes: Default Next.js 404 page (BUG-84)
  - `/test`: Publicly accessible debug page (BUG-92)
  - Auth redirects: `/business/*` → sign-in ✅, `/customer/*` → sign-in ✅

---

## Bugs Found

**93 bugs documented in [`bugs.md`](./bugs.md)** — Critical: 10 | High: 16 | Medium: 39 | Low: 28 · 3 fixed 2026-08-30 (BUG-1, BUG-2, BUG-29)

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
- **Focus trap in dialogs:** Radix Dialog properly traps focus within modals — Tab cycles through all focusable elements
- **Mixed character input:** Hebrew, English, emoji, and special characters all accepted in form fields
- **Block customer flow:** Proper confirmation dialog with clear warning message before destructive action
- **Light/dark mode:** Both themes render consistently across all admin pages — no readability issues
- **Mobile booking flow:** Service selection, date picker, and time slots all work well at 375px width
- **Customer appointments dialog:** Shows full history per customer with proper status badges and dates
- **Sign-up form validation:** Required fields, password mismatch detection, and email format all properly validated
- **Calendar new event dialog:** Has proper DialogTitle (unlike most other dialogs) — good UX baseline
- **authGuard middleware quality:** The existing (but unused) auth middleware is well-designed — verifies tokens, checks roles, handles edge cases

---

## Tests Not Yet Performed

The following areas were not tested due to time/scope constraints:

### Functional Tests
- [ ] **Email/SMS notification delivery** — Cannot verify actual notification sending in dev environment
- [x] **Concurrent booking conflicts** — ❌ Race condition: overlap check reads cache, not Firestore transaction. Double-bookings possible (BUG-43). Reschedule self-overlap bug (BUG-45)
- [ ] **Payment/billing flow** — If payment integration exists, it was not tested
- [x] **File upload** — ❌ Logo stored as base64 in Firestore (BUG-47); no file size validation (BUG-46); Firebase Storage exists but unused
- [x] **Rate limiting** — ✅ Code reviewed: 100 req/60s per IP, no per-route limits, no login slowdown (BUG-59/60/64/65)
- [x] **Token expiry/refresh** — ❌ No 401 handling (BUG-48); no forceRefresh; no onIdTokenChanged listener; no session timeout UI
- [ ] **Multiple business accounts** — Switching between businesses (if supported)
- [x] **Customer booking cancellation** — ✅ Field name mismatch fixed 2026-08-30 (BUG-29); ❌ dashboard still unreachable (BUG-30)
- [x] **Waitlist functionality** — ✅ WaitlistForm component exists, writes directly to Firestore. Not exposed in main booking UI flow
- [x] **Message templates** — ✅ Full infrastructure exists (types, cache, data API, user prefs) but zero sending implementation (BUG-53)

### Security Tests
- [x] **Authorization bypass** — ❌ All endpoints unauthenticated (BUG-20); setCustomClaims allows privilege escalation (BUG-35)
- [x] **XSS** — ✅ React auto-escaping prevents XSS (tested in session 2)
- [x] **CSRF protection** — ❌ No CSRF middleware; `cors()` allows all origins (BUG-36)
- [ ] **Rate limiting abuse** — Brute-force login attempts (rate limiter exists: 100 req/min but not tested)
- [x] **API endpoint authorization** — ❌ No auth middleware on any route (BUG-20); authGuard exists but unused (BUG-41)
- [x] **Firestore security rules** — ❌ Client writes to 7 collections directly, bypassing server (BUG-37)

### Performance Tests
- [ ] **Page load times** — Measuring actual load performance metrics
- [ ] **Large dataset behavior** — How the app behaves with 1000+ appointments/customers
- [x] **Memory leaks** — ✅ Code reviewed: 3 missing setTimeout cleanups (BUG-63); most listeners properly cleaned up
- [x] **Bundle size analysis** — ❌ Duplicate date libs (~70KB), unused motion package, no code splitting, duplicate icon libs (BUG-54/55/56/57)
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
- [x] **Focus trap in modals** — ✅ Tested in Add Staff dialog — Radix handles focus trap correctly (11 focusable elements)
- [ ] **ARIA attributes completeness** — Beyond the DialogTitle issues already found; theme toggle missing aria-label (BUG-32)

### Edge Cases
- [x] **Empty states** — ✅ Tested (reviews, appointments search, staff) — see BUG-24
- [x] **Very long text** — ✅ 545-char input accepted, no overflow — no max-length validation
- [x] **Special characters** — ✅ Mixed Hebrew/English/emoji input accepted in staff form ("אברהם Test 🏋️")
- [x] **Timezone handling** — ❌ Business timezone not in schema (BUG-44); hardcoded "Asia/Jerusalem" fallback; off-by-one day risk (BUG-51)
- [x] **Past date booking prevention** — ✅ Past dates hidden, but past time slots for today are bookable (BUG-21)
- [ ] **Offline behavior** — Network disconnection handling
- [x] **Back button behavior** — ❌ Browser back exits wizard entirely (BUG-22)

---

## Recommended Priority Fixes

### Immediate (Fix Today — Security)
1. **BUG-35** — Add `authGuard()` to `setCustomClaims` endpoint OR remove it entirely — **privilege escalation vulnerability**
2. **BUG-20/41** — Apply `authGuard()` middleware to ALL routers — the middleware exists and is ready to use
3. **BUG-36** — Configure `cors()` with explicit allowed origins
4. **BUG-42** — Create `firestore.rules` with deny-by-default rules — **database completely unprotected**
5. **BUG-66** — Fix getCollectionSchema: whitelist field names, replace `value: any()` with safe union type — **prototype pollution risk**
6. ~~**BUG-1, BUG-2 & BUG-29** — Change `{ eventId }` to `{ calendarEventId: eventId }` — 3 one-line fixes~~ — ✅ **Done 2026-08-30**

### Urgent (This Week)
6. **BUG-39/3** — Add `onAuthStateChanged()` listener to sync Firebase auth → Zustand; fix session persistence
7. **BUG-48** — Add 401 detection and token refresh retry in API client
8. **BUG-4** — Replace `window.location.reload()` in language toggle with state-based approach
9. **BUG-37/7** — Route all client-side Firestore writes through server API (start with calendar status changes)
10. **BUG-43** — Fix race condition: move overlap check inside Firestore transaction (read from DB, not cache)

### High Priority (Next Sprint)
11. **BUG-45** — Exclude current appointment from overlap check during reschedule
12. **BUG-46/47** — Use Firebase Storage for logos instead of base64 in Firestore; add file size validation
13. **BUG-44** — Add timezone field to Business type schema; add timezone picker to Edit Details
14. **BUG-40/6** — Change analytics filter from `e.created` to `e.start` in `data/services.ts` line 317 (1-line fix)
15. **BUG-49** — Add React error boundaries (error.tsx) at root and key route segments
16. **BUG-50** — Add toast notifications for Firestore write failures
17. **BUG-5** — Fix calendar view switcher dropdown (Radix DropdownMenu click handler)
18. **BUG-11** — Add `DialogTitle` (or `VisuallyHidden` wrapper) to all dialog components
19. **BUG-8/28** — Fix tablet analytics and mobile appointment button overflow
20. **BUG-30** — Add "My Appointments" link to customer booking page navbar
21. **BUG-31** — Fix sidebar active page highlight to track current route

### Medium Priority
22. **BUG-59** — Add helmet.js for security headers (1-line install + use)
23. **BUG-60** — Add login brute-force protection (stricter rate limit on `/actions/login`)
24. **BUG-52** — Add start < end validation to appointment schema
25. **BUG-51** — Fix cross-timezone date slot assignment
26. **BUG-61** — Sync Audit type definitions between client and server
27. **BUG-62** — Add `description` field to server Business interface
28. **BUG-67** — Add cross-field Zod validations (end > start, to >= from)
29. **BUG-68** — Standardize ID min length to min(5)
30. **BUG-15** — Implement actual accessibility mode features or remove the toggle
25. **BUG-9** — Fix incorrect "total reviews" label on No-Show Rate card
26. **BUG-12** — Add toast notification for copy link action
27. **BUG-10** — Show actual address or hide field if empty
28. **BUG-13** — Fix billing currency data display
29. **BUG-14** — Implement marketplace page or remove the link

### Low Priority
30. **BUG-54** — Replace moment.js with date-fns (~70KB savings)
31. **BUG-55** — Remove unused `motion` package
32. **BUG-56** — Add dynamic imports for CalendarComponent, analytics, BookingInterface
33. **BUG-57** — Consolidate icon libraries (replace 3 Remixicon icons with lucide)
34. **BUG-58** — Integrate error tracking service (Sentry)
35. **BUG-16** — Add "All time" option to analytics filter
36. **BUG-17** — Remove console.log statements from production code
37. **BUG-18** — Add `loading="eager"` to LCP logo image
38. **BUG-32** — Add `aria-label` to theme toggle button
39. **BUG-33** — Implement auto-expiry for past appointments
40. **BUG-34** — Fix API error logging (serialize error objects, deduplicate getBusiness calls)
41. **BUG-38** — Add title validation to calendar new event form
42. **BUG-63** — Add setTimeout cleanup in QuickActionsSection and BookingInterface
43. **BUG-64** — Consider Redis-based rate limiter for multi-instance scaling
44. **BUG-65** — Set explicit express.json() body size limit
45. **BUG-69** — Add min length and regex to phone fields
46. **BUG-70** — Add .url() validation to logoUrl field
