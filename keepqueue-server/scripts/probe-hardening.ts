/**
 * Checks the §2.7 hardening against the running server: no internal detail in error responses,
 * a real ceiling on record creation, and a CORS refusal that is not a 500.
 *
 *   cd keepqueue-server && npx ts-node scripts/probe-hardening.ts
 */
import { auth, db } from "../src/firebase";

const API = "http://localhost:9000";
const WEB_KEY = process.env.NEXT_PUBLIC_API_KEY;
const BUSINESS_ID = "GPajiLlPDRwWaJwNvWoz";

let failures = 0;
const created: string[] = [];
const check = (label: string, ok: boolean, detail = "") => {
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${label.padEnd(56)} ${detail}`);
};

const idTokenFor = async (uid: string) => {
    const customToken = await auth.createCustomToken(uid);
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${WEB_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    });
    return (await res.json() as any).idToken as string;
};

const run = async () => {
    const users = (await auth.listUsers(1000)).users;
    const customer = users.find((u) => u.email === "noa@customer.com")!;
    const token = await idTokenFor(customer.uid);

    // A domain failure keeps its message and gets a real status, not a 500.
    const cancelMissing = await fetch(`${API}/actions/businesses/appointments/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `bearer ${token}` },
        body: JSON.stringify({ calendarEventId: "does-not-exist-at-all" }),
    });
    const cancelBody: any = await cancelMissing.json().catch(() => ({}));
    check("unknown appointment answers 4xx, not 500", cancelMissing.status >= 400 && cancelMissing.status < 500, `HTTP ${cancelMissing.status}`);

    // Nothing in an error body should name the Firestore project or a document path.
    const blob = JSON.stringify(cancelBody);
    const leaks = ["projects/", "/databases/", "NOT_FOUND:", db.databaseId ?? "___"].filter((n) => blob.includes(n));
    check("error body carries no internal detail", leaks.length === 0, blob.slice(0, 90));

    // The create ceiling is 10/min per uid; the 11th must be refused with 429.
    const service = (await db.collection("services").where("businessId", "==", BUSINESS_ID).where("active", "==", true).limit(1).get()).docs[0];
    const durationMs = (service.data().durationMin as number) * 60000;
    let sawRateLimit = false;
    for (let i = 0; i < 13; i++) {
        // Deliberately invalid times: the limiter runs before validation, so these never write.
        const res = await fetch(`${API}/actions/businesses/appointments/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json", authorization: `bearer ${token}` },
            body: JSON.stringify({
                businessId: BUSINESS_ID,
                userId: customer.uid,
                serviceId: service.id,
                start: Date.now() - 10 * 24 * 3600 * 1000,
                end: Date.now() - 10 * 24 * 3600 * 1000 + durationMs,
                source: "web",
                type: "APPOINTMENT",
            }),
        });
        const body: any = await res.json().catch(() => ({}));
        if (body?.data?.calendarEventId) created.push(body.data.calendarEventId);
        if (res.status === 429) {
            sawRateLimit = true;
            check("record creation is capped per account", true, `429 after ${i} requests`);
            break;
        }
    }
    if (!sawRateLimit) check("record creation is capped per account", false, "13 requests, never rate limited");

    // A disallowed browser origin is refused as CORS, not as a server crash.
    const badOrigin = await fetch(`${API}/data/getBusiness`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://keepqueue-evil-attacker.vercel.app" },
        body: JSON.stringify({ businessId: BUSINESS_ID }),
    });
    check("disallowed origin is not answered with 500", badOrigin.status !== 500, `HTTP ${badOrigin.status}`);
    check("disallowed origin gets no CORS grant", !badOrigin.headers.get("access-control-allow-origin"),
        String(badOrigin.headers.get("access-control-allow-origin")));

    for (const id of created) await db.collection("calendar").doc(id).delete();
    if (created.length) console.log(`cleaned up ${created.length} event(s)`);

    console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
    process.exit(failures ? 1 : 0);
};

run().catch((error) => {
    console.error("probe failed:", error);
    process.exit(1);
});
