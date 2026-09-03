/**
 * Deletes one Firebase Auth account by email, but only after proving nothing points at it.
 *
 *   cd keepqueue-server
 *   npx ts-node scripts/delete-auth-user.ts test@example.com            # dry run
 *   npx ts-node scripts/delete-auth-user.ts test@example.com --apply
 *
 * Aborts if the account still has a users document or is referenced by any record, so this
 * can only ever remove a genuinely detached account.
 */
import { auth, db } from "../src/firebase";

const REFERENCES: { collection: string; field: string }[] = [
    { collection: "businesses", field: "ownerId" },
    { collection: "calendar", field: "userId" },
    { collection: "waitlist", field: "userId" },
    { collection: "reviews", field: "userId" },
    { collection: "audits", field: "userId" },
];

const run = async () => {
    const email = (process.argv[2] ?? "").trim().toLowerCase();
    const apply = process.argv.includes("--apply");

    if (!email) {
        console.error("usage: ts-node scripts/delete-auth-user.ts <email> [--apply]");
        process.exit(1);
    }

    const user = await auth.getUserByEmail(email).catch(() => null);
    if (!user) {
        console.log(`No Firebase Auth account for ${email} — nothing to do.`);
        process.exit(0);
    }
    console.log(`found ${email} -> ${user.uid}`);

    if (user.customClaims && Object.keys(user.customClaims).length) {
        console.error(`ABORT: account carries custom claims ${JSON.stringify(user.customClaims)}`);
        process.exit(1);
    }

    const profile = await db.collection("users").doc(user.uid).get();
    if (profile.exists) {
        console.error(`ABORT: users/${user.uid} exists — this account is in use, not a leftover.`);
        process.exit(1);
    }
    console.log(`users/${user.uid}: no profile document`);

    let referenced = 0;
    for (const { collection, field } of REFERENCES) {
        const snap = await db.collection(collection).where(field, "==", user.uid).get();
        if (snap.size) {
            console.error(`ABORT: ${snap.size} document(s) in ${collection} reference this uid via ${field}`);
            referenced += snap.size;
        }
    }
    if (referenced) process.exit(1);
    console.log("no references in businesses, calendar, waitlist, reviews or audits");

    if (!apply) {
        console.log("\nDry run complete. Re-run with --apply to delete the account.");
        process.exit(0);
    }

    await auth.deleteUser(user.uid);
    console.log(`\ndeleted Firebase Auth account ${user.uid} (${email})`);
    process.exit(0);
};

run().catch((error) => {
    console.error("delete-auth-user failed:", error);
    process.exit(1);
});
