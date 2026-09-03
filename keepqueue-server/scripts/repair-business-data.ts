/**
 * Recomputes each business's public rating from the reviews that actually exist, and repairs
 * invalid currency codes.
 *
 *   cd keepqueue-server && npx ts-node scripts/repair-business-data.ts          # dry run
 *   cd keepqueue-server && npx ts-node scripts/repair-business-data.ts --apply
 *
 * The seeded business carries ratingAvg 4.8 / ratingCount 210 with no reviews behind it. Those
 * numbers are rendered on the public booking page and in the marketplace, so they are a claim
 * to strangers that the product cannot support. firestore.rules now stops a business writing
 * them by hand; this fixes what was written before that.
 */
import { db } from "../src/firebase";

const ISO_4217 = new Set(["ILS", "USD", "EUR", "GBP"]);
const CURRENCY_TYPOS: Record<string, string> = { INS: "ILS", NIS: "ILS", "₪": "ILS", SHEKEL: "ILS" };

const run = async () => {
    const apply = process.argv.includes("--apply");
    console.log(apply ? "MODE: apply\n" : "MODE: dry run (pass --apply to write)\n");

    const [businesses, reviews] = await Promise.all([db.collection("businesses").get(), db.collection("reviews").get()]);

    const byBusiness = new Map<string, number[]>();
    for (const doc of reviews.docs) {
        const data = doc.data();
        if (data.flagged) continue;
        const list = byBusiness.get(data.businessId) ?? [];
        list.push(Number(data.rating));
        byBusiness.set(data.businessId, list);
    }

    const updates: { id: string; name: string; changes: Record<string, unknown>; because: string[] }[] = [];

    for (const doc of businesses.docs) {
        const data = doc.data();
        const ratings = byBusiness.get(doc.id) ?? [];
        const count = ratings.length;
        const average = count ? Math.round((ratings.reduce((a, b) => a + b, 0) / count) * 100) / 100 : 0;

        const changes: Record<string, unknown> = {};
        const because: string[] = [];

        if ((data.ratingCount ?? 0) !== count || (data.ratingAvg ?? 0) !== average) {
            changes.ratingCount = count;
            changes.ratingAvg = average;
            because.push(`rating ${data.ratingAvg ?? 0}/${data.ratingCount ?? 0} -> ${average}/${count} (${count} real reviews)`);
        }

        const currency = String(data.currency ?? "").toUpperCase();
        if (currency && !ISO_4217.has(currency)) {
            const fixed = CURRENCY_TYPOS[currency] ?? "ILS";
            changes.currency = fixed;
            because.push(`currency ${data.currency} -> ${fixed}`);
        }

        if (Object.keys(changes).length) updates.push({ id: doc.id, name: data.name, changes, because });
    }

    console.log(`businesses: ${businesses.size}, reviews: ${reviews.size}, needing repair: ${updates.length}\n`);
    for (const u of updates) console.log(`  ${u.name} (${u.id})\n    ${u.because.join("\n    ")}`);

    if (!updates.length) {
        console.log("\nNothing to do.");
        process.exit(0);
    }
    if (!apply) {
        console.log("\nDry run complete. Re-run with --apply to write.");
        process.exit(0);
    }

    for (const u of updates) {
        await db.collection("businesses").doc(u.id).update(u.changes);
        console.log(`updated ${u.id}`);
    }
    console.log("\nRepair complete.");
    process.exit(0);
};

run().catch((error) => {
    console.error("repair-business-data failed:", error);
    process.exit(1);
});
