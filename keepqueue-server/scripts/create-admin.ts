/**
 * One-off: promote (or create) the single operator account.
 *
 *   cd keepqueue-server
 *   npx ts-node scripts/create-admin.ts admin@keepqueue.com 'a-long-password'
 *
 * Run against an existing account, a password argument replaces its password and signs out
 * every session. This is the operator's only recovery path: keepqueue.com has no MX record,
 * so the "forgot password" email to admin@keepqueue.com is never delivered.
 *
 * Admin authority lives in the Firebase custom claim, not in the users document — the
 * document is writable by its own owner, the claim is writable only by the Admin SDK.
 * The document is still written so the client can route the session to /admin.
 *
 * The operator must sign out and back in (or wait for a token refresh) before the new
 * claim appears in their ID token.
 */
import { auth, db, firebaseTimestamp } from "../src/firebase";

const run = async () => {
    const [email, password] = process.argv.slice(2);

    if (!email) {
        console.error("usage: ts-node scripts/create-admin.ts <email> [password]");
        process.exit(1);
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await auth.getUserByEmail(normalizedEmail).catch(() => null);

    if (!user) {
        if (!password) {
            console.error(`No account for ${normalizedEmail}. Pass a password to create one.`);
            process.exit(1);
        }
        user = await auth.createUser({ email: normalizedEmail, password, displayName: "Keepqueue Admin" });
        console.log(`created auth user ${user.uid}`);
    } else if (password) {
        user = await auth.updateUser(user.uid, { password });
        await auth.revokeRefreshTokens(user.uid);
        console.log(`found existing auth user ${user.uid}; password replaced, all sessions signed out`);
    } else {
        console.log(`found existing auth user ${user.uid}`);
    }

    await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), admin: true });
    console.log("set custom claim admin=true");

    const now = firebaseTimestamp();
    const existingDoc = await db.collection("users").doc(user.uid).get();

    await db
        .collection("users")
        .doc(user.uid)
        .set(
            {
                id: user.uid,
                email: normalizedEmail,
                phone: "",
                firstName: "Keepqueue",
                lastName: "Admin",
                type: "admin",
                isActive: true,
                contacts: { sms: false, email: true },
                photoURL: "",
                created: existingDoc.exists ? existingDoc.data()?.created ?? now : now,
                timestamp: now,
            },
            { merge: true }
        );

    console.log(`users/${user.uid} written with type=admin`);
    console.log("\nDone. Sign out and back in so the new claim lands in the ID token.");
    process.exit(0);
};

run().catch((error) => {
    console.error("create-admin failed:", error);
    process.exit(1);
});
