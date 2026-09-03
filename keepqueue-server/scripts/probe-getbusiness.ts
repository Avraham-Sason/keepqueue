/**
 * End-to-end check of the /data/getBusiness split: the same request is made anonymously, as a
 * customer, and as the owner, and the three payloads are compared.
 *
 *   cd keepqueue-server && npx ts-node scripts/probe-getbusiness.ts <businessId>
 *
 * Sign-in uses a short-lived custom token minted by the Admin SDK and exchanged for an ID
 * token, so no password is involved. Requires the server running on localhost:9000.
 */
import { auth } from "../src/firebase";

const API = "http://localhost:9000";
const WEB_KEY = process.env.NEXT_PUBLIC_API_KEY;

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

const getBusiness = async (businessId: string, idToken?: string) => {
    const res = await fetch(`${API}/data/getBusiness`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(idToken ? { authorization: `bearer ${idToken}` } : {}) },
        body: JSON.stringify({ businessId }),
    });
    return { status: res.status, body: (await res.json()) as any };
};

const describe = (label: string, status: number, data: any) => {
    if (!data) {
        console.log(`${label.padEnd(10)} HTTP ${status}  (no data)`);
        return;
    }
    const counts = ["services", "calendar", "reviews", "waitlist", "customers", "staff", "messageTemplates", "availability"]
        .map((k) => `${k}=${Array.isArray(data[k]) ? data[k].length : "?"}`)
        .join(" ");
    const blob = JSON.stringify(data);
    const leaks = ["avi@biz.com", "noa@customer.com"].filter((n) => blob.includes(n));
    console.log(`${label.padEnd(10)} HTTP ${status}  ${counts}`);
    console.log(`${"".padEnd(10)} ownerId=${JSON.stringify(data.ownerId)}  emailsVisible=${leaks.length ? leaks.join(",") : "none"}`);
};

const run = async () => {
    const businessId = process.argv[2];
    if (!businessId || !WEB_KEY) {
        console.error("usage: ts-node scripts/probe-getbusiness.ts <businessId>   (needs NEXT_PUBLIC_API_KEY)");
        process.exit(1);
    }

    const users = (await auth.listUsers(1000)).users;
    const owner = users.find((u) => u.email === "avi@biz.com");
    const customer = users.find((u) => u.email === "noa@customer.com");
    if (!owner || !customer) {
        console.error("expected avi@biz.com and noa@customer.com to exist");
        process.exit(1);
    }

    const anon = await getBusiness(businessId);
    describe("anonymous", anon.status, anon.body.data);

    const asCustomer = await getBusiness(businessId, await idTokenFor(customer.uid));
    describe("customer", asCustomer.status, asCustomer.body.data);

    const asOwner = await getBusiness(businessId, await idTokenFor(owner.uid));
    describe("owner", asOwner.status, asOwner.body.data);

    const ownerData = asOwner.body.data;
    const ok =
        ownerData &&
        ownerData.customers.length > 0 &&
        ownerData.calendar.length > 0 &&
        ownerData.calendar.some((e: any) => e.user) &&
        anon.body.data.customers.length === 0 &&
        anon.body.data.calendar.length === 0;
    console.log(`\nowner still gets the full record, anonymous does not: ${ok ? "PASS" : "FAIL"}`);
    process.exit(ok ? 0 : 1);
};

run().catch((error) => {
    console.error("probe failed:", error);
    process.exit(1);
});
