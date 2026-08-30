# Graph Report - .  (2026-08-30)

## Corpus Check
- 327 files · ~283,756 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1418 nodes · 3560 edges · 118 communities (74 shown, 44 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 211 edges (avg confidence: 0.8)
- Token cost: 354,496 input · 0 output

## Community Hubs (Navigation)
- Analytics & Type Drift
- Business Dashboard Shell
- Landing Page Components
- Availability & Cache Engine
- Calendar Page & KPI Cards
- Customer Booking & i18n
- Data Query Zod Schemas
- Edit Business Details Forms
- Signup & Public Business Pages
- Radix Dropdown & Dialog UI
- Customer Actions API
- Customers Page Components
- Firestore Document Helpers
- Client Build Tooling Deps
- Client TypeScript Config
- Calendar Drag & Drop
- Project Architecture Overview
- Client Data Fetching Layer
- Appointment Field Mismatch Bugs
- Appointments Actions API
- Server Bootstrap & Logging
- Business Router & Schemas
- shadcn Component Registry
- Calendar Views & Dialogs
- Calendar Helper Utilities
- Staff Actions API
- Appointments Page & Logging Bugs
- Business Config & Reviews
- Edit Details UI Cards
- Server TypeScript Config
- Server Runtime Dependencies
- Staff Page & Hooks
- Server Dev Dependencies
- Services Actions API
- Services Page Components
- Server Routing & Error Bugs
- Appointments List Components
- In-Memory Cache Manager
- Client UI Dependencies
- Calendar Component Root
- Landing Page Defects
- Core Architecture Decisions
- Customers Data Hooks
- Reviews UI Components
- Toast Notification UI
- Firestore Bypass Defects
- Missing Auth Middleware
- Client ESLint Config
- Accessibility Defects
- Session & i18n Race Defects
- Sign-In Pages & Credential Leak
- Cross-Cutting Defect Themes
- Firebase Client Init & Auth
- Mock Data Fixtures
- Server App & Cache Bootstrap
- Priority Security Fixes
- QA Report Findings
- Server Package Metadata
- Silent Error Handling Defects
- Analytics Filter Defects
- Overlap Detection Races
- Server NPM Scripts
- Business Details Copy Defects
- Missing 404 Route Defects
- Booking Wizard Time Defects
- npm: autoprefixer
- Customer Dashboard Nav Defects
- npm: class-variance-authority
- npm: clsx
- npm: cors
- npm: dnd-kit/core
- npm: dnd-kit/modifiers
- npm: dnd-kit/utilities
- npm: dotenv
- npm: firebase
- npm: form-data
- npm: framer-motion
- npm: gsap
- Next.js Config
- npm: axios (client)
- npm: lucide-react
- npm: moment (client)
- npm: moment-timezone (client)
- npm: motion
- npm: next
- npm: next-themes
- npm: radix-ui
- npm: radix-ui/react-checkbox
- npm: radix-ui/react-dialog
- npm: radix-ui/react-dropdown-menu
- npm: radix-ui/react-label
- npm: radix-ui/react-slot
- npm: radix-ui/react-toast
- npm: radix-ui/react-tooltip
- npm: react-day-picker
- npm: react-dom
- npm: remixicon/react
- npm: sonner
- npm: tailwind-merge
- npm: tailwind-variants
- npm: tailwindcss-animate
- npm: tailwindcss-animated
- npm: zustand
- PostCSS Config
- npm: axios (server)
- npm: moment-timezone (server)
- Accessibility Verification Notes
- Bundle & Cleanup Findings

## God Nodes (most connected - your core abstractions)
1. `useLanguage()` - 106 edges
2. `cn()` - 80 edges
3. `jsonOK()` - 44 edges
4. `TS` - 35 edges
5. `TS` - 33 edges
6. `jsonFailed()` - 32 edges
7. `Button()` - 31 edges
8. `firebaseTimestamp()` - 28 edges
9. `CalendarEvent` - 26 edges
10. `useBusinessesStore` - 22 edges

## Surprising Connections (you probably didn't know these)
- `BUG-40: Analytics Filters by Created Date Instead of Start Date` --shares_data_with--> `S_getBusiness()`  [INFERRED]
  bugs.md → keepqueue-server/src/data/services.ts
- `BUG-34: Repeated getBusiness API Errors — Duplicate Requests` --references--> `apiCall()`  [INFERRED]
  bugs.md → keepqueue-client/lib/helpers/api.ts
- `BUG-48: No 401 Handling — Expired Tokens Cause Generic Errors` --references--> `apiCall()`  [EXTRACTED]
  bugs.md → keepqueue-client/lib/helpers/api.ts
- `apiCall()` --references--> `Server Route Structure (/actions and /data)`  [INFERRED]
  keepqueue-client/lib/helpers/api.ts → CLAUDE.md
- `BUG-1: Confirm Appointment 400 — eventId vs calendarEventId` --references--> `createAppointmentSchema`  [AMBIGUOUS]
  bugs.md → keepqueue-server/src/actions/businesses/appointments/schemes.ts

## Import Cycles
- 2-file cycle: `keepqueue-client/components/CalendarComponent/index.ts -> keepqueue-client/components/CalendarComponent/month-view.tsx -> keepqueue-client/components/CalendarComponent/index.ts`
- 2-file cycle: `keepqueue-client/components/CalendarComponent/index.ts -> keepqueue-client/components/CalendarComponent/week-view.tsx -> keepqueue-client/components/CalendarComponent/index.ts`
- 3-file cycle: `keepqueue-client/components/CalendarComponent/event-calendar.tsx -> keepqueue-client/components/CalendarComponent/month-view.tsx -> keepqueue-client/components/CalendarComponent/index.ts -> keepqueue-client/components/CalendarComponent/event-calendar.tsx`
- 3-file cycle: `keepqueue-client/components/CalendarComponent/event-calendar.tsx -> keepqueue-client/components/CalendarComponent/week-view.tsx -> keepqueue-client/components/CalendarComponent/index.ts -> keepqueue-client/components/CalendarComponent/event-calendar.tsx`
- 3-file cycle: `keepqueue-client/components/CalendarComponent/hooks/index.ts -> keepqueue-client/components/CalendarComponent/hooks/use-current-time-indicator.ts -> keepqueue-client/components/CalendarComponent/index.ts -> keepqueue-client/components/CalendarComponent/hooks/index.ts`

## Hyperedges (group relationships)
- **Authentication and Session Lifecycle Defects** — bugs_bug_3, bugs_bug_4, bugs_bug_39, bugs_bug_48, bugs_bug_20, keepqueue_client_lib_store_authstore_useauthstore, keepqueue_client_lib_helpers_api_apicall [INFERRED 0.85]
- **Client Writes Bypassing the Express API** — bugs_bug_7, bugs_bug_37, bugs_bug_38, bugs_bug_42, bugs_bug_50, bugs_bug_73, keepqueue_server_src_managers_cachemanager_cachemanager [EXTRACTED 1.00]
- **Unauthenticated and Unhardened API Surface** — bugs_bug_20, bugs_bug_35, bugs_bug_36, bugs_bug_42, bugs_bug_66, bugs_bug_71, bugs_bug_59, bugs_bug_60, keepqueue_server_src_middlewares_authguard_authguard [INFERRED 0.85]
- **Immediate Security Fix Set (auth, CORS, Firestore rules, schema hardening)** — tests_missing_auth_middleware, tests_setcustomclaims_privilege_escalation, tests_unrestricted_cors, tests_missing_firestore_security_rules, tests_prototype_pollution_getcollectionschema [EXTRACTED 1.00]
- **Client Auth Session Lifecycle Gap** — tests_session_persistence_race_condition, tests_token_expiry_refresh_gap, tests_i18n_rtl_hydration_mismatch, tests_customer_dashboard_unreachable [INFERRED 0.85]
- **Booking Integrity Flow (overlap, reschedule, temporal validation)** — tests_concurrent_booking_race_condition, tests_reschedule_self_overlap, tests_past_time_slot_booking, keepqueue_server_src_actions_businesses_appointments_helpers_hascalendaroverlapincache, keepqueue_server_src_actions_businesses_appointments_services_screateappointment, keepqueue_server_src_actions_businesses_appointments_services_srescheduleappointment [INFERRED 0.85]
- **Server Request Pipeline (validate, handle, respond, cache)** — keepqueue_server_src_middlewares_index_validatebody, keepqueue_server_src_types_index_routerservice, keepqueue_server_src_helpers_index_jsonok, keepqueue_server_src_helpers_index_jsonfailed, keepqueue_server_src_managers_cachemanager_cachemanager [INFERRED 0.85]
- **Zustand Store Selector Pattern** — keepqueue_client_lib_store_utils_createselectors, keepqueue_client_lib_store_authstore_useauthstore, keepqueue_client_lib_store_businesses_usebusinessesstore, keepqueue_client_lib_store_settingsstore_usesettingsstore [EXTRACTED 1.00]
- **No-Show Reduction Strategy** — prd_automatic_reminders_and_confirmations, prd_smart_waiting_list, prd_problematic_customer_handling, prd_real_time_reports_and_stats [INFERRED 0.85]

## Communities (118 total, 44 thin omitted)

### Community 0 - "Analytics & Type Drift"
Cohesion: 0.05
Nodes (62): BUG-44: Business Timezone Not in Type Schema — Hardcoded Fallback, BUG-61: Audit Type Definitions Out of Sync Client/Server, BUG-62: Business.description Field Missing on Server Type, BUG-85: 7 TypeScript Errors in Client Code, Client/Server Shared Type Drift, Analytics(), getKpiCards(), KpiCard() (+54 more)

### Community 1 - "Business Dashboard Shell"
Cohesion: 0.05
Nodes (39): BusinessHeader(), BusinessSidebar(), menuItems, BusinessProxy(), useBusinessProxy(), BusinessLoading(), AuthGuard(), AuthGuardProps (+31 more)

### Community 2 - "Landing Page Components"
Cohesion: 0.06
Nodes (41): NewsletterSection(), SiteHeader(), LandingPage(), FeatureCard(), FEATURES, FeaturesSection(), FeatureStatic, FooterColumn() (+33 more)

### Community 3 - "Availability & Cache Engine"
Cohesion: 0.09
Nodes (48): buildDailyFreeIntervals(), computeBusinessAvailability(), getBlockingEventsForDay(), isOverlap(), makeTs(), subtractBusyFromInterval(), ParseDocumentsOptions, CacheStore (+40 more)

### Community 4 - "Calendar Page & KPI Cards"
Cohesion: 0.10
Nodes (32): KpiCardProps, PeriodSelectorProps, TopServicesCardProps, buildDescription(), Calendar(), isAllDay(), mapBusinessEvent(), statusColorByStatus (+24 more)

### Community 5 - "Customer Booking & i18n"
Cohesion: 0.10
Nodes (34): Hebrew/English Internationalization and RTL, ResetPasswordPage(), DeleteStaffDialog(), EmptyState(), StaffCard(), CustomerHeader(), CustomerDashboardPage(), BookingSuccessPage() (+26 more)

### Community 6 - "Data Query Zod Schemas"
Cohesion: 0.11
Nodes (37): BUG-66: getCollectionSchema value:any() — Prototype Pollution Risk, checkCondition(), GetAvailabilityByServiceIdModel, getAvailabilityByServiceIdSchema, GetBusinessAnalyticsModel, getBusinessAnalyticsSchema, GetBusinessAppointmentsModel, getBusinessAppointmentsSchema (+29 more)

### Community 7 - "Edit Business Details Forms"
Cohesion: 0.09
Nodes (37): BusinessDetailsCards(), BasicInfoFormState, createDefaultInterval(), createInitialBasicInfo(), createInitialOwnerInfo(), createInitialPolicyForm(), createInitialScheduleForm(), currencyOptions (+29 more)

### Community 8 - "Signup & Public Business Pages"
Cohesion: 0.16
Nodes (18): BusinessServices(), SignInFormProps, SignUpForm(), SignUpFormProps, Alert, AlertDescription, AlertTitle, alertVariants (+10 more)

### Community 9 - "Radix Dropdown & Dialog UI"
Cohesion: 0.08
Nodes (28): DialogOverlay(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut() (+20 more)

### Community 10 - "Customer Actions API"
Cohesion: 0.15
Nodes (24): Server Route Structure (/actions and /data), Server API Route Groups, BlockCustomerModel, blockCustomerSchema, UnblockCustomerModel, unblockCustomerSchema, UpdateCustomerModel, updateCustomerSchema (+16 more)

### Community 11 - "Customers Page Components"
Cohesion: 0.10
Nodes (22): BlockCustomerDialog(), BlockCustomerDialogProps, CustomerAppointmentsDialog(), CustomerAppointmentsDialogProps, CustomerCard(), CustomerCardProps, EmptyState(), EmptyStateProps (+14 more)

### Community 12 - "Firestore Document Helpers"
Cohesion: 0.11
Nodes (30): StaffDialog(), addDocument(), envData, getAllDocuments(), getDocumentById(), getDocumentByIdOptional(), messaging, queryDocument() (+22 more)

### Community 13 - "Client Build Tooling Deps"
Cohesion: 0.06
Nodes (32): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, postcss (+24 more)

### Community 14 - "Client TypeScript Config"
Cohesion: 0.06
Nodes (31): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+23 more)

### Community 15 - "Calendar Drag & Drop"
Cohesion: 0.17
Nodes (21): CalendarDndContext, CalendarDndContextType, CalendarDndProvider(), CalendarDndProviderProps, useCalendarDnd(), DayView(), DayViewProps, PositionedEvent (+13 more)

### Community 16 - "Project Architecture Overview"
Cohesion: 0.10
Nodes (28): Ralph Loop Autonomous Iteration State, Next.js App Router Layout, keepqueue-client Sub-Project, keepqueue-server Sub-Project, Manually Synced Shared Types, serverUrl, Framer Motion and GSAP Animation Stack, @dnd-kit Drag and Drop (+20 more)

### Community 17 - "Client Data Fetching Layer"
Cohesion: 0.15
Nodes (20): getAllDocuments(), getUserByEmail(), getUserByIdentifier(), getUserByPhone(), queryDocument(), queryDocumentByConditions(), queryDocumentsByConditions(), simpleExtractData() (+12 more)

### Community 18 - "Appointment Field Mismatch Bugs"
Cohesion: 0.10
Nodes (25): BUG-1: Confirm Appointment 400 — eventId vs calendarEventId, BUG-18: LCP Image Missing loading=eager, BUG-2: Cancel Appointment 400 — eventId vs calendarEventId, BUG-29: Customer Cancel Appointment Field Name Mismatch, BUG-46: No File Size Validation on Logo Upload, BUG-47: Logo Stored as Base64 in Firestore, BUG-52: No Validation That Appointment Start < End, BUG-54: Duplicate Date Libraries — moment + date-fns (+17 more)

### Community 19 - "Appointments Actions API"
Cohesion: 0.17
Nodes (20): getServiceById(), hasCalendarOverlapInCache(), parseTs(), CancelAppointmentModel, cancelAppointmentSchema, ConfirmAppointmentModel, confirmAppointmentSchema, CreateAppointmentModel (+12 more)

### Community 20 - "Server Bootstrap & Logging"
Cohesion: 0.18
Nodes (11): initEnvVariables(), startServer(), trimStrings(), logger, LoggerManager, AuthenticatedRequest, errorHandler(), trimBodyMiddleware() (+3 more)

### Community 21 - "Business Router & Schemas"
Cohesion: 0.13
Nodes (16): appointmentsRouter, customersRouter, dailyTimeRangeSchema, operationScheduleSchema, policySchema, UpdateBusinessModel, updateBusinessSchema, servicesRouter (+8 more)

### Community 22 - "shadcn Component Registry"
Cohesion: 0.10
Nodes (19): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+11 more)

