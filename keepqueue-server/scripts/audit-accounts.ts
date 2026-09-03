/**
 * Read-only. Cross-checks Firebase Auth accounts against users documents in both directions.
 *
 *   cd keepqueue-server && npx ts-node scripts/audit-accounts.ts
 *
 * An Auth account with no document can sign in and is then signed straight back out
 * ("authErrorProfileMissing"); a document with no Auth account can never be signed in as.
 */
import { auth, db } from "../src/firebase";

const run = async () => {
    const authUsers = (await auth.listUsers(1000)).users;
    const docs = await db.collection("users").get();
    const docById = new Map(docs.docs.map((d) => [d.id, d.data()]));

    console.log("--- Auth accounts ---");
    for (const user of authUsers) {
        const doc = docById.get(user.uid);
        console.log(
            [
                doc ? "OK      " : "NO-DOC  ",
                user.uid.padEnd(30),
                String(user.email ?? "-").padEnd(26),
                doc ? `type=${doc.type}` : "(cannot sign in: profile missing)",
            ].join(" ")
        );
    }

    const authUids = new Set(authUsers.map((u) => u.uid));
    const orphanDocs = docs.docs.filter((d) => !authUids.has(d.id));
    console.log(`\n--- users documents with no Auth account: ${orphanDocs.length} ---`);
    for (const d of orphanDocs) console.log(`  ${d.id} ${d.data().email ?? "-"}`);

    process.exit(0);
};

run().catch((error) => {
    console.error("audit-accounts failed:", error);
    process.exit(1);
});
