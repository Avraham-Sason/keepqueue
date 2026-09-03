/**
 * Confirms the deployed firestore.rules did not lock the real accounts out.
 *
 *   cd keepqueue-server && npx ts-node scripts/verify-live-login.ts
 *
 * The rules permit users/{userId} only when the document id equals the caller's uid, so a
 * profile keyed any other way becomes unreadable by its own owner the moment they are
 * published. This reads each account's profile the way the client does — by uid, with that
 * user's own token — against production.
 */
import { auth } from "../src/firebase";

const WEB_KEY = process.env.NEXT_PUBLIC_API_KEY;
const PROJECT = process.env.NEXT_PUBLIC_PROJECT_ID;

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

/** Reads through the REST API as that user, so the deployed rules are what answers. */
const readOwnProfile = async (uid: string, idToken: string) => {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
    return { status: res.status, body: (await res.json()) as any };
};

const run = async () => {
    if (!WEB_KEY || !PROJECT) {
        console.error("NEXT_PUBLIC_API_KEY / NEXT_PUBLIC_PROJECT_ID missing");
        process.exit(1);
    }

    const users = (await auth.listUsers(1000)).users;
    console.log(`checking ${users.length} account(s) against the deployed rules\n`);

    for (const user of users) {
        const token = await idTokenFor(user.uid);
        const own = await readOwnProfile(user.uid, token);
        const ok = own.status === 200 && !!own.body?.fields;
        if (!ok) failures++;
        console.log(`${ok ? "PASS" : "FAIL"}  ${String(user.email).padEnd(26)} reads its own profile   HTTP ${own.status}`);

        // The same token must not reach anybody else's profile.
        const other = users.find((u) => u.uid !== user.uid);
        if (other) {
            const nosy = await readOwnProfile(other.uid, token);
            const denied = nosy.status === 403 || nosy.status === 404;
            if (!denied) failures++;
            console.log(`${denied ? "PASS" : "FAIL"}  ${String(user.email).padEnd(26)} cannot read another     HTTP ${nosy.status}`);
        }
    }

    console.log(failures ? `\n${failures} check(s) failed — accounts are locked out` : "\nevery account can still sign in and read only itself");
    process.exit(failures ? 1 : 0);
};

run().catch((error) => {
    console.error("verify-live-login failed:", error);
    process.exit(1);
});