### Community 23 - "Calendar Views & Dialogs"
Cohesion: 0.15
Nodes (16): AgendaView(), AgendaViewProps, EventDialog(), EventItemProps, EventWrapper(), EventWrapperProps, EventsPopup(), EventsPopupProps (+8 more)

### Community 24 - "Calendar Helper Utilities"
Cohesion: 0.17
Nodes (12): EventColor, getAllEventsForDay(), getEventsForDay(), getSpanningEventsForDay(), sortEvents(), EventVisibilityOptions, EventVisibilityResult, useEventVisibility() (+4 more)

### Community 25 - "Staff Actions API"
Cohesion: 0.16
Nodes (16): Zod Request Validation, CreateStaffModel, createStaffSchema, dailyTimeRangeSchema, DeleteStaffModel, deleteStaffSchema, operationScheduleSchema, UpdateStaffModel (+8 more)

### Community 26 - "Appointments Page & Logging Bugs"
Cohesion: 0.16
Nodes (14): BUG-17: Console.log Statements Left in Production Code, BUG-34: Repeated getBusiness API Errors — Duplicate Requests, BUG-58: No Error Tracking Service (Sentry/LogRocket), Firebase ID Token Bearer Authentication, Appointments(), cancelAppointment(), confirmAppointment(), useAppointmentActions() (+6 more)

