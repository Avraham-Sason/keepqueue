/**
 * firestore.rules, exercised against the Firestore emulator.
 *
 *   cd rules-test && npm test
 *
 * Every case is written from the point of view of an actor: what an anonymous visitor, a
 * customer, a business owner and a second business owner may and may not do. Both directions
 * matter — a rule that blocks an attack and also blocks the product is not a fix.
 */
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const OWNER = "owner-uid";
const OTHER_OWNER = "other-owner-uid";
const CUSTOMER = "customer-uid";
const BIZ = "biz-1";
const OTHER_BIZ = "biz-2";

let passed = 0;
let failed = 0;

const testEnv = await initializeTestEnvironment({
    projectId: "keepqueue-rules-test",
    firestore: { rules: readFileSync("../firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
});

const seed = async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        await setDoc(doc(db, "businesses", BIZ), { id: BIZ, ownerId: OWNER, name: "Gamma", isActive: true, ratingAvg: 4, ratingCount: 2 });
        await setDoc(doc(db, "businesses", OTHER_BIZ), { id: OTHER_BIZ, ownerId: OTHER_OWNER, name: "Rival", isActive: true, ratingAvg: 1, ratingCount: 9 });
        await setDoc(doc(db, "users", CUSTOMER), { id: CUSTOMER, type: "customer", firstName: "Noa", email: "noa@x.com", businessIds: [BIZ], blockedByBusinessIds: [BIZ], notes: "no-shows a lot" });
        await setDoc(doc(db, "users", OWNER), { id: OWNER, type: "business", firstName: "Avi", email: "avi@x.com", ownedBusinessIds: [BIZ] });
        await setDoc(doc(db, "services", "svc-1"), { id: "svc-1", businessId: BIZ, name: "Cut", active: true, durationMin: 30 });
        await setDoc(doc(db, "staff", "staff-1"), { id: "staff-1", businessId: BIZ, firstName: "Dana", isActive: true });
        await setDoc(doc(db, "message_templates", "tpl-1"), { id: "tpl-1", businessId: BIZ, key: "reminder", content: "hi" });
        await setDoc(doc(db, "calendar", "evt-1"), { id: "evt-1", businessId: BIZ, userId: CUSTOMER, type: "APPOINTMENT", status: "BOOKED" });
    });
};

const as = (uid) => testEnv.authenticatedContext(uid).firestore();
const anon = () => testEnv.unauthenticatedContext().firestore();

const check = async (label, shouldPass, op) => {
    await seed();
    try {
        await (shouldPass ? assertSucceeds(op()) : assertFails(op()));
        console.log(`PASS  ${label}`);
        passed++;
    } catch (error) {
        console.log(`FAIL  ${label}\n        ${String(error).split("\n")[0]}`);
        failed++;
    }
};

// ---------------------------------------------------------------- the product must still work
await check("owner edits their business profile", true, () =>
    updateDoc(doc(as(OWNER), "businesses", BIZ), { name: "Gamma Fitness", phone: "+972", timestamp: 1 }));
await check("owner creates a service", true, () =>
    setDoc(doc(as(OWNER), "services", "svc-new"), { id: "svc-new", businessId: BIZ, name: "Massage", active: true }));
await check("owner soft-deletes a service", true, () =>
    updateDoc(doc(as(OWNER), "services", "svc-1"), { active: false }));
await check("owner edits staff", true, () =>
    updateDoc(doc(as(OWNER), "staff", "staff-1"), { firstName: "Dana B" }));
await check("owner creates a vacation block", true, () =>
    setDoc(doc(as(OWNER), "calendar", "vac-1"), { id: "vac-1", businessId: BIZ, userId: OWNER, type: "VACATION", status: "BOOKED" }));
await check("customer signs up (creates own profile)", true, () =>
    setDoc(doc(as("fresh-uid"), "users", "fresh-uid"), { id: "fresh-uid", type: "customer", email: "new@x.com", firstName: "New" }));
await check("customer edits their own name and phone", true, () =>
    updateDoc(doc(as(CUSTOMER), "users", CUSTOMER), { firstName: "Noa L", phone: "+9721", timestamp: 2 }));
