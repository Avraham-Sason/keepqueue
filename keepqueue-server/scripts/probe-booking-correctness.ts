/**
 * Phase 4 end to end: the double-booking race, the appointment state machine, opening-hours
 * validation, and the blocked-customer rule.
 *
 *   cd keepqueue-server && npx ts-node scripts/probe-booking-correctness.ts
 *
 *
 * Run this on its own. The probes book real slots and delete them again, and the server reads
 * availability from a cache the Firestore listener fills a moment later — so two probes run
 * back to back can see each other's leftovers and fail for reasons that have nothing to do with
 * the code under test.
 * Needs the server on localhost:9000. Every event it creates is deleted again.
 */
import { auth, db } from "../src/firebase";

const API = "http://localhost:9000";
const WEB_KEY = process.env.NEXT_PUBLIC_API_KEY;
const BUSINESS_ID = "GPajiLlPDRwWaJwNvWoz";

let failures = 0;
const created = new Set<string>();

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

const post = async (path: string, body: unknown, token: string) => {
    const res = await fetch(`${API}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `bearer ${token}` },
        body: JSON.stringify(body),
    });
    const parsed = (await res.json().catch(() => ({}))) as any;
    if (parsed?.data?.calendarEventId) created.add(parsed.data.calendarEventId);
    return { status: res.status, body: parsed };
};

const freeSlot = async (serviceId: string, durationMs: number, skip = 0) => {
    const res = await fetch(`${API}/data/getAvailabilityByServiceId`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId }),
    });
    const slots: any[] = ((await res.json()) as any).data ?? [];
    const usable = slots.filter((s) => {
        const a = (s.start._seconds ?? s.start.seconds) * 1000;
        const b = (s.end._seconds ?? s.end.seconds) * 1000;
        return b - a >= durationMs && a > Date.now() + 120000;
    });
    const slot = usable[skip];
    if (!slot) throw new Error("no free slot available for the test");
    return (slot.start._seconds ?? slot.start.seconds) * 1000;
};

const run = async () => {
    const users = (await auth.listUsers(1000)).users;
    const owner = users.find((u) => u.email === "avi@biz.com")!;
    const customer = users.find((u) => u.email === "noa@customer.com")!;
    const ownerTok = await idTokenFor(owner.uid);
    const customerTok = await idTokenFor(customer.uid);

    const svcSnap = await db.collection("services").where("businessId", "==", BUSINESS_ID).where("active", "==", true).limit(1).get();
    const service = svcSnap.docs[0];
    const durationMs = (service.data().durationMin as number) * 60000;
    const base = { businessId: BUSINESS_ID, userId: customer.uid, serviceId: service.id, source: "web", type: "APPOINTMENT" };

    // ---- 4.1 double-booking race: fire the same slot twice at once ----
    const raceStart = await freeSlot(service.id, durationMs);
    const [a, b] = await Promise.all([
        post("/actions/businesses/appointments/create", { ...base, start: raceStart, end: raceStart + durationMs }, customerTok),
        post("/actions/businesses/appointments/create", { ...base, start: raceStart, end: raceStart + durationMs }, ownerTok),
    ]);
    const wins = [a, b].filter((r) => r.status === 200).length;
    check("two simultaneous bookings, exactly one wins", wins === 1, `${wins} succeeded (${a.status}/${b.status})`);

    const winner = a.status === 200 ? a : b;
    const eventId = winner.body?.data?.calendarEventId;

    // ---- 4.4 an overlap answers once, with a real status ----
    const dup = await post("/actions/businesses/appointments/create", { ...base, start: raceStart, end: raceStart + durationMs }, customerTok);
    // Either guard may catch it first: once the slot is taken it also leaves availability, so
    // the opening-hours check rejects with 422 before the transactional overlap check returns
    // 409. What matters is that it is refused once, with a real status, and never a 500.
    check("a taken slot is refused with a 4xx, not a 500", dup.status >= 400 && dup.status < 500, `HTTP ${dup.status} ${dup.body?.error ?? ""}`);

    // ---- 4.2 opening hours ----
    const threeAm = new Date();
    threeAm.setDate(threeAm.getDate() + 3);
    threeAm.setHours(3, 0, 0, 0);
    const night = await post(
        "/actions/businesses/appointments/create",
        { ...base, start: threeAm.getTime(), end: threeAm.getTime() + durationMs },
        customerTok
    );
    check("03:00 is refused as outside opening hours", night.status === 422, `HTTP ${night.status} ${night.body?.error ?? ""}`);

    // ---- 4.3 state machine ----
    if (eventId) {
        const confirmed = await post("/actions/businesses/appointments/confirm", { calendarEventId: eventId }, ownerTok);
        check("owner confirms a booked appointment", confirmed.status === 200, `HTTP ${confirmed.status}`);

        const twice = await post("/actions/businesses/appointments/confirm", { calendarEventId: eventId }, ownerTok);
        check("confirming an already-confirmed one is refused", twice.status >= 400, `HTTP ${twice.status} ${twice.body?.error ?? ""}`);

        const early = await post("/actions/businesses/appointments/updateStatus", { calendarEventId: eventId, status: "DONE" }, ownerTok);
        check("a future appointment cannot be marked DONE", early.status >= 400, `HTTP ${early.status} ${early.body?.error ?? ""}`);

        await db.collection("calendar").doc(eventId).update({ status: "DONE" });
        const reviveCancel = await post("/actions/businesses/appointments/cancel", { calendarEventId: eventId }, ownerTok);
        check("a completed appointment cannot be cancelled", reviveCancel.status >= 400, `HTTP ${reviveCancel.status} ${reviveCancel.body?.error ?? ""}`);

        const reviveConfirm = await post("/actions/businesses/appointments/confirm", { calendarEventId: eventId }, ownerTok);
        check("a completed appointment cannot be re-confirmed", reviveConfirm.status >= 400, `HTTP ${reviveConfirm.status}`);
    }

    // ---- 3.5 blocked customers cannot book ----
    await db.collection("users").doc(customer.uid).update({ blockedByBusinessIds: [BUSINESS_ID] });
    const blockedStart = await freeSlot(service.id, durationMs, 1);
    const blocked = await post("/actions/businesses/appointments/create", { ...base, start: blockedStart, end: blockedStart + durationMs }, customerTok);
    check("a blocked customer cannot book", blocked.status === 403, `HTTP ${blocked.status} ${blocked.body?.error ?? ""}`);

    const byOwner = await post("/actions/businesses/appointments/create", { ...base, start: blockedStart, end: blockedStart + durationMs }, ownerTok);
    check("the business can still book for them", byOwner.status === 200, `HTTP ${byOwner.status} ${byOwner.body?.error ?? ""}`);
    await db.collection("users").doc(customer.uid).update({ blockedByBusinessIds: [] });

    for (const id of created) await db.collection("calendar").doc(id).delete();
    console.log(`cleaned up ${created.size} event(s)`);
    console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
    process.exit(failures ? 1 : 0);
};

run().catch(async (error) => {
    for (const id of created) await db.collection("calendar").doc(id).delete().catch(() => undefined);
    await db.collection("users").doc((await auth.getUserByEmail("noa@customer.com")).uid).update({ blockedByBusinessIds: [] }).catch(() => undefined);
    console.error("probe failed:", error);
    process.exit(1);
});