### Community 27 - "Business Config & Reviews"
Cohesion: 0.17
Nodes (9): BusinessConfig(), getBusinessById(), useBusiness(), useReviewStats(), Reviews(), Config(), BusinessHomePageProps, BookingInterface() (+1 more)

### Community 28 - "Edit Details UI Cards"
Cohesion: 0.24
Nodes (13): BasicInformationCard(), languageOptions, LogoUploadCard(), NoBusinessCard(), normalizeTimeValue(), OwnerInformationCard(), PolicySettingsCard(), timeInputRegExp (+5 more)

### Community 29 - "Server TypeScript Config"
Cohesion: 0.12
Nodes (16): compilerOptions, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames, module, outDir, resolveJsonModule, rootDir (+8 more)

### Community 30 - "Server Runtime Dependencies"
Cohesion: 0.13
Nodes (15): core, express, firebase-admin, dependencies, core, express, firebase-admin, lodash (+7 more)

### Community 31 - "Staff Page & Hooks"
Cohesion: 0.24
Nodes (9): useRefreshBusiness(), StaffCardProps, useStaffActions(), useStaffDialog(), Staff(), StarBorder(), StarBorderProps, addDocument() (+1 more)

### Community 32 - "Server Dev Dependencies"
Cohesion: 0.13
Nodes (15): devDependencies, nodemon, ts-node, @types/cors, @types/express, @types/lodash, @types/node, typescript (+7 more)

