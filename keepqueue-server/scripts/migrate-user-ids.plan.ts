/**
 * The decision half of scripts/migrate-user-ids.ts, kept free of any Firebase import so it
 * can be exercised without credentials. See migrate-user-ids.check.ts.
 */

export type UserRow = { id: string; email?: string };
export type Move = { oldId: string; newId: string; email: string };
export type Plan = { moves: Move[]; alreadyCorrect: string[]; needsAttention: string[] };

export const REFERENCES: { collection: string; field: string }[] = [
    { collection: "businesses", field: "ownerId" },
    { collection: "calendar", field: "userId" },
    { collection: "waitlist", field: "userId" },
    { collection: "reviews", field: "userId" },
];

/**
 * Decides what moves where. Anything ambiguous is refused rather than guessed: a document
 * with no matching Auth account, two documents claiming one uid, or a target id that is
 * already occupied all land in needsAttention and are left untouched.
 *
 * @param docs        every users document, in any order
 * @param uidByEmail  lowercased email -> Auth uid, for the accounts that exist
 * @param existingIds every users document id, used to detect an occupied target
 */
export const planMigration = (docs: UserRow[], uidByEmail: Map<string, string>, existingIds: Set<string>): Plan => {
    const moves: Move[] = [];
    const alreadyCorrect: string[] = [];
    const needsAttention: string[] = [];
    const claimedUid = new Map<string, string>();

    for (const doc of docs) {
        const email = String(doc.email ?? "").trim().toLowerCase();

        if (!email) {
            needsAttention.push(`${doc.id} — document has no email, cannot be matched to an Auth account`);
            continue;
        }

        const uid = uidByEmail.get(email);
        if (!uid) {
            needsAttention.push(`${doc.id} (${email}) — no Firebase Auth account with this email`);
            continue;
        }

        if (uid === doc.id) {
            alreadyCorrect.push(doc.id);
            continue;
        }

        const clash = claimedUid.get(uid);
        if (clash) {
            needsAttention.push(`${doc.id} (${email}) — uid ${uid} already claimed by doc ${clash}; resolve by hand`);
            continue;
        }

        if (existingIds.has(uid)) {
            needsAttention.push(`${doc.id} (${email}) — users/${uid} already exists; resolve by hand`);
            continue;
        }

        claimedUid.set(uid, doc.id);
        moves.push({ oldId: doc.id, newId: uid, email });
    }

    return { moves, alreadyCorrect, needsAttention };
};
