/**
 * Read-only. Confirms the operator account is actually wired: the Firebase custom claim is
 * what authGuard("admin") trusts, and the users document is what routes the client to /admin.
 *
 *   cd keepqueue-server && npx ts-node scripts/verify-admin.ts [email]
 */
import { auth, db } from "../src/firebase";

const run = async () => {
    const email = (process.argv[2] ?? "").trim().toLowerCase();

    const listed = await auth.listUsers(1000);
    const admins = listed.users.filter((u) => u.customClaims?.admin === true);

    console.log(`Firebase Auth users: ${listed.users.length}`);
    console.log(`with admin claim:    ${admins.length}\n`);

    for (const user of admins) {
        const doc = await db.collection("users").doc(user.uid).get();
        const data = doc.data();
        console.log(`uid   ${user.uid}`);
        console.log(`email ${user.email}`);
        console.log(`claim admin=${user.customClaims?.admin}`);
        console.log(`doc   exists=${doc.exists} type=${data?.type ?? "-"} idFieldMatchesUid=${data?.id === user.uid}`);
        console.log(`ready ${doc.exists && data?.type === "admin" ? "YES" : "NO — client will not route to /admin"}\n`);
    }

    if (email) {
        const target = await auth.getUserByEmail(email).catch(() => null);
        console.log(target ? `lookup ${email} -> ${target.uid} claims=${JSON.stringify(target.customClaims ?? {})}` : `lookup ${email} -> not found`);
    }

    if (!admins.length) console.error("No account carries the admin claim — /admin will return 403.");
    process.exit(0);
};

run().catch((error) => {
    console.error("verify-admin failed:", error);
    process.exit(1);
});