### Community 33 - "Services Actions API"
Cohesion: 0.24
Nodes (11): CreateServiceModel, createServiceSchema, dailyTimeRangeSchema, DeleteServiceModel, deleteServiceSchema, operationScheduleSchema, UpdateServiceModel, updateServiceSchema (+3 more)

### Community 34 - "Services Page Components"
Cohesion: 0.29
Nodes (9): ServiceCard(), ServiceDialog(), formatDuration(), formatPrice(), useServiceDialog(), useServiceForm(), useServices(), Services() (+1 more)

### Community 35 - "Server Routing & Error Bugs"
Cohesion: 0.23
Nodes (8): BUG-60: No Login Brute-Force Protection, BUG-79: /data/getBusiness Returns 200 with Error Body, BUG-86: /actions/login Returns 500 on Invalid Body, businessesRouter, SLogin(), SSetCustomClaims(), auth, verifyToken()

### Community 36 - "Appointments List Components"
Cohesion: 0.24
Nodes (8): AppointmentCard(), AppointmentCardProps, AppointmentFilters(), CancelDialog(), CancelDialogProps, EmptyState(), EmptyStateProps, getStatusVariant()

### Community 37 - "In-Memory Cache Manager"
Cohesion: 0.24
Nodes (4): BUG-33: Past Appointments Still Show Booked — No Auto-Expiry, BUG-53: Notification System Fully Stubbed, CacheManager, Message Templates and Notifications: Infrastructure Without Implementation

