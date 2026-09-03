/**
 * Self-check for the two pure rules that keep one caller from emptying a business calendar.
 * No framework, no Firebase, no credentials.
 *
 *   cd keepqueue-server && npm run check:appointment-rules
 */
import assert from "node:assert/strict";
import { durationMismatch, DURATION_SLACK_MS } from "../src/actions/businesses/appointments/helpers";

const MIN = 60 * 1000;
const start = Date.UTC(2026, 8, 2, 9, 0, 0);

// The real client sends end = start + durationMin, so the exact case must pass.
assert.equal(durationMismatch(start, start + 30 * MIN, 30), false);
assert.equal(durationMismatch(start, start + 45 * MIN, 45), false);

// Clock skew between browser and server must not reject a legitimate booking.
assert.equal(durationMismatch(start, start + 30 * MIN + DURATION_SLACK_MS, 30), false);
assert.equal(durationMismatch(start, start + 30 * MIN - DURATION_SLACK_MS, 30), false);

// Anything beyond the slack is a mismatch, in both directions.
assert.equal(durationMismatch(start, start + 30 * MIN + DURATION_SLACK_MS + 1, 30), true);
assert.equal(durationMismatch(start, start + 25 * MIN, 30), true, "too short by more than the slack");

// The attack this exists to stop: a 30-minute service booked as a 90-day block.
assert.equal(durationMismatch(start, start + 90 * 24 * 60 * MIN, 30), true);

// A zero-length or inverted range is never a valid booking either.
assert.equal(durationMismatch(start, start, 30), true);
assert.equal(durationMismatch(start, start - 30 * MIN, 30), true);

// Only the business may declare itself closed. Mirrors requireOwnerForNonBookingEvent.
const isPlainBooking = (type?: string, source?: string) =>
    (type === undefined || type === "APPOINTMENT") && (source === undefined || source === "web");

assert.equal(isPlainBooking("APPOINTMENT", "web"), true, "a normal booking needs no ownership");
assert.equal(isPlainBooking(undefined, undefined), true, "omitted fields default to a normal booking");
assert.equal(isPlainBooking("VACATION", "web"), false, "a vacation is the business's own act");
assert.equal(isPlainBooking("HOLIDAY", "web"), false);
assert.equal(isPlainBooking("OTHER", "web"), false);
assert.equal(isPlainBooking("APPOINTMENT", "admin"), false, "source admin claims the business acted");
assert.equal(isPlainBooking("APPOINTMENT", "import"), false);

console.log("appointment rules: all checks passed");
