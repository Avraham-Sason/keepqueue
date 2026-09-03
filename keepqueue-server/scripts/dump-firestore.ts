/**
 * Read-only snapshot of every collection to a single JSON file, as a restore point before a
 * destructive script runs.
 *
 *   cd keepqueue-server && npx ts-node scripts/dump-firestore.ts <output-file>
 *
 * The file contains real user records — keep it off the repo and delete it when done.
 */
import fs from "fs";
import { db } from "../src/firebase";
import { firestoreCollections } from "../src/types";

const run = async () => {
    const target = process.argv[2];
    if (!target) {
        console.error("usage: ts-node scripts/dump-firestore.ts <output-file>");
        process.exit(1);
    }

    const dump: Record<string, Record<string, unknown>> = {};
    let total = 0;

    for (const collection of firestoreCollections) {
        const snap = await db.collection(collection).get();
        dump[collection] = {};
        snap.docs.forEach((doc) => {
            dump[collection][doc.id] = doc.data();
            total++;
        });
        console.log(`${collection.padEnd(20)} ${snap.size}`);
    }

    fs.writeFileSync(target, JSON.stringify(dump, null, 2));
    console.log(`\nwrote ${total} documents to ${target}`);
    process.exit(0);
};

run().catch((error) => {
    console.error("dump-firestore failed:", error);
    process.exit(1);
});