### Community 38 - "Client UI Dependencies"
Cohesion: 0.18
Nodes (11): date-fns, dependencies, date-fns, @radix-ui/react-avatar, @radix-ui/react-select, @radix-ui/react-separator, @tanstack/react-query, @radix-ui/react-avatar (+3 more)

### Community 39 - "Calendar Component Root"
Cohesion: 0.25
Nodes (9): CalendarComponent(), CalendarComponentProps, sampleEvents, EventCalendar(), EventCalendarProps, CalendarView, addHoursToDate(), DropdownMenu() (+1 more)

### Community 40 - "Landing Page Defects"
Cohesion: 0.20
Nodes (10): BUG-23: Landing Page 404 — index.tsx Instead of page.tsx, BUG-28: Mobile 375px Appointment Action Buttons Overflow, BUG-72: Landing Page CTA Buttons Are Dead div Elements, BUG-8: Tablet 768px Analytics Cards Truncated, BUG-81: Testimonial Section Uses Placeholder Images, BUG-83: Nav Link #pricing Points to Non-Existent Section, BUG-87: Footer Copyright Year is 2024, BUG-93: No Hamburger Menu on Mobile Landing Page (+2 more)

### Community 41 - "Core Architecture Decisions"
Cohesion: 0.22
Nodes (10): Direct Client Firestore Reads, Server In-Memory Cache Architecture, UI and Code Conventions, Zustand Persisted Client Stores, TanStack React Query Data Layer, Firebase Backend (Firestore, Auth, Storage), Lighthouse >= 90 Target, Mobile-First Responsiveness (+2 more)

