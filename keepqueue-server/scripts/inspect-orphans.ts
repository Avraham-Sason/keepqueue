/**
 * Read-only. Shows what the users documents with no Firebase Auth account are attached to,
 * so the id migration can be applied knowing what stays behind.
 *
 *   cd keepqueue-server && npx ts-node scripts/inspect-orphans.ts
 */
import { auth, db } from "../src/firebase";

const REFERENCES: { collection: string; field: string }[] = [
    { collection: "businesses", field: "ownerId" },
    { collection: "calendar", field: "userId" },
    { collection: "waitlist", field: "userId" },
    { collection: "reviews", field: "userId" },
];

const run = async () => {
    const snapshot = await db.collection("users").get();

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const email = String(data.email ?? "").trim().toLowerCase();
        const authUser = email ? await auth.getUserByEmail(email).catch(() => null) : null;

        const counts: string[] = [];
        for (const { collection, field } of REFERENCES) {
            const refs = await db.collection(collection).where(field, "==", doc.id).get();
            if (refs.size) counts.push(`${collection}.${field}=${refs.size}`);
        }

        console.log(
            [
                authUser ? "HAS-AUTH " : "NO-AUTH  ",
                doc.id.padEnd(30),
                String(data.type ?? "?").padEnd(9),
                email.padEnd(26),
                counts.length ? counts.join(" ") : "(no references)",
            ].join(" ")
        );
    }

    console.log("\n--- businesses ---");
    const businesses = await db.collection("businesses").get();
    for (const b of businesses.docs) {
        const ownerId = b.data().ownerId;
        const owner = ownerId ? await db.collection("users").doc(ownerId).get() : null;
        const events = await db.collection("calendar").where("businessId", "==", b.id).get();
        const services = await db.collection("services").where("businessId", "==", b.id).get();
        console.log(
            `${b.id.padEnd(24)} ${String(b.data().name ?? "?").padEnd(22)} owner=${String(ownerId).padEnd(24)} ownerDocExists=${!!owner?.exists} services=${services.size} events=${events.size}`
        );
    }

    process.exit(0);
};

run().catch((error) => {
    console.error("inspect-orphans failed:", error);
    process.exit(1);
});
