/**
 * The counterpart to probe-calendar-dos: proves the new guards did not break a real booking.
 * Books the way the browser books, reschedules it, cancels it, then removes the test event.
 *
 *   cd keepqueue-server && npx ts-node scripts/probe-booking-happy-path.ts
 */
import { auth, db } from "../src/firebase";

const API = "http://localhost:9000";
const WEB_KEY = process.env.NEXT_PUBLIC_API_KEY;
const BUSINESS_ID = "GPajiLlPDRwWaJwNvWoz";

let failures = 0;
let eventId: string | undefined;

const idTokenFor = async (uid: string) => {
    const customToken = await auth.createCustomToken(uid);
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${WEB_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    });
    return (await res.json() as any).idToken as string;
};

const post = async (path: string, body: unknown, token: string) => {
    const res = await fetch(`${API}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `bearer ${token}` },
        body: JSON.stringify(body),
    });
    return { status: res.status, body: (await res.json().catch(() => ({}))) as any };
};

const mustSucceed = (label: string, status: number, body: any) => {
    const ok = status === 200 && body?.success === true;
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${label.padEnd(48)} HTTP ${status} ${ok ? "" : JSON.stringify(body)}`);
    return ok;
};

const run = async () => {
    const users = (await auth.listUsers(1000)).users;
    const customer = users.find((u) => u.email === "noa@customer.com")!;
    const token = await idTokenFor(customer.uid);

    // Book into a free slot the server itself offered, so the test is not fighting real data.
    const avail = await fetch(`${API}/data/getAvailabilityByServiceId`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: (await db.collection("services").where("businessId", "==", BUSINESS_ID).where("active", "==", true).limit(1).get()).docs[0].id }),
    });
    const availBody: any = await avail.json();
    const service = (await db.collection("services").where("businessId", "==", BUSINESS_ID).where("active", "==", true).limit(1).get()).docs[0];
    const durationMs = (service.data().durationMin as number) * 60000;

    const slots: any[] = availBody?.data?.availability ?? availBody?.data ?? [];
    const slot = slots.find((s: any) => {
        const startMs = (s.start?._seconds ?? s.start?.seconds) * 1000;
        const endMs = (s.end?._seconds ?? s.end?.seconds) * 1000;
        return endMs - startMs >= durationMs && startMs > Date.now() + 60000;
    });
    if (!slot) {
        console.error("no free slot offered — cannot test the happy path");
        process.exit(1);
    }
    const start = (slot.start._seconds ?? slot.start.seconds) * 1000;

    const created = await post(
        "/actions/businesses/appointments/create",
        { businessId: BUSINESS_ID, userId: customer.uid, serviceId: service.id, start, end: start + durationMs, source: "web", type: "APPOINTMENT" },
        token
    );
    mustSucceed("customer books a normal appointment", created.status, created.body);
    eventId = created.body?.data?.calendarEventId;

    if (eventId) {
        const moved = await post(
            "/actions/businesses/appointments/reschedule",
            { calendarEventId: eventId, start: start + 7 * 24 * 60 * 60 * 1000, end: start + 7 * 24 * 60 * 60 * 1000 + durationMs },
            token
        );
        mustSucceed("customer reschedules it a week out", moved.status, moved.body);

        const cancelled = await post("/actions/businesses/appointments/cancel", { calendarEventId: eventId }, token);
        mustSucceed("customer cancels it", cancelled.status, cancelled.body);

        await db.collection("calendar").doc(eventId).delete();
        console.log(`cleaned up test event ${eventId}`);
    }

    console.log(failures ? `\n${failures} step(s) failed — the guards broke a real booking` : "\nhappy path intact");
    process.exit(failures ? 1 : 0);
};

run().catch(async (error) => {
    if (eventId) await db.collection("calendar").doc(eventId).delete().catch(() => undefined);
    console.error("probe failed:", error);
    process.exit(1);
});