### Community 42 - "Customers Data Hooks"
Cohesion: 0.29
Nodes (8): Customers(), getCustomerInitials(), getUserById(), useCustomerAppointments(), useCustomers(), getDocumentById(), react, react

### Community 43 - "Reviews UI Components"
Cohesion: 0.24
Nodes (8): EmptyState(), ReviewCard(), ReviewCardProps, StatsCard(), StatsCardProps, Badge(), BadgeProps, badgeVariants

### Community 44 - "Toast Notification UI"
Cohesion: 0.20
Nodes (9): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+1 more)

### Community 45 - "Firestore Bypass Defects"
Cohesion: 0.31
Nodes (9): BUG-10: Business Address Shows Dash on Public Booking Page, BUG-19: Duplicate Service Names on Booking Page, BUG-37: Client-Side Firestore Bypass — 7 Collections Written Directly, BUG-38: Calendar New Event Allows Empty Title, BUG-42: No Firestore Security Rules — Database Unprotected, BUG-7: Mark No-Show / Mark Done Bypass Server API, BUG-73: Public Booking Page Firebase Permission Error, BUG-80: Booking Page Shows No Services (+1 more)

### Community 46 - "Missing Auth Middleware"
Cohesion: 0.31
Nodes (9): BUG-20: API Endpoints Have No Authentication Middleware, BUG-35: setCustomClaims Unauthenticated — Privilege Escalation, BUG-36: CORS Allows All Origins in Production, BUG-41: authGuard Middleware Exists But Is Never Used, BUG-59: No helmet.js — Missing Security Headers, Missing Authentication Middleware on Express Routers, POST /actions/setCustomClaims Endpoint, actionsRouter (+1 more)

### Community 47 - "Client ESLint Config"
Cohesion: 0.22
Nodes (8): extends, rules, react-hooks/exhaustive-deps, react/no-unescaped-entities, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, next/core-web-vitals, next/typescript

### Community 48 - "Accessibility Defects"
Cohesion: 0.25
Nodes (8): WCAG Accessibility Compliance Gap, BUG-11: DialogContent Missing DialogTitle (A11y), BUG-15: Accessibility Mode Has No Visible Effect, BUG-32: Theme Toggle Button Missing aria-label, BUG-5: Calendar View Switcher Dropdown Doesn't Open, BUG-82: Newsletter Start Now Button Has No onClick Handler, BUG-89: Heading Hierarchy Skips Levels (A11y), BUG-90: No Skip-to-Main-Content Link (A11y)

