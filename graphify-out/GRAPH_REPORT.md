# Graph Report - .  (2026-09-01)

## Corpus Check
- 258 files · ~78,609 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1409 nodes · 3715 edges · 108 communities (68 shown, 40 thin omitted)
- Extraction: 94% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 198 edges (avg confidence: 0.83)
- Token cost: 360,136 input · 0 output

## Community Hubs (Navigation)
- Client-Side Defect Cluster
- Business Dashboard Shell
- Landing Page Components
- Business Calendar Page
- Data Query Layer & Schemas
- Customer Actions API
- Availability & Booking Races
- Server Bootstrap, CORS & Rate Limits
- In-Memory Cache & Notifications
- Calendar Drag & Drop
- Reviews & Shared Prop Types
- Radix UI Primitives
- Client Build Tooling Deps
- Firestore Admin Helpers
- Signup & Public Business Pages
- Client TypeScript Config
- i18n & Appointments UI
- Edit Business Details Forms
- Zustand Stores & Dashboard Cards
- Calendar Component Root
- Sign-In & Booking Interface
- Appointments Store & Filters
- Services & Reviews Hooks
- Customers Page Components
- QA Report Findings
- shadcn Component Registry
- Server Root Routers & Login
- Product Requirements & Types
- Architecture Overview Docs
- Server Runtime Dependencies
- Firestore Snapshot Parsers
- Server TypeScript Config
- Edit Details UI Cards
- Calendar Helper Utilities
- Services Actions API
- Silent Firestore Failures
- Analytics Page & KPIs
- Booking Interface State
- Server Dev Dependencies
- Staff Actions API
- Monorepo Deploy Scripts
- Waitlist Actions API
- Firebase Auth & Session
- Data-Layer Security Findings
- Client UI Dependencies
- Appointment Field Mismatch
- Business Config Loader
- Toast Notification UI
- Agenda View & Localization
- Sheet UI Primitive
- Client ESLint Config
- Client-Server Contract Docs
- Dashboard Overview Sections
- Server Package Metadata
- Customers Data Hooks
- Server NPM Scripts
- Host Deploy Script
- npm: autoprefixer
- npm: clsx
- npm: cors
- npm: dnd-kit/core
- npm: dnd-kit/modifiers
- npm: dnd-kit/utilities
- npm: dotenv
- npm: firebase
- npm: firebase-admin
- npm: form-data
- npm: framer-motion
- npm: gsap
- Next.js Config
- npm: axios
- npm: lucide-react
- npm: moment
- npm: moment-timezone
- npm: motion
- npm: next
- npm: next-themes
- npm: radix-ui
- npm: radix-ui/react-avatar
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
- npm: zod

