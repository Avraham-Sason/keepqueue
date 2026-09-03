/**
 * Self-check for who gets told about a freed slot. No framework, no Firebase, no credentials.
 *
 *   cd keepqueue-server && npm run check:waitlist
 *
 * Getting this wrong is not a crash — it is emailing the wrong customers, or nobody.
 */
import assert from "node:assert/strict";
import { Timestamp } from "firebase-admin/firestore";
import { matchesFreedSlot } from "../src/notifications/waitlist";
import { CalendarEvent, WaitItem } from "../src/types";

const NOW = Date.UTC(2026, 8, 2, 12, 0, 0);
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const freed = (over: Partial<CalendarEvent> = {}): CalendarEvent =>
    ({
        id: "evt",
        businessId: "biz",
        userId: "someone",
        serviceId: "svc",
        type: "APPOINTMENT",
        status: "CANCELLED",
        title: "Cut",
        start: Timestamp.fromMillis(NOW + 2 * DAY),
        end: Timestamp.fromMillis(NOW + 2 * DAY + HOUR),
        created: Timestamp.fromMillis(NOW),
        timestamp: Timestamp.fromMillis(NOW),
        ...over,
    }) as CalendarEvent;

const waiting = (over: Partial<WaitItem> = {}): WaitItem =>
    ({
        id: "w1",
        businessId: "biz",
        userId: "cust",
        serviceId: "svc",
        preferredWindow: { from: Timestamp.fromMillis(NOW), to: Timestamp.fromMillis(NOW + 7 * DAY) },
        priority: 0,
        expiresAt: Timestamp.fromMillis(NOW + 30 * DAY),
        created: Timestamp.fromMillis(NOW),
        timestamp: Timestamp.fromMillis(NOW),
        ...over,
    }) as WaitItem;

// The case the feature exists for: same business, same service, slot inside the window.
assert.equal(matchesFreedSlot(waiting(), freed(), NOW), true);

// Another business's cancellation is none of this customer's business.
assert.equal(matchesFreedSlot(waiting({ businessId: "other" }), freed(), NOW), false);

// Waiting for a haircut does not mean wanting a massage.
assert.equal(matchesFreedSlot(waiting({ serviceId: "other" }), freed(), NOW), false);

// An expired entry is not a queue member any more.
assert.equal(matchesFreedSlot(waiting({ expiresAt: Timestamp.fromMillis(NOW - HOUR) }), freed(), NOW), false);

// Outside the window the customer said they could make — offering it would be spam.
assert.equal(matchesFreedSlot(waiting({ preferredWindow: { from: Timestamp.fromMillis(NOW), to: Timestamp.fromMillis(NOW + DAY) } }), freed(), NOW), false);
assert.equal(
    matchesFreedSlot(waiting({ preferredWindow: { from: Timestamp.fromMillis(NOW + 5 * DAY), to: Timestamp.fromMillis(NOW + 9 * DAY) } }), freed(), NOW),
    false
);

// The whole appointment must fit: a window ending mid-slot is not a match.
assert.equal(
    matchesFreedSlot(waiting({ preferredWindow: { from: Timestamp.fromMillis(NOW), to: Timestamp.fromMillis(NOW + 2 * DAY + HOUR / 2) } }), freed(), NOW),
    false,
    "a window that cuts the slot in half is not a match"
);

// Exactly touching the window edges counts — the customer said they were free until then.
assert.equal(
    matchesFreedSlot(
        waiting({ preferredWindow: { from: Timestamp.fromMillis(NOW + 2 * DAY), to: Timestamp.fromMillis(NOW + 2 * DAY + HOUR) } }),
        freed(),
        NOW
    ),
    true
);

// A freed block with no service (a vacation the business withdrew) is open to anyone waiting.
assert.equal(matchesFreedSlot(waiting(), freed({ serviceId: undefined }), NOW), true);

console.log("waitlist matching: all checks passed");