### Community 49 - "Session & i18n Race Defects"
Cohesion: 0.36
Nodes (8): BUG-3: Direct URL Navigation Loses Session, BUG-39: No onAuthStateChanged Listener, BUG-4: Language Toggle Causes Session Loss, BUG-48: No 401 Handling — Expired Tokens Cause Generic Errors, BUG-77: English Mode — Landing Page Renders RTL with lang=he, BUG-78: English Mode — Testimonials and CTA Remain Hebrew, i18n Language Applied Only After Hydration, Zustand Auth Rehydration Race (No Firebase Auth Listener)

### Community 50 - "Sign-In Pages & Credential Leak"
Cohesion: 0.25
Nodes (4): BUG-71: Hardcoded Real Credentials in Client Source Code, BUG-76: English Mode — Sign-In Page Still Shows Hebrew, BUG-92: /test Debug Page Publicly Accessible, SignInForm()

### Community 51 - "Cross-Cutting Defect Themes"
Cohesion: 0.29
Nodes (8): handleCancel, addAuditRecord(), Appointment Action Field Name Mismatch (eventId vs calendarEventId), Customer Dashboard Effectively Unreachable, Error Handling Patterns Audit, i18n RTL Hydration Mismatch and Language Toggle Reload, Session Persistence Race Condition (no onAuthStateChanged listener), Token Expiry and Refresh Handling Gap

### Community 53 - "Mock Data Fixtures"
Cohesion: 0.25
Nodes (7): businesses, calendar, message_templates, TODO: delete this file, reviews, services, waitlist

### Community 54 - "Server App & Cache Bootstrap"
Cohesion: 0.36
Nodes (6): init(), initSnapshot(), parseDocuments(), mainRouter(), rootRouter, MainRouter

### Community 55 - "Priority Security Fixes"
Cohesion: 0.36
Nodes (8): authGuard(), Client-Side Firestore Direct Writes Bypassing Server API, Missing Authentication Middleware on All Routers, Missing Firestore Security Rules, Rate Limiting and DoS Protection, Recommended Priority Fixes, setCustomClaims Privilege Escalation, Unrestricted CORS Configuration

### Community 56 - "QA Report Findings"
Cohesion: 0.25
Nodes (8): Browser Back Button Exits Booking Wizard, Landing Page Route 404 (index.tsx instead of page.tsx), Past Time Slots Bookable for Today, Public 4-Step Booking Wizard, Bug Inventory (bugs.md, 88 bugs), Keepqueue Platform QA Testing Report, Timezone Handling Review, Client-Server Type Synchronization Drift

### Community 57 - "Server Package Metadata"
Cohesion: 0.29
Nodes (6): author, description, license, main, name, version

### Community 58 - "Silent Error Handling Defects"
Cohesion: 0.33
Nodes (6): BUG-12: Copy Booking Link — No User Feedback, BUG-49: No Global React Error Boundary, BUG-50: Firestore Operations Fail Silently — No UI Error Feedback, BUG-63: Missing setTimeout Cleanup — Unmounted Component Updates, WaitlistForm(), deleteDocument()

### Community 59 - "Analytics Filter Defects"
Cohesion: 0.40
Nodes (5): BUG-16: No All Time Option in Analytics Date Filter, BUG-24: Empty State Message Misleading on Search/Filter, BUG-40: Analytics Filters by Created Date Instead of Start Date, BUG-6: Analytics Shows 0 Data Despite Existing Appointments, BUG-9: Wrong Label Under No-Show Rate Metric

### Community 60 - "Overlap Detection Races"
Cohesion: 0.50
Nodes (5): BUG-43: Race Condition in Appointment Overlap Detection, BUG-45: Reschedule Detects Own Appointment as Overlap Conflict, BUG-64: In-Memory Rate Limiter Not Scalable, Overlap Detection Against Stale In-Memory Cache, hasCalendarOverlapInCache

### Community 61 - "Server NPM Scripts"
Cohesion: 0.40
Nodes (5): scripts, build, deploy, start, startjs