await check("customer reads their own profile", true, () =>
    getDoc(doc(as(CUSTOMER), "users", CUSTOMER)));
await check("anyone reads a business and its services", true, async () => {
    await getDoc(doc(anon(), "businesses", BIZ));
    await getDocs(collection(anon(), "services"));
});

// ------------------------------------------------------------------ hole 1: self-write /users
await check("customer cannot unblock themselves", false, () =>
    updateDoc(doc(as(CUSTOMER), "users", CUSTOMER), { blockedByBusinessIds: [] }));
await check("customer cannot promote themselves to business", false, () =>
    updateDoc(doc(as(CUSTOMER), "users", CUSTOMER), { type: "business" }));
await check("customer cannot grant themselves a business", false, () =>
    updateDoc(doc(as(CUSTOMER), "users", CUSTOMER), { ownedBusinessIds: [BIZ] }));
await check("customer cannot rewrite the business's notes on them", false, () =>
    updateDoc(doc(as(CUSTOMER), "users", CUSTOMER), { notes: "model customer" }));
await check("customer cannot join a business by editing businessIds", false, () =>
    updateDoc(doc(as(CUSTOMER), "users", CUSTOMER), { businessIds: [BIZ, OTHER_BIZ] }));
await check("customer cannot read another profile", false, () =>
    getDoc(doc(as(CUSTOMER), "users", OWNER)));
await check("nobody can delete a profile", false, () =>
    deleteDoc(doc(as(CUSTOMER), "users", CUSTOMER)));

// ------------------------------------------------------- hole 2: cross-tenant theft/injection
await check("owner cannot move a rival's service into their business", false, () =>
    setDoc(doc(as(OWNER), "services", "svc-rival"), { id: "svc-rival", businessId: OTHER_BIZ, name: "x" }));
await check("owner cannot push their service into a rival's business", false, () =>
    updateDoc(doc(as(OWNER), "services", "svc-1"), { businessId: OTHER_BIZ }));
await check("owner cannot steal a rival's staff", false, () =>
    setDoc(doc(as(OTHER_OWNER), "staff", "staff-1"), { id: "staff-1", businessId: OTHER_BIZ, firstName: "Dana" }));
await check("owner cannot read a rival's staff", false, () =>
    getDoc(doc(as(OTHER_OWNER), "staff", "staff-1")));
await check("owner cannot retag a template into a rival's business", false, () =>
    updateDoc(doc(as(OWNER), "message_templates", "tpl-1"), { businessId: OTHER_BIZ }));

// ----------------------------------------------------------------- hole 3: /calendar create
await check("customer cannot write a calendar event directly", false, () =>
    setDoc(doc(as(CUSTOMER), "calendar", "evt-forged"), { id: "evt-forged", businessId: BIZ, userId: CUSTOMER, type: "APPOINTMENT", status: "CONFIRMED" }));
await check("customer cannot confirm their own appointment", false, () =>
    updateDoc(doc(as(CUSTOMER), "calendar", "evt-1"), { status: "CONFIRMED" }));
await check("customer cannot move their own appointment", false, () =>
    updateDoc(doc(as(CUSTOMER), "calendar", "evt-1"), { start: 1, end: 2 }));
await check("customer can still read their own appointment", true, () =>
    getDoc(doc(as(CUSTOMER), "calendar", "evt-1")));

// ------------------------------------------------------------- hole 4: /businesses field list
await check("owner cannot forge their public rating", false, () =>
    updateDoc(doc(as(OWNER), "businesses", BIZ), { ratingAvg: 5, ratingCount: 9999 }));
// Writing the value it already holds changes no keys, so the assertion has to flip it.
await check("owner cannot switch their business active state", false, () =>
    updateDoc(doc(as(OWNER), "businesses", BIZ), { isActive: false }));
await check("owner cannot hand their business to someone else", false, () =>
    updateDoc(doc(as(OWNER), "businesses", BIZ), { ownerId: OTHER_OWNER }));
await check("a stranger cannot edit a business", false, () =>
    updateDoc(doc(as(CUSTOMER), "businesses", BIZ), { name: "hacked" }));

await testEnv.cleanup();
console.log(`\n${passed} passed, ${failed} failed`);
assert.equal(failed, 0, "firestore.rules did not behave as intended");
