/**
 * Self-check for the reminder window. No framework, no Firebase, no credentials.
 *
 *   cd keepqueue-server && npm run check:reminders
 *
 * The rule this protects: every upcoming appointment gets exactly one reminder, and nothing
 * else gets any. A window narrower than the sweep interval would drop appointments silently.
 */
import assert from "node:assert/strict";
import { Timestamp } from "firebase-admin/firestore";
import { dueForReminder } from "../src/notifications/reminders";
import { CalendarEvent } from "../src/types";

const NOW = Date.UTC(2026, 8, 2, 12, 0, 0);
const HOUR = 60 * 60 * 1000;

const event = (startMs: number, over: Partial<CalendarEvent> = {}): CalendarEvent =>
    ({
        id: "e1",
        businessId: "b1",
        userId: "u1",
        type: "APPOINTMENT",
        status: "BOOKED",
        title: "Cut",
        start: Timestamp.fromMillis(startMs),
        end: Timestamp.fromMillis(startMs + HOUR),
        created: Timestamp.fromMillis(NOW),
        timestamp: Timestamp.fromMillis(NOW),
        ...over,
    }) as CalendarEvent;

// Exactly a day out is the case the feature exists for.
assert.equal(dueForReminder(event(NOW + 24 * HOUR), NOW), true);

// Just inside the window on either side.
assert.equal(dueForReminder(event(NOW + 24 * HOUR - 5 * 60 * 1000), NOW), true, "slightly under a day still reminds");
assert.equal(dueForReminder(event(NOW + 23.75 * HOUR), NOW), true, "a sweep of lag is covered");
// The window opens at exactly 24h and closes 30 minutes later, exclusive at the far edge — the
// previous sweep already claimed anything sitting on that boundary.
assert.equal(dueForReminder(event(NOW + 23.5 * HOUR), NOW), false, "the far edge belongs to the earlier sweep");

// Too far out: it will be caught by a later sweep, not this one.
assert.equal(dueForReminder(event(NOW + 48 * HOUR), NOW), false);
assert.equal(dueForReminder(event(NOW + 25 * HOUR), NOW), false);

// Too close, or already past: reminding now would be noise.
assert.equal(dueForReminder(event(NOW + 2 * HOUR), NOW), false);
assert.equal(dueForReminder(event(NOW - 2 * HOUR), NOW), false);

// Only live appointments. A cancelled or finished one must never be reminded about.
for (const status of ["CANCELLED", "DONE", "NO_SHOW"] as const) {
    assert.equal(dueForReminder(event(NOW + 24 * HOUR, { status }), NOW), false, `${status} is not reminded`);
}
assert.equal(dueForReminder(event(NOW + 24 * HOUR, { status: "CONFIRMED" }), NOW), true, "confirmed is still reminded");

// A vacation block is not something anyone is reminded about.
for (const type of ["VACATION", "HOLIDAY", "OTHER"] as const) {
    assert.equal(dueForReminder(event(NOW + 24 * HOUR, { type }), NOW), false, `${type} is not an appointment`);
}

// No gap between consecutive sweeps: an appointment that is too far out now must still be due
// one sweep later, or it would never be reminded about at all.
const SWEEP = 15 * 60 * 1000;
const justTooFar = NOW + 24 * HOUR + SWEEP;
assert.equal(dueForReminder(event(justTooFar), NOW), false);
assert.equal(dueForReminder(event(justTooFar), NOW + SWEEP), true, "the next sweep catches it");

console.log("reminder window: all checks passed");