## God Nodes (most connected - your core abstractions)
1. `useLanguage()` - 105 edges
2. `cn()` - 80 edges
3. `Keepqueue Bug Report v1.0.5` - 56 edges
4. `jsonOK()` - 42 edges
5. `TS` - 37 edges
6. `TS` - 35 edges
7. `Keepqueue Platform QA Testing Report` - 33 edges
8. `Button()` - 31 edges
9. `jsonFailed()` - 30 edges
10. `firebaseTimestamp()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `Problematic Customer Handling` --semantically_similar_to--> `rateLimiter()`  [INFERRED] [semantically similar]
  PRD.md → keepqueue-server/src/middlewares/rateLimiter.ts
- `Client Zustand State (three persisted stores)` --references--> `useAppointmentsStore`  [AMBIGUOUS]
  CLAUDE.md → keepqueue-client/lib/store/appointmentsStore.ts
- `Internationalization and RTL Support` --shares_data_with--> `useSettingsStore`  [INFERRED]
  CLAUDE.md → keepqueue-client/lib/store/settingsStore.ts
- `Past Time Slots Bookable Today (BUG-21)` --references--> `S_getAvailabilityByServiceId()`  [INFERRED]
  tests.md → keepqueue-server/src/data/services.ts
- `Server Route Structure (documented endpoint list)` --references--> `authGuard()`  [AMBIGUOUS]
  CLAUDE.md → keepqueue-server/src/middlewares/authGuard.ts

## Import Cycles
- 2-file cycle: `keepqueue-client/components/CalendarComponent/index.ts -> keepqueue-client/components/CalendarComponent/week-view.tsx -> keepqueue-client/components/CalendarComponent/index.ts`
- 2-file cycle: `keepqueue-client/components/CalendarComponent/index.ts -> keepqueue-client/components/CalendarComponent/month-view.tsx -> keepqueue-client/components/CalendarComponent/index.ts`
- 3-file cycle: `keepqueue-client/components/CalendarComponent/event-calendar.tsx -> keepqueue-client/components/CalendarComponent/week-view.tsx -> keepqueue-client/components/CalendarComponent/index.ts -> keepqueue-client/components/CalendarComponent/event-calendar.tsx`
- 3-file cycle: `keepqueue-client/components/CalendarComponent/hooks/index.ts -> keepqueue-client/components/CalendarComponent/hooks/use-current-time-indicator.ts -> keepqueue-client/components/CalendarComponent/index.ts -> keepqueue-client/components/CalendarComponent/hooks/index.ts`
- 3-file cycle: `keepqueue-client/components/CalendarComponent/event-calendar.tsx -> keepqueue-client/components/CalendarComponent/month-view.tsx -> keepqueue-client/components/CalendarComponent/index.ts -> keepqueue-client/components/CalendarComponent/event-calendar.tsx`

## Hyperedges (group relationships)
- **Double-Booking Race: Cache-Based Overlap Check** — bugs_bug_43, bugs_cache_as_source_of_truth, keepqueue_server_src_actions_businesses_appointments_helpers_hascalendaroverlapincache, keepqueue_server_src_actions_businesses_appointments_services_srescheduleappointment, keepqueue_server_src_managers_cachemanager_cachemanager [EXTRACTED 1.00]
- **English Locale Fails on First Paint** — bugs_bug_76, bugs_bug_77, bugs_bug_78, bugs_language_hydration_race, keepqueue_client_components_config_language_languageinitializer, keepqueue_client_components_signin_form_signinform [INFERRED 0.95]
- **Public Booking Page Renders Without Data** — bugs_bug_73, bugs_bug_80, bugs_bug_10, bugs_bug_75, keepqueue_client_components_bookinginterface_bookinginterface_bookinginterface, keepqueue_server_src_data_services_s_getbusiness [INFERRED 0.85]
- **Unauthenticated Attack Surface (Immediate Security Band)** — tests_unauthenticated_api_endpoints, tests_setcustomclaims_privilege_escalation, tests_permissive_cors_configuration, tests_missing_firestore_security_rules, tests_prototype_pollution_getcollectionschema, keepqueue_server_src_middlewares_authguard_authguard [EXTRACTED 1.00]
- **Client-Server Contract Drift Pattern** — tests_eventid_calendareventid_mismatch, tests_analytics_date_filter_mismatch, tests_type_synchronization_drift, tests_client_side_firestore_direct_writes [INFERRED 0.85]
- **Booking Flow Integrity Gaps** — tests_public_booking_wizard, tests_past_time_slot_bookable, tests_booking_wizard_back_button, tests_concurrent_booking_race_condition, tests_timezone_handling_review, tests_invalid_business_id_handling [INFERRED 0.85]
- **Confirm Appointment Request Pipeline (client to schema to handler)** — keepqueue_client_app_business_appointments_helpers_confirmappointment, keepqueue_client_lib_helpers_api_apicall, keepqueue_server_src_middlewares_index_validatebody, keepqueue_server_src_actions_businesses_appointments_schemes_confirmappointmentschema, keepqueue_server_src_actions_businesses_appointments_services_sconfirmappointment [EXTRACTED 1.00]
- **Route Handler Response Contract (RouterService, validation, wrappers)** — keepqueue_server_src_types_index_routerservice, keepqueue_server_src_middlewares_index_validatebody, keepqueue_server_src_middlewares_index_errorhandler, keepqueue_server_src_helpers_index_jsonok, keepqueue_server_src_helpers_index_jsonfailed [EXTRACTED 1.00]
- **Zustand Persisted Store Layer with createSelectors** — keepqueue_client_lib_store_utils_createselectors, keepqueue_client_lib_store_authstore_useauthstore, keepqueue_client_lib_store_businesses_usebusinessesstore, keepqueue_client_lib_store_settingsstore_usesettingsstore, keepqueue_client_lib_store_appointmentsstore_useappointmentsstore [INFERRED 0.95]

## Communities (108 total, 40 thin omitted)

### Community 0 - "Client-Side Defect Cluster"
Cohesion: 0.05
Nodes (69): Accessibility and WCAG Compliance, BUG-10: Business Address Shows Dash on Public Booking Page, BUG-11: DialogContent Missing DialogTitle (Accessibility), BUG-12: Copy Booking Link Has No User Feedback, BUG-13: Billing Currency Field Empty on Edit Details, BUG-14: Customer Marketplace Route Returns 404, BUG-15: Accessibility Mode Has No Visible Effect, BUG-16: No All-Time Option in Analytics Date Filter (+61 more)

### Community 1 - "Business Dashboard Shell"
Cohesion: 0.05
Nodes (37): BusinessSidebar(), menuItems, BusinessProxy(), useBusinessProxy(), BusinessLoading(), AuthGuard(), AuthGuardProps, Separator (+29 more)

### Community 2 - "Landing Page Components"
Cohesion: 0.06
Nodes (38): LandingPage(), FeatureCard(), FEATURES, FeaturesSection(), FeatureStatic, FooterColumn(), FooterLinkStatic, HeroSection() (+30 more)

### Community 3 - "Business Calendar Page"
Cohesion: 0.09
Nodes (33): buildDescription(), isAllDay(), mapBusinessEvent(), statusColorByStatus, toDate(), typeColorMap, BlockCustomerDialogProps, CustomerAppointmentsDialogProps (+25 more)

### Community 4 - "Data Query Layer & Schemas"
Cohesion: 0.09
Nodes (40): checkCondition(), conditionValue, FORBIDDEN_FIELD_PARTS, GetAvailabilityByServiceIdModel, getAvailabilityByServiceIdSchema, GetBusinessAnalyticsModel, getBusinessAnalyticsSchema, GetBusinessAppointmentsModel (+32 more)

### Community 5 - "Customer Actions API"
Cohesion: 0.11
Nodes (29): customersRouter, BlockCustomerModel, blockCustomerSchema, UnblockCustomerModel, unblockCustomerSchema, UpdateCustomerModel, updateCustomerSchema, SBlockCustomer() (+21 more)

### Community 6 - "Availability & Booking Races"
Cohesion: 0.10
Nodes (33): BUG-43: Race Condition in Appointment Overlap Detection, BUG-1: Confirm Appointment 400 (eventId vs calendarEventId), buildDailyFreeIntervals(), computeBusinessAvailability(), getBlockingEventsForDay(), getServiceById(), hasCalendarOverlapInCache(), isOverlap() (+25 more)

### Community 7 - "Server Bootstrap, CORS & Rate Limits"
Cohesion: 0.10
Nodes (23): BUG-60: No Login Brute-Force Protection, BUG-64: In-Memory Rate Limiter Not Scalable, allowedOrigins(), corsOriginCheck(), DEFAULT_ORIGINS, initEnvVariables(), isAllowedOrigin(), startServer() (+15 more)

### Community 8 - "In-Memory Cache & Notifications"
Cohesion: 0.14
Nodes (36): BUG-53: Notification System Fully Stubbed, ParseDocumentsOptions, CacheStore, SetOptions, BusinessWithRelations, CalendarEventWithRelations, ReviewWithUser, WaitItemWithRelations (+28 more)

### Community 9 - "Calendar Drag & Drop"
Cohesion: 0.13
Nodes (29): CalendarDndContext, CalendarDndContextType, CalendarDndProvider(), CalendarDndProviderProps, useCalendarDnd(), DayView(), DayViewProps, PositionedEvent (+21 more)

### Community 10 - "Reviews & Shared Prop Types"
Cohesion: 0.11
Nodes (34): ReviewWithUser, ReviewWithUser, useReviewStats(), ServiceCardProps, StaffCardProps, WaitlistFormProps, SignInSuccessPayload, BusinessWithRelations (+26 more)

### Community 11 - "Radix UI Primitives"
Cohesion: 0.13
Nodes (23): AlertTitle, alertVariants, buttonVariants, Calendar(), Checkbox(), DialogOverlay(), Popover(), PopoverContent() (+15 more)

### Community 12 - "Client Build Tooling Deps"
Cohesion: 0.06
Nodes (32): babel-plugin-react-compiler, eslint, eslint-config-next, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next, postcss (+24 more)

### Community 13 - "Firestore Admin Helpers"
Cohesion: 0.12
Nodes (29): addDocument(), envData, getAllDocuments(), getDocumentById(), getDocumentByIdOptional(), messaging, queryDocument(), queryDocumentByConditions() (+21 more)

### Community 14 - "Signup & Public Business Pages"
Cohesion: 0.18
Nodes (14): StatCardProps, SignInFormProps, SignUpForm(), SignUpFormProps, Alert, AlertDescription, Button(), Card (+6 more)

### Community 15 - "Client TypeScript Config"
Cohesion: 0.06
Nodes (31): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+23 more)

### Community 16 - "i18n & Appointments UI"
Cohesion: 0.12
Nodes (21): Internationalization and RTL Support, ResetPasswordPage(), Appointments(), AppointmentCard(), AppointmentCardProps, AppointmentFilters(), CancelDialog(), CancelDialogProps (+13 more)

### Community 17 - "Edit Business Details Forms"
Cohesion: 0.15
Nodes (26): BasicInfoFormState, createDefaultInterval(), createInitialBasicInfo(), createInitialOwnerInfo(), createInitialPolicyForm(), createInitialScheduleForm(), currencyOptions, defaultScheduleInterval (+18 more)

### Community 18 - "Zustand Stores & Dashboard Cards"
Cohesion: 0.18
Nodes (14): Client Zustand State (three persisted stores), EmptyState(), ReviewCard(), ReviewCardProps, StatsCard(), StatsCardProps, A11yToggle(), LanguageToggle() (+6 more)

### Community 19 - "Calendar Component Root"
Cohesion: 0.10
Nodes (20): CalendarComponent(), CalendarComponentProps, sampleEvents, EventCalendar(), EventCalendarProps, CalendarView, addHoursToDate(), DropdownMenu() (+12 more)

### Community 20 - "Sign-In & Booking Interface"
Cohesion: 0.09
Nodes (19): CustomerHeader(), BookingInterfaceProps, buildGoogleCalendarUrl(), BusinessHeader(), ConfirmationStep(), ConfirmationStepProps, CustomerDetailsStep(), CustomerDetailsStepProps (+11 more)

### Community 21 - "Appointments Store & Filters"
Cohesion: 0.14
Nodes (17): AppointmentFiltersProps, getBusinessByOwnerId(), AppointmentsState, useAppointmentsStore, useAppointmentsStoreBase, AuthState, useAuthStoreBase, BusinessesState (+9 more)

### Community 22 - "Services & Reviews Hooks"
Cohesion: 0.23
Nodes (15): useRefreshBusiness(), Reviews(), ServiceCard(), formatDuration(), formatPrice(), useServiceDialog(), useServices(), Services() (+7 more)

### Community 23 - "Customers Page Components"
Cohesion: 0.13
Nodes (18): BlockCustomerDialog(), CustomerAppointmentsDialog(), CustomerCard(), EmptyState(), Customers(), formatCustomerName(), useCustomerAppointments(), RecentAppointmentsSection() (+10 more)

### Community 24 - "QA Report Findings"
Cohesion: 0.15
Nodes (22): Accessibility Mode Toggle Is a No-Op (BUG-15), Analytics Date Filter Mismatch (BUG-40 / BUG-6), Browser Back Exits Booking Wizard (BUG-22), 93-Bug Inventory and Severity Split, Bundle Size Analysis (BUG-54 to BUG-57), Default 404 and Public Debug Route (BUG-84 / BUG-92), Dialog and ARIA Accessibility Gaps (BUG-11 / BUG-32), Radix Dialog Focus Trap (Positive Finding) (+14 more)

### Community 25 - "shadcn Component Registry"
Cohesion: 0.10
Nodes (19): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+11 more)

### Community 26 - "Server Root Routers & Login"
Cohesion: 0.16
Nodes (12): businessesRouter, actionsRouter, SLogin(), init(), dataRouter, auth, verifyToken(), initSnapshot() (+4 more)

### Community 27 - "Product Requirements & Types"
Cohesion: 0.14
Nodes (17): Client App Router Layout, Manually Synced Shared Types, NotificationType, NotificationType, Automatic Reminders and Confirmations, Business Admin Dashboard, Definition of Done, Design Guidelines (queue motif, 3-click booking) (+9 more)

### Community 28 - "Architecture Overview Docs"
Cohesion: 0.15
Nodes (10): Server In-Memory Cache Strategy, Keepqueue Platform (CLAUDE.md overview), Key Code Conventions, Two Sub-Projects Claim (client + server), Keepqueue Client (README), Client Project Structure, Client Tech Stack (Next.js 16, TanStack Query, GSAP), Server Tech Stack (Express, TypeScript, Firebase, Zod) (+2 more)

### Community 29 - "Server Runtime Dependencies"
Cohesion: 0.12
Nodes (17): core, express, helmet, dependencies, axios, core, express, helmet (+9 more)

### Community 30 - "Firestore Snapshot Parsers"
Cohesion: 0.18
Nodes (11): checkConditions(), snapshotDocument(), OnSnapshotCallback, OnSnapshotConfig, OnSnapshotConfigDocument, OnSnapshotParsers, Snapshot, SnapshotDocument (+3 more)

### Community 31 - "Server TypeScript Config"
Cohesion: 0.12
Nodes (16): compilerOptions, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames, module, outDir, resolveJsonModule, rootDir (+8 more)

### Community 32 - "Edit Details UI Cards"
Cohesion: 0.28
Nodes (13): BasicInformationCard(), languageOptions, LogoUploadCard(), NoBusinessCard(), normalizeTimeValue(), OwnerInformationCard(), PolicySettingsCard(), timeInputRegExp (+5 more)

### Community 33 - "Calendar Helper Utilities"
Cohesion: 0.23
Nodes (10): EventColor, getAllEventsForDay(), getEventsForDay(), getSpanningEventsForDay(), isMultiDayEvent(), sortEvents(), EventVisibilityOptions, EventVisibilityResult (+2 more)

### Community 34 - "Services Actions API"
Cohesion: 0.20
Nodes (13): servicesRouter, CreateServiceModel, createServiceSchema, dailyTimeRangeSchema, DeleteServiceModel, deleteServiceSchema, operationScheduleSchema, UpdateServiceModel (+5 more)

### Community 35 - "Silent Firestore Failures"
Cohesion: 0.25
Nodes (14): BUG-50: Firestore Operations Fail Silently, useBookingState(), WaitlistForm(), deleteDocument(), getAllDocuments(), getUserByEmail(), getUserByIdentifier(), getUserByPhone() (+6 more)

### Community 36 - "Analytics Page & KPIs"
Cohesion: 0.22
Nodes (10): Analytics(), getKpiCards(), KpiCard(), KpiCardProps, PeriodSelector(), PeriodSelectorProps, TopServicesCard(), TopServicesCardProps (+2 more)

### Community 37 - "Booking Interface State"
Cohesion: 0.14
Nodes (11): BusinessDisplay, CustomerInfo, DateOption, TODO: replace it with api call to get business data, TimeOption, ApiError, ApiResponse, extractErrorMessage() (+3 more)

### Community 38 - "Server Dev Dependencies"
Cohesion: 0.13
Nodes (15): devDependencies, nodemon, ts-node, @types/cors, @types/express, @types/lodash, @types/node, typescript (+7 more)

### Community 39 - "Staff Actions API"
Cohesion: 0.24
Nodes (11): CreateStaffModel, createStaffSchema, dailyTimeRangeSchema, DeleteStaffModel, deleteStaffSchema, operationScheduleSchema, UpdateStaffModel, updateStaffSchema (+3 more)

### Community 40 - "Monorepo Deploy Scripts"
Cohesion: 0.13
Nodes (14): description, name, private, scripts, deploy, deploy:client, deploy:rollback, deploy:rules (+6 more)

### Community 41 - "Waitlist Actions API"
Cohesion: 0.24
Nodes (10): waitlistRouter, AddToWaitlistModel, addToWaitlistSchema, DeleteFromWaitlistModel, deleteFromWaitlistSchema, SAddToWaitlist(), SDeleteFromWaitlist(), ownsBusiness() (+2 more)

### Community 42 - "Firebase Auth & Session"
Cohesion: 0.17
Nodes (5): waitForFirebaseAuth(), { db, auth, storage, app, googleLoginProvider }, FirebaseInitResult, FileTooLargeError, getFileUrlFromStorage()

### Community 43 - "Data-Layer Security Findings"
Cohesion: 0.26
Nodes (13): addAuditRecord(), uploadFileToStorage(), Base64 Logo Storage in Firestore (BUG-46 / BUG-47), Client-Side Firestore Direct Writes (BUG-37), Concurrent Booking Race Condition (BUG-43), Error Handling Patterns Review (BUG-49 / BUG-50 / BUG-58), Missing Firestore Security Rules (BUG-42), getCollectionSchema Prototype Pollution Risk (BUG-66) (+5 more)

### Community 44 - "Client UI Dependencies"
Cohesion: 0.18
Nodes (11): class-variance-authority, date-fns, dependencies, class-variance-authority, date-fns, @radix-ui/react-select, @radix-ui/react-separator, @tanstack/react-query (+3 more)

### Community 45 - "Appointment Field Mismatch"
Cohesion: 0.42
Nodes (9): eventId vs calendarEventId Contract Mismatch, cancelAppointment(), confirmAppointment(), updateAppointmentStatus(), useAppointmentActions(), CustomerDashboardPage(), apiCall(), Customer Dashboard Unreachable (BUG-30) (+1 more)

### Community 46 - "Business Config Loader"
Cohesion: 0.29
Nodes (5): BusinessConfig(), getBusinessById(), useBusiness(), Config(), BusinessHomePageProps

### Community 47 - "Toast Notification UI"
Cohesion: 0.20
Nodes (9): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+1 more)

### Community 48 - "Agenda View & Localization"
Cohesion: 0.25
Nodes (7): AgendaView(), AgendaViewProps, CalendarLocalizationContext, CalendarLocalizationContextValue, CalendarLocalizationProvider(), CalendarLocalizationProviderProps, getAgendaEventsForDay()

### Community 49 - "Sheet UI Primitive"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 50 - "Client ESLint Config"
Cohesion: 0.22
Nodes (8): extends, rules, react-hooks/exhaustive-deps, react/no-unescaped-entities, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, next/core-web-vitals, next/typescript

### Community 51 - "Client-Server Contract Docs"
Cohesion: 0.25
Nodes (8): Client to Server Communication Contract, RouterService Handler Pattern, Server Route Structure (documented endpoint list), serverUrl, Server API Route Mounts (/, /actions, /data), PowerShell Deploy Script, Keepqueue Server (README), requireBusinessOwnership()

### Community 52 - "Dashboard Overview Sections"
Cohesion: 0.29
Nodes (5): BusinessDetailsSections(), QuickActionsSection(), StatsSection(), WelcomeSection(), DashboardOverview()

### Community 53 - "Server Package Metadata"
Cohesion: 0.29
Nodes (6): author, description, license, main, name, version

### Community 54 - "Customers Data Hooks"
Cohesion: 0.53
Nodes (4): getCustomerInitials(), getUserById(), useCustomers(), getDocumentById()

### Community 55 - "Server NPM Scripts"
Cohesion: 0.40
Nodes (5): scripts, build, deploy, start, startjs

### Community 56 - "Host Deploy Script"
Cohesion: 0.83
Nodes (3): die(), log(), deploy.sh script

## Ambiguous Edges - Review These
- `confirmAppointment()` → `eventId vs calendarEventId Contract Mismatch`  [AMBIGUOUS]
  graphify-out/memory/query_20260830_185710_what_is_the_exact_relationship_between_createappoi.md · relation: references
- `cancelAppointment()` → `eventId vs calendarEventId Contract Mismatch`  [AMBIGUOUS]
  graphify-out/memory/query_20260830_185710_what_is_the_exact_relationship_between_createappoi.md · relation: references
- `useAppointmentsStore` → `Client Zustand State (three persisted stores)`  [AMBIGUOUS]
  CLAUDE.md · relation: references
- `NotificationType` → `Manually Synced Shared Types`  [AMBIGUOUS]
  CLAUDE.md · relation: references
- `createAppointmentSchema` → `BUG-1: Confirm Appointment 400 (eventId vs calendarEventId)`  [AMBIGUOUS]
  graphify-out/memory/query_20260830_185710_what_is_the_exact_relationship_between_createappoi.md · relation: references
- `authGuard()` → `Server Route Structure (documented endpoint list)`  [AMBIGUOUS]
  CLAUDE.md · relation: references
- `requireBusinessOwnership()` → `Server Route Structure (documented endpoint list)`  [AMBIGUOUS]
  CLAUDE.md · relation: references
- `rateLimiter()` → `Server Route Structure (documented endpoint list)`  [AMBIGUOUS]
  CLAUDE.md · relation: references
- `BUG-5: Calendar View Switcher Dropdown Doesn't Open` → `BUG-11: DialogContent Missing DialogTitle (Accessibility)`  [AMBIGUOUS]
  bugs.md · relation: conceptually_related_to
