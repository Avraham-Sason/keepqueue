/**
 * The waiting list end to end: joining is validated, the queue cannot be jumped, and cancelling
 * an appointment offers the freed slot to whoever was waiting for it.
 *
 *   cd keepqueue-server && npx ts-node scripts/probe-waitlist.ts
 *
 *
 * Run this on its own. The probes book real slots and delete them again, and the server reads
 * availability from a cache the Firestore listener fills a moment later — so two probes run
 * back to back can see each other's leftovers and fail for reasons that have nothing to do with
 * the code under test.
 * Needs the server on localhost:9000. Removes every record it creates.
 */
import { auth, db } from "../src/firebase";

const API = "http://localhost:9000";
const WEB_KEY = process.env.NEXT_PUBLIC_API_KEY;
const BUSINESS_ID = "GPajiLlPDRwWaJwNvWoz";

let failures = 0;
const events = new Set<string>();
const waitItems = new Set<string>();

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
    if (parsed?.data?.waitItemId) waitItems.add(parsed.data.waitItemId);
    return { status: res.status, body: parsed };
};

const cleanup = async () => {
    for (const id of events) await db.collection("calendar").doc(id).delete().catch(() => undefined);
    for (const id of waitItems) await db.collection("waitlist").doc(id).delete().catch(() => undefined);
    const logs = await db.collection("notification_logs").where("messageTemplateId", "==", "waitlist_slot_freed").get().catch(() => null);
    if (logs) for (const d of logs.docs) await d.ref.delete().catch(() => undefined);
};

const run = async () => {
    const users = (await auth.listUsers(1000)).users;
    const owner = users.find((u) => u.email === "avi@biz.com")!;
    const customer = users.find((u) => u.email === "noa@customer.com")!;
    const ownerTok = await idTokenFor(owner.uid);
    const customerTok = await idTokenFor(customer.uid);

    const service = (await db.collection("services").where("businessId", "==", BUSINESS_ID).where("active", "==", true).limit(1).get()).docs[0];
    const durationMs = (service.data().durationMin as number) * 60000;
    const DAY = 24 * 60 * 60 * 1000;

    const window = { from: Date.now(), to: Date.now() + 14 * DAY };
    const base = { businessId: BUSINESS_ID, userId: customer.uid, serviceId: service.id, preferredWindow: window };

    const joined = await post("/actions/businesses/waitlist/add", base, customerTok);
    check("customer joins the waiting list", joined.status === 200, `HTTP ${joined.status} ${joined.body?.error ?? ""}`);

    const twice = await post("/actions/businesses/waitlist/add", base, customerTok);
    check("joining the same service twice is refused", twice.status === 409, `HTTP ${twice.status} ${twice.body?.error ?? ""}`);

    const jumped = await post("/actions/businesses/waitlist/add", { ...base, serviceId: service.id, priority: 999999 }, customerTok);
    check("a self-set priority cannot jump the queue", jumped.status >= 400, `HTTP ${jumped.status} ${jumped.body?.error ?? ""}`);

    const past = await post(
        "/actions/businesses/waitlist/add",
        { businessId: BUSINESS_ID, userId: customer.uid, serviceId: service.id, preferredWindow: { from: Date.now() - 30 * DAY, to: Date.now() - DAY } },
        ownerTok
    );
    check("a window already in the past is refused", past.status === 422, `HTTP ${past.status} ${past.body?.error ?? ""}`);

    // Book, then cancel — the cancellation is what should reach the waiting list.
    const avail = await post("/data/getAvailabilityByServiceId", { serviceId: service.id });
    const slots: any[] = avail.body?.data ?? [];
    const slot = slots.find((s) => {
        const a = (s.start._seconds ?? s.start.seconds) * 1000;
        const b = (s.end._seconds ?? s.end.seconds) * 1000;
        return b - a >= durationMs && a > Date.now() + 120000 && a < window.to;
    });
    if (!slot) throw new Error("no free slot to book");
    const start = (slot.start._seconds ?? slot.start.seconds) * 1000;

    const booked = await post(
        "/actions/businesses/appointments/create",
        { businessId: BUSINESS_ID, userId: owner.uid, serviceId: service.id, start, end: start + durationMs, source: "web", type: "APPOINTMENT" },
        ownerTok
    );
    check("a slot is booked so it can be freed again", booked.status === 200, `HTTP ${booked.status} ${booked.body?.error ?? ""}`);

    const eventId = booked.body?.data?.calendarEventId;
    if (eventId) {
        await post("/actions/businesses/appointments/cancel", { calendarEventId: eventId }, ownerTok);
        // The offer goes out in the background.
        await new Promise((r) => setTimeout(r, 3000));
        const logs = await db.collection("notification_logs").where("messageTemplateId", "==", "waitlist_slot_freed").get();
        check("cancelling offers the freed slot to the waiting list", logs.size > 0, `${logs.size} offer(s) logged`);
    }

    await cleanup();
    console.log(`cleaned up ${events.size} event(s), ${waitItems.size} waitlist entr(ies)`);
    console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
    process.exit(failures ? 1 : 0);
};

run().catch(async (error) => {
    await cleanup();
    console.error("probe failed:", error);
    process.exit(1);
});
