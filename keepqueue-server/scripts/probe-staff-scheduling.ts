/**
 * Per-staff scheduling: two staff must be able to hold the same hour, one must not be booked
 * twice, and a business-wide block must still stop everyone.
 *
 *   cd keepqueue-server && npx ts-node scripts/probe-staff-scheduling.ts
 *
 * Creates two temporary staff members and removes them, and every event it makes, on the way out.
 *
 * Run this on its own. The probes book real slots and delete them again, and the server reads
 * availability from a cache the Firestore listener fills a moment later — so two probes run
 * back to back can see each other's leftovers and fail for reasons that have nothing to do with
 * the code under test.
 */
import { auth, db, firebaseTimestamp } from "../src/firebase";

const API = "http://localhost:9000";
const WEB_KEY = process.env.NEXT_PUBLIC_API_KEY;
const BUSINESS_ID = "GPajiLlPDRwWaJwNvWoz";

let failures = 0;
const events = new Set<string>();
const staffIds: string[] = [];

const check = (label: string, ok: boolean, detail = "") => {
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${label.padEnd(58)} ${detail}`);
};

const idTokenFor = async (uid: string) => {
    const t = await auth.createCustomToken(uid);
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${WEB_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t, returnSecureToken: true }),
    });
    return (await res.json() as any).idToken as string;
};

const post = async (path: string, body: unknown, token?: string) => {
    const res = await fetch(`${API}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { authorization: `bearer ${token}` } : {}) },
        body: JSON.stringify(body),
    });
    const parsed = (await res.json().catch(() => ({}))) as any;
    if (parsed?.data?.calendarEventId) events.add(parsed.data.calendarEventId);
    return { status: res.status, body: parsed };
};

const cleanup = async () => {
    for (const id of events) await db.collection("calendar").doc(id).delete().catch(() => undefined);
    for (const id of staffIds) await db.collection("staff").doc(id).delete().catch(() => undefined);
};

const run = async () => {
    const users = (await auth.listUsers(1000)).users;
    const owner = users.find((u) => u.email === "avi@biz.com")!;
    const customer = users.find((u) => u.email === "noa@customer.com")!;
    const ownerTok = await idTokenFor(owner.uid);
    const customerTok = await idTokenFor(customer.uid);

    const service = (await db.collection("services").where("businessId", "==", BUSINESS_ID).where("active", "==", true).limit(1).get()).docs[0];
    const durationMs = (service.data().durationMin as number) * 60000;

    const now = firebaseTimestamp();
    for (const name of ["ProbeStaffOne", "ProbeStaffTwo"]) {
        const ref = db.collection("staff").doc();
        await ref.set({
            id: ref.id,
            businessId: BUSINESS_ID,
            firstName: name,
            lastName: "Test",
            role: "employee",
            isActive: true,
            operationSchedule: [],
            serviceIds: [],
            created: now,
            timestamp: now,
        });
        staffIds.push(ref.id);
    }
    // The server reads staff from its in-memory cache, which the snapshot listener fills.
    await new Promise((r) => setTimeout(r, 4000));

    const avail = await post("/data/getAvailabilityByServiceId", { serviceId: service.id });
    const slots: any[] = avail.body?.data ?? [];
    const slot = slots.find((s) => {
        const a = (s.start._seconds ?? s.start.seconds) * 1000;
        const b = (s.end._seconds ?? s.end.seconds) * 1000;
        return b - a >= durationMs && a > Date.now() + 120000;
    });
    if (!slot) throw new Error("no free slot offered");
    const start = (slot.start._seconds ?? slot.start.seconds) * 1000;
    const base = { businessId: BUSINESS_ID, userId: customer.uid, serviceId: service.id, source: "web", type: "APPOINTMENT", start, end: start + durationMs };

    const first = await post("/actions/businesses/appointments/create", { ...base, staffId: staffIds[0] }, customerTok);
    check("first staff member takes the slot", first.status === 200, `HTTP ${first.status} ${first.body?.error ?? ""}`);

    const second = await post("/actions/businesses/appointments/create", { ...base, staffId: staffIds[1] }, ownerTok);
    check("second staff member takes the SAME slot", second.status === 200, `HTTP ${second.status} ${second.body?.error ?? ""}`);

    const third = await post("/actions/businesses/appointments/create", { ...base, staffId: staffIds[0] }, ownerTok);
    check("the first is not booked twice", third.status >= 400, `HTTP ${third.status} ${third.body?.error ?? ""}`);

    const auto = await post("/actions/businesses/appointments/create", base, ownerTok);
    check("with both busy, auto-assignment refuses", auto.status >= 400, `HTTP ${auto.status} ${auto.body?.error ?? ""}`);

    const stored = first.body?.data?.calendarEventId ? (await db.collection("calendar").doc(first.body.data.calendarEventId).get()).data() : null;
    check("the booking records which staff member it is for", stored?.staffId === staffIds[0], `staffId=${stored?.staffId}`);

    // A business-wide closure carries no staffId and must stop everybody.
    const blockStart = start + 3 * 24 * 60 * 60 * 1000;
    const block = await post(
        "/actions/businesses/appointments/create",
        { businessId: BUSINESS_ID, userId: owner.uid, type: "VACATION", source: "admin", start: blockStart, end: blockStart + 2 * 60 * 60 * 1000 },
        ownerTok
    );
    if (block.status === 200) {
        const during = await post("/actions/businesses/appointments/create", { ...base, start: blockStart, end: blockStart + durationMs, staffId: staffIds[0] }, ownerTok);
        check("a business-wide block stops every staff member", during.status >= 400, `HTTP ${during.status} ${during.body?.error ?? ""}`);
    } else {
        check("a business-wide block stops every staff member", false, `block itself failed: HTTP ${block.status} ${block.body?.error ?? ""}`);
    }

    await cleanup();
    console.log(`cleaned up ${events.size} event(s) and ${staffIds.length} staff record(s)`);
    console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
    process.exit(failures ? 1 : 0);
};

run().catch(async (error) => {
    await cleanup();
    console.error("probe failed:", error);
    process.exit(1);
});
