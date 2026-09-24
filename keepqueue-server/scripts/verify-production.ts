/**
 * Read-only verification of the deployed API. Writes nothing.
 *
 *   cd keepqueue-server && npx ts-node scripts/verify-production.ts
 *
 * The probe-*.ts scripts book and cancel real appointments and are meant for a local server.
 * This one only reads, so it is safe to point at production — which is why it exists separately.
 */
const API = process.env.API_BASE ?? "https://api.keepqueue.com";
const BUSINESS_ID = "GPajiLlPDRwWaJwNvWoz";

let failures = 0;
const check = (label: string, ok: boolean, detail = "") => {
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${label.padEnd(56)} ${detail}`);
};

const post = async (path: string, body: unknown) => {
    const res = await fetch(`${API}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    return { status: res.status, body: (await res.json().catch(() => ({}))) as any };
};

const run = async () => {
    console.log(`verifying ${API}\n`);

    const health = await fetch(`${API}/`);
    check("service answers", health.ok, `HTTP ${health.status}`);

    // The leak this release exists to close: an anonymous caller must get the public shape.
    const anon = await post("/data/getBusiness", { businessId: BUSINESS_ID });
    const data = anon.body?.data;
    const blob = JSON.stringify(data ?? {});
    check("getBusiness answers anonymously", anon.status === 200 && !!data, `HTTP ${anon.status}`);
    check("no customer list", Array.isArray(data?.customers) && data.customers.length === 0, `customers=${data?.customers?.length}`);
    check("no other people's appointments", Array.isArray(data?.calendar) && data.calendar.length === 0, `calendar=${data?.calendar?.length}`);
    check("no waitlist", Array.isArray(data?.waitlist) && data.waitlist.length === 0, `waitlist=${data?.waitlist?.length}`);
    check("ownerId withheld", data?.ownerId === "", `ownerId=${JSON.stringify(data?.ownerId)}`);
    check("no email address anywhere in the payload", !/@/.test(blob.replace(/"logoUrl":"[^"]*"/g, "")), "");
    check("services still served", Array.isArray(data?.services) && data.services.length > 0, `services=${data?.services?.length}`);
    check("availability still served", Array.isArray(data?.availability) && data.availability.length > 0, `slots=${data?.availability?.length}`);

    // The general query endpoint is gone, not merely restricted.
    const dump = await post("/data/getCollection", { collectionName: "users" });
    check("getCollection is removed", dump.status === 404, `HTTP ${dump.status}`);

    // Its replacement is scoped by token, so an anonymous caller gets nothing.
    const mine = await post("/data/getMyAppointments", {});
    check("getMyAppointments rejects anonymous", mine.status === 401, `HTTP ${mine.status}`);

    const nosy = await post("/data/getUserById", { userId: "someone-else" });
    check("getUserById rejects anonymous", nosy.status === 401, `HTTP ${nosy.status}`);

    // The marketplace is new in this release.
    const market = await post("/data/searchBusinesses", {});
    check("marketplace directory answers", market.status === 200 && Array.isArray(market.body?.data?.businesses), `total=${market.body?.data?.total}`);

    // Reviews are public but the reviewer is not.
    const reviews = await post("/data/getBusinessReviews", { businessId: BUSINESS_ID });
    const reviewBlob = JSON.stringify(reviews.body?.data ?? []);
    check("public reviews expose no reviewer contact", reviews.status === 200 && !/@|phone/.test(reviewBlob), `HTTP ${reviews.status}`);

    // A failure must not carry the Firestore project or document path.
    const bad = await post("/data/getBusiness", { businessId: "does-not-exist" });
    check("errors leak no internals", !/projects\/|\/databases\/|NOT_FOUND/.test(JSON.stringify(bad.body)), JSON.stringify(bad.body).slice(0, 60));

    console.log(failures ? `\n${failures} check(s) failed` : "\nproduction is serving the new build correctly");
    process.exit(failures ? 1 : 0);
};

run().catch((error) => {
    console.error("verification failed:", error);
    process.exit(1);
});