### Community 62 - "Business Details Copy Defects"
Cohesion: 0.50
Nodes (4): BUG-13: Billing Currency Field Empty on Edit Details, BUG-25: Duration Grammar Error — 1 hours, BUG-26: Currency Shows INS Instead of ILS, BUG-27: Working Hours Section Has Duplicate Header

### Community 63 - "Missing 404 Route Defects"
Cohesion: 0.50
Nodes (4): BUG-14: Customer Marketplace Route Returns 404, BUG-74: All 9 Footer Links Return 404, BUG-75: Invalid Business ID Shows Booking Page Instead of 404, BUG-84: Custom 404 Page Missing

### Community 64 - "Booking Wizard Time Defects"
Cohesion: 0.50
Nodes (4): BUG-21: Past Time Slots Bookable for Today, BUG-22: Browser Back Button Exits Booking Wizard, BUG-51: Off-by-One Day Risk for Cross-Timezone Booking, withinSchedule

## Ambiguous Edges - Review These
- `createAppointmentSchema` → `BUG-1: Confirm Appointment 400 — eventId vs calendarEventId`  [AMBIGUOUS]
  bugs.md · relation: references
- `Keepqueue SaaS Appointment Platform` → `Ralph Loop Autonomous Iteration State`  [AMBIGUOUS]
  .claude/ralph-loop.local.md · relation: references
- `keepqueue-client Sub-Project` → `Next.js 16 / React 19 Framework`  [AMBIGUOUS]
  keepqueue-client/README.md · relation: references
- `Keepqueue Server Application` → `serverUrl`  [AMBIGUOUS]
  keepqueue-server/README.md · relation: references

## Knowledge Gaps
- **364 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unused-vars`, `react-hooks/exhaustive-deps` (+359 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `createAppointmentSchema` and `BUG-1: Confirm Appointment 400 — eventId vs calendarEventId`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Keepqueue SaaS Appointment Platform` and `Ralph Loop Autonomous Iteration State`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `keepqueue-client Sub-Project` and `Next.js 16 / React 19 Framework`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Keepqueue Server Application` and `serverUrl`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `dependencies` connect `Client UI Dependencies` to `Client Build Tooling Deps`, `Customers Data Hooks`, `npm: autoprefixer`, `npm: class-variance-authority`, `npm: clsx`, `npm: dnd-kit/core`, `npm: dnd-kit/modifiers`, `npm: dnd-kit/utilities`, `npm: firebase`, `npm: framer-motion`, `npm: gsap`, `npm: axios (client)`, `npm: lucide-react`, `npm: moment (client)`, `npm: moment-timezone (client)`, `npm: motion`, `npm: next`, `npm: next-themes`, `npm: radix-ui`, `npm: radix-ui/react-checkbox`, `npm: radix-ui/react-dialog`, `npm: radix-ui/react-dropdown-menu`, `npm: radix-ui/react-label`, `npm: radix-ui/react-slot`, `npm: radix-ui/react-toast`, `npm: radix-ui/react-tooltip`, `npm: react-day-picker`, `npm: react-dom`, `npm: remixicon/react`, `npm: sonner`, `npm: tailwind-merge`, `npm: tailwind-variants`, `npm: tailwindcss-animate`, `npm: tailwindcss-animated`, `npm: zustand`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Why does `react` connect `Customers Data Hooks` to `Business Dashboard Shell`, `Services Page Components`, `Client UI Dependencies`, `Radix Dropdown & Dialog UI`, `Customers Page Components`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `useLanguage()` connect `Customer Booking & i18n` to `Analytics & Type Drift`, `Business Dashboard Shell`, `Landing Page Components`, `Calendar Page & KPI Cards`, `Edit Business Details Forms`, `Signup & Public Business Pages`, `Customers Page Components`, `Firestore Document Helpers`, `Appointments Page & Logging Bugs`, `Business Config & Reviews`, `Edit Details UI Cards`, `Staff Page & Hooks`, `Services Page Components`, `Appointments List Components`, `Calendar Component Root`, `Customers Data Hooks`, `Reviews UI Components`, `Sign-In Pages & Credential Leak`, `Silent Error Handling Defects`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._