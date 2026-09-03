/**
 * End-to-end check that the /data/* routes cannot be used to read other people's records.
 *
 *   cd keepqueue-server && npx ts-node scripts/probe-data-scoping.ts
 *
 * Signs in as each role with a custom token (no passwords) and asserts the outcome of every
 * probe. Exits non-zero on the first failure. Requires the server on localhost:9000.
 */
import { auth } from "../src/firebase";

const API = "http://localhost:9000";
const WEB_KEY = process.env.NEXT_PUBLIC_API_KEY;

let failures = 0;

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

const post = async (path: string, body: unknown, idToken?: string) => {
    const res = await fetch(`${API}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(idToken ? { authorization: `bearer ${idToken}` } : {}) },
        body: JSON.stringify(body),
    });
    return { status: res.status, body: (await res.json().catch(() => ({}))) as any };
};

const check = (label: string, pass: boolean, detail: string) => {
    if (!pass) failures++;
    console.log(`${pass ? "PASS" : "FAIL"}  ${label.padEnd(58)} ${detail}`);
};

const run = async () => {
    if (!WEB_KEY) {
        console.error("NEXT_PUBLIC_API_KEY missing");
        process.exit(1);
    }
    const users = (await auth.listUsers(1000)).users;
    const owner = users.find((u) => u.email === "avi@biz.com")!;
    const customer = users.find((u) => u.email === "noa@customer.com")!;
    const ownerTok = await idTokenFor(owner.uid);
    const customerTok = await idTokenFor(customer.uid);

    // The general "query any collection" endpoint is gone, not merely restricted.
    const dumpUsers = await post("/data/getCollection", { collectionName: "users" }, customerTok);
    check("getCollection is removed", dumpUsers.status === 404, `HTTP ${dumpUsers.status}`);

    // The replacement is scoped by token, and the body cannot widen it.
    const mine = await post("/data/getMyAppointments", {}, customerTok);
    const onlyMine = Array.isArray(mine.body.data) && mine.body.data.every((e: any) => e.userId === customer.uid);
    check("getMyAppointments returns only the caller's events", mine.status === 200 && onlyMine, `${mine.body.data?.length} events`);

    const ownerMine = await post("/data/getMyAppointments", {}, ownerTok);
    const ownerOnly = Array.isArray(ownerMine.body.data) && ownerMine.body.data.every((e: any) => e.userId === owner.uid);
    check("...and is per-caller, not global", ownerMine.status === 200 && ownerOnly, `${ownerMine.body.data?.length} events`);

    const anon = await post("/data/getMyAppointments", {});
    check("getMyAppointments rejects anonymous", anon.status === 401, `HTTP ${anon.status}`);

    // A customer must not be able to read another account.
    const nosy = await post("/data/getUserById", { userId: owner.uid }, customerTok);
    check("customer cannot read another user", nosy.status === 403, `HTTP ${nosy.status}`);

    const self = await post("/data/getUserById", { userId: customer.uid }, customerTok);
    check("customer can read themselves", self.status === 200 && self.body.data?.id === customer.uid, `HTTP ${self.status}`);

    // The owner may read their own customer, but only the fields they need.
    const asOwner = await post("/data/getUserById", { userId: customer.uid }, ownerTok);
    const trimmed = asOwner.body.data && !("businessIds" in asOwner.body.data) && !("contacts" in asOwner.body.data);
    check("owner reads own customer, projection trimmed", asOwner.status === 200 && trimmed, `keys=${Object.keys(asOwner.body.data ?? {}).length}`);

    console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
    process.exit(failures ? 1 : 0);
};

run().catch((error) => {
    console.error("probe failed:", error);
    process.exit(1);
});
