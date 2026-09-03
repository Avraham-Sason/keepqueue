/**
 * Proves the block/unblock feature actually works now that it runs through the API, and that
 * the customer cannot undo it themselves.
 *
 *   cd keepqueue-server && npx ts-node scripts/probe-block-customer.ts
 *
 * Restores the original blocked state before exiting, whatever happens.
 */
import { auth, db } from "../src/firebase";

const API = "http://localhost:9000";
const WEB_KEY = process.env.NEXT_PUBLIC_API_KEY;
const BUSINESS_ID = "GPajiLlPDRwWaJwNvWoz";

let failures = 0;
const check = (label: string, ok: boolean, detail = "") => {
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${label.padEnd(52)} ${detail}`);
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

const post = async (path: string, body: unknown, token: string) => {
    const res = await fetch(`${API}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `bearer ${token}` },
        body: JSON.stringify(body),
    });
    return { status: res.status, body: (await res.json().catch(() => ({}))) as any };
};

const blockedIds = async (uid: string): Promise<string[]> =>
    ((await db.collection("users").doc(uid).get()).data()?.blockedByBusinessIds as string[]) ?? [];

const run = async () => {
    const users = (await auth.listUsers(1000)).users;
    const owner = users.find((u) => u.email === "avi@biz.com")!;
    const customer = users.find((u) => u.email === "noa@customer.com")!;
    const ownerTok = await idTokenFor(owner.uid);
    const customerTok = await idTokenFor(customer.uid);
    const original = await blockedIds(customer.uid);

    try {
        const blocked = await post("/actions/businesses/customers/block", { customerId: customer.uid, businessId: BUSINESS_ID }, ownerTok);
        check("owner blocks a customer", blocked.status === 200 && (await blockedIds(customer.uid)).includes(BUSINESS_ID), `HTTP ${blocked.status}`);

        const unblocked = await post("/actions/businesses/customers/unblock", { customerId: customer.uid, businessId: BUSINESS_ID }, ownerTok);
        check("owner unblocks the customer", unblocked.status === 200 && !(await blockedIds(customer.uid)).includes(BUSINESS_ID), `HTTP ${unblocked.status}`);

        const byCustomer = await post("/actions/businesses/customers/block", { customerId: customer.uid, businessId: BUSINESS_ID }, customerTok);
        check("a customer cannot block through the API", byCustomer.status === 403, `HTTP ${byCustomer.status}`);

        const otherBiz = (await db.collection("businesses").where("ownerId", "!=", owner.uid).limit(1).get()).docs[0];
        if (otherBiz) {
            const crossTenant = await post("/actions/businesses/customers/block", { customerId: customer.uid, businessId: otherBiz.id }, ownerTok);
            check("owner cannot block on another business's behalf", crossTenant.status === 403, `HTTP ${crossTenant.status}`);
        }
    } finally {
        await db.collection("users").doc(customer.uid).update({ blockedByBusinessIds: original });
        console.log(`restored blockedByBusinessIds to ${JSON.stringify(original)}`);
    }

    console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
    process.exit(failures ? 1 : 0);
};

run().catch((error) => {
    console.error("probe failed:", error);
    process.exit(1);
});
