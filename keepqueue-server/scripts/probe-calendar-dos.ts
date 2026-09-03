/**
 * Attempts, as an ordinary customer, every route to emptying a business's calendar.
 *
 *   cd keepqueue-server && npx ts-node scripts/probe-calendar-dos.ts
 *
 * Every probe must be rejected. Anything that gets written is deleted again so the check is
 * safe to re-run; a leftover would itself block the calendar it is testing.
 *
 * Run this on its own. The probes book real slots and delete them again, and the server reads
 * availability from a cache the Firestore listener fills a moment later — so two probes run
 * back to back can see each other's leftovers and fail for reasons that have nothing to do with
 * the code under test.
 */
import { auth, db } from "../src/firebase";

const API = "http://localhost:9000";
const WEB_KEY = process.env.NEXT_PUBLIC_API_KEY;
const BUSINESS_ID = "GPajiLlPDRwWaJwNvWoz";

let failures = 0;
const created: string[] = [];

const idTokenFor = async (uid: string) => {
    const customToken = await auth.createCustomToken(uid);
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${WEB_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    });
    const body: any = await res.json();
    if (!body.idToken) throw new Error(`token exchange failed: ${JSON.stringify(body)}`);
    return body.idToken as string;
};

const create = async (payload: Record<string, unknown>, idToken: string) => {
    const res = await fetch(`${API}/actions/businesses/appointments/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `bearer ${idToken}` },
        body: JSON.stringify(payload),
    });
    const body: any = await res.json().catch(() => ({}));
    if (body?.data?.calendarEventId) created.push(body.data.calendarEventId);
    return { status: res.status, body };
};

const mustReject = (label: string, status: number, body: any) => {
    const rejected = status >= 400 || body?.success === false;
    if (!rejected) failures++;
    console.log(`${rejected ? "PASS" : "FAIL"}  ${label.padEnd(56)} HTTP ${status} ${body?.error ?? ""}`);
};

const run = async () => {
    if (!WEB_KEY) {
        console.error("NEXT_PUBLIC_API_KEY missing");
        process.exit(1);
    }
    const users = (await auth.listUsers(1000)).users;
    const customer = users.find((u) => u.email === "noa@customer.com")!;
    const token = await idTokenFor(customer.uid);

    const DAY = 24 * 60 * 60 * 1000;
    const soon = Date.now() + DAY;
    const service = (await db.collection("services").where("businessId", "==", BUSINESS_ID).where("active", "==", true).limit(1).get()).docs[0];
    const serviceId = service.id;
    const durationMin = service.data().durationMin as number;

    const base = { businessId: BUSINESS_ID, userId: customer.uid, serviceId };

    let r = await create({ ...base, type: "VACATION", source: "web", start: soon, end: soon + 90 * DAY }, token);
    mustReject("customer cannot create a VACATION block", r.status, r.body);

    r = await create({ ...base, type: "HOLIDAY", source: "web", start: soon, end: soon + 30 * DAY }, token);
    mustReject("customer cannot create a HOLIDAY block", r.status, r.body);

    r = await create({ ...base, type: "OTHER", source: "web", start: soon, end: soon + 30 * DAY }, token);
    mustReject("customer cannot create an OTHER block", r.status, r.body);

    r = await create({ ...base, type: "APPOINTMENT", source: "admin", start: soon, end: soon + durationMin * 60000 }, token);
    mustReject("customer cannot claim source=admin", r.status, r.body);

    r = await create({ ...base, type: "APPOINTMENT", source: "web", start: soon, end: soon + 90 * DAY }, token);
    mustReject("customer cannot book a 90-day 'appointment'", r.status, r.body);

    r = await create({ ...base, type: "APPOINTMENT", source: "web", start: Date.now() - 30 * DAY, end: Date.now() - 30 * DAY + durationMin * 60000 }, token);
    mustReject("customer cannot book in the past", r.status, r.body);

    const otherService = (await db.collection("services").where("businessId", "!=", BUSINESS_ID).limit(1).get()).docs[0];
    if (otherService) {
        r = await create({ ...base, serviceId: otherService.id, type: "APPOINTMENT", source: "web", start: soon, end: soon + durationMin * 60000 }, token);
        mustReject("customer cannot book another business's service", r.status, r.body);
    }

    for (const id of created) {
        await db.collection("calendar").doc(id).delete();
        console.log(`cleaned up leaked event ${id}`);
    }

    console.log(failures ? `\n${failures} probe(s) were ACCEPTED — the hole is open` : "\nevery probe rejected");
    process.exit(failures ? 1 : 0);
};

run().catch((error) => {
    console.error("probe failed:", error);
    process.exit(1);
});