- `BUG-18: LCP Logo Image Missing loading=eager` → `BUG-47: Logo Stored as Base64 in Firestore`  [AMBIGUOUS]
  bugs.md · relation: conceptually_related_to
- `BUG-19: Duplicate Service Names on Booking Page` → `BUG-80: Booking Page Shows No Services`  [AMBIGUOUS]
  bugs.md · relation: conceptually_related_to
- `Keepqueue Platform (CLAUDE.md overview)` → `Client Tech Stack (Next.js 16, TanStack Query, GSAP)`  [AMBIGUOUS]
  keepqueue-client/README.md · relation: references
- `Client to Server Communication Contract` → `serverUrl`  [AMBIGUOUS]
  CLAUDE.md · relation: references
- `Client to Server Communication Contract` → `Keepqueue Server (README)`  [AMBIGUOUS]
  keepqueue-server/README.md · relation: references

## Knowledge Gaps
- **330 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unused-vars`, `react-hooks/exhaustive-deps` (+325 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `confirmAppointment()` and `eventId vs calendarEventId Contract Mismatch`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `cancelAppointment()` and `eventId vs calendarEventId Contract Mismatch`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `useAppointmentsStore` and `Client Zustand State (three persisted stores)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `NotificationType` and `Manually Synced Shared Types`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `createAppointmentSchema` and `BUG-1: Confirm Appointment 400 (eventId vs calendarEventId)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `authGuard()` and `Server Route Structure (documented endpoint list)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `requireBusinessOwnership()` and `Server Route Structure (documented endpoint list)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._