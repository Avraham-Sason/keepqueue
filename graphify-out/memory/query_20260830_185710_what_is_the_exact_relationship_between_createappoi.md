---
type: "query"
date: "2026-08-30T18:57:10.648918+00:00"
question: "What is the exact relationship between createAppointmentSchema and BUG-1: Confirm Appointment 400 - eventId vs calendarEventId?"
contributor: "graphify"
outcome: "corrected"
correction: "BUG-1 references confirmAppointmentSchema (schemes.ts:18), not createAppointmentSchema (schemes.ts:5)."
source_nodes: ["BUG-1: Confirm Appointment 400 — eventId vs calendarEventId", "createAppointmentSchema", "eventId vs calendarEventId Contract Mismatch", "confirmAppointment()", "validateBody()"]
---

# Q: What is the exact relationship between createAppointmentSchema and BUG-1: Confirm Appointment 400 - eventId vs calendarEventId?

## Answer

RESOLVED: the AMBIGUOUS edge BUG-1 --references--> createAppointmentSchema is WRONG. Verified against source: BUG-1's real target is confirmAppointmentSchema at keepqueue-server/src/actions/businesses/appointments/schemes.ts:18, which requires { calendarEventId }. createAppointmentSchema (schemes.ts:5) is a different endpoint (/create) and has no eventId/calendarEventId field at all. bugs.md names only the file, not the symbol, which is why extraction hedged. Root cause chain verified: keepqueue-client/app/business/appointments/helpers.ts:5 confirmAppointment sends { eventId }; router.ts:11 applies validateBody(confirmAppointmentSchema); middlewares/index.ts:22 validateBody returns HTTP 400 'Validation Error' on safeParse failure. Same defect in 3 client callers total: helpers.ts:5 (confirm, BUG-1), helpers.ts:9 (cancel, BUG-2), app/customer/dashboard/page.tsx:86 (customer cancel, BUG-29). A fourth caller, components/BookingInterface/hooks.ts:454, already sends calendarEventId correctly - proving the server contract is the correct side and the client is the broken side. Server is consistent: SConfirmAppointment/SCancelAppointment/SReschedule/SUpdateStatus all destructure calendarEventId. Fix is 3 one-line client edits, not a server change.

## Outcome

- Signal: corrected
- Correction: BUG-1 references confirmAppointmentSchema (schemes.ts:18), not createAppointmentSchema (schemes.ts:5).

## Source Nodes

- BUG-1: Confirm Appointment 400 — eventId vs calendarEventId
- createAppointmentSchema
- eventId vs calendarEventId Contract Mismatch
- confirmAppointment()
- validateBody()