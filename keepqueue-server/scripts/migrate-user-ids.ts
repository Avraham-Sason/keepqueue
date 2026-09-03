/**
 * One-off: re-key every users document so its document id is the Firebase Auth uid.
 *
 *   cd keepqueue-server
 *   npx ts-node scripts/migrate-user-ids.ts            # dry run, changes nothing
 *   npx ts-node scripts/migrate-user-ids.ts --apply    # perform the migration
 *
 * Why: the client used to create profiles with addDoc(), which assigns a random id, while
 * every server check resolves users by Auth uid (authGuard, requireBusinessOwnership,
 * requireSelfOrBusinessOwner, requireRecordAccess) and firestore.rules only permits
 * users/{userId} when userId == request.auth.uid. Documents keyed by anything else are
 * invisible to the server and unreadable by their own owner.
 *
 * Run this BEFORE deploying firestore.rules. It rewrites the references that point at the
 * old id: businesses.ownerId, calendar.userId, waitlist.userId, reviews.userId.
 *
 * The decision logic lives in ./migrate-user-ids.plan and is covered by
 * migrate-user-ids.check.ts — this destructive half decides nothing on its own.
 */
import { auth, db } from "../src/firebase";
import { planMigration, REFERENCES } from "./migrate-user-ids.plan";
import type { UserRow } from "./migrate-user-ids.plan";

const run = async () => {
    const apply = process.argv.includes("--apply");
    console.log(apply ? "MODE: apply\n" : "MODE: dry run (pass --apply to write)\n");

    const snapshot = await db.collection("users").get();
    const docs: UserRow[] = snapshot.docs.map((d) => ({ id: d.id, email: d.data().email }));
    const existingIds = new Set(docs.map((d) => d.id));

    const uidByEmail = new Map<string, string>();
    for (const doc of docs) {
        const email = String(doc.email ?? "").trim().toLowerCase();
        if (!email || uidByEmail.has(email)) continue;
        const authUser = await auth.getUserByEmail(email).catch(() => null);
        if (authUser) uidByEmail.set(email, authUser.uid);
    }

    const plan = planMigration(docs, uidByEmail, existingIds);

    console.log(`already correct: ${plan.alreadyCorrect.length}`);
    console.log(`to migrate:      ${plan.moves.length}`);
    console.log(`needs attention: ${plan.needsAttention.length}\n`);

    for (const move of plan.moves) console.log(`  ${move.email}: ${move.oldId} -> ${move.newId}`);
    if (plan.needsAttention.length) {
        console.log("\nNOT migrated:");
        for (const line of plan.needsAttention) console.log(`  ${line}`);
    }

    if (!plan.moves.length) {
        console.log("\nNothing to do.");
        process.exit(0);
    }

    // Collect the references first so the dry run reports the true blast radius.
    const referenceWrites: { ref: FirebaseFirestore.DocumentReference; field: string; value: string }[] = [];
    for (const { collection, field } of REFERENCES) {
        for (const move of plan.moves) {
            const refs = await db.collection(collection).where(field, "==", move.oldId).get();
            for (const d of refs.docs) referenceWrites.push({ ref: d.ref, field, value: move.newId });
        }
    }
    console.log(`\nreferences to rewrite: ${referenceWrites.length}`);

    if (!apply) {
        console.log("\nDry run complete. Re-run with --apply to write.");
        process.exit(0);
    }

    for (const move of plan.moves) {
        const oldDoc = await db.collection("users").doc(move.oldId).get();
        if (!oldDoc.exists) continue;
        await db
            .collection("users")
            .doc(move.newId)
            .set({ ...oldDoc.data(), id: move.newId });
        console.log(`copied users/${move.oldId} -> users/${move.newId}`);
    }

    for (const write of referenceWrites) {
        await write.ref.update({ [write.field]: write.value });
    }
    console.log(`rewrote ${referenceWrites.length} references`);

    // Delete last: if anything above failed, the originals are still intact.
    for (const move of plan.moves) {
        await db.collection("users").doc(move.oldId).delete();
        console.log(`deleted users/${move.oldId}`);
    }

    console.log("\nMigration complete.");
    process.exit(0);
};

if (require.main === module) {
    run().catch((error) => {
        console.error("migrate-user-ids failed:", error);
        process.exit(1);
    });
}
