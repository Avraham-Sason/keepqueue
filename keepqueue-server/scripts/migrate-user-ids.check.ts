/**
 * Self-check for the users-id migration planner. No framework, no Firebase, no credentials.
 *
 *   cd keepqueue-server && npm run check:migration
 *
 * The migration deletes documents, so the rule it has to keep is: never move anything the
 * planner is not certain about.
 */
import assert from "node:assert/strict";
import { planMigration } from "./migrate-user-ids.plan";

const uids = (entries: [string, string][]) => new Map(entries);

// A legacy random-id document with a matching Auth account is the whole point.
{
    const plan = planMigration([{ id: "randomDocId", email: "Avi@Biz.com" }], uids([["avi@biz.com", "uid-avi"]]), new Set(["randomDocId"]));
    assert.deepEqual(plan.moves, [{ oldId: "randomDocId", newId: "uid-avi", email: "avi@biz.com" }]);
    assert.equal(plan.needsAttention.length, 0);
}

// Email matching is case- and whitespace-insensitive, or seeded accounts look like orphans.
{
    const plan = planMigration([{ id: "doc1", email: "  NOA@Customer.COM " }], uids([["noa@customer.com", "uid-noa"]]), new Set(["doc1"]));
    assert.equal(plan.moves.length, 1);
    assert.equal(plan.moves[0].newId, "uid-noa");
}

// A document already keyed by its uid must be left alone, not copied onto itself and deleted.
{
    const plan = planMigration([{ id: "uid-avi", email: "avi@biz.com" }], uids([["avi@biz.com", "uid-avi"]]), new Set(["uid-avi"]));
    assert.deepEqual(plan.moves, []);
    assert.deepEqual(plan.alreadyCorrect, ["uid-avi"]);
}

// No Auth account: refuse. Deleting here would destroy the only copy of the profile.
{
    const plan = planMigration([{ id: "doc1", email: "ghost@nowhere.com" }], uids([]), new Set(["doc1"]));
    assert.deepEqual(plan.moves, []);
    assert.equal(plan.needsAttention.length, 1);
}

// No email at all: refuse rather than guess.
{
    const plan = planMigration([{ id: "doc1" }, { id: "doc2", email: "   " }], uids([]), new Set(["doc1", "doc2"]));
    assert.deepEqual(plan.moves, []);
    assert.equal(plan.needsAttention.length, 2);
}

// Two documents sharing one email: migrate at most one, flag the rest. Migrating both would
// have the second overwrite the first and then delete both originals.
{
    const plan = planMigration(
        [
            { id: "docA", email: "dup@biz.com" },
            { id: "docB", email: "dup@biz.com" },
        ],
        uids([["dup@biz.com", "uid-dup"]]),
        new Set(["docA", "docB"])
    );
    assert.equal(plan.moves.length, 1);
    assert.equal(plan.needsAttention.length, 1);
    assert.match(plan.needsAttention[0], /already claimed/);
}

// Target id already occupied by a different document: refuse, never overwrite.
{
    const plan = planMigration(
        [
            { id: "uid-avi", email: "other@biz.com" },
            { id: "randomDocId", email: "avi@biz.com" },
        ],
        uids([
            ["avi@biz.com", "uid-avi"],
            ["other@biz.com", "uid-other"],
        ]),
        new Set(["uid-avi", "randomDocId"])
    );
    assert.equal(plan.moves.length, 1, "only the safe move is planned");
    assert.equal(plan.moves[0].oldId, "uid-avi");
    assert.equal(plan.needsAttention.length, 1);
    assert.match(plan.needsAttention[0], /already exists/);
}

// Every input document is accounted for exactly once — nothing silently vanishes.
{
    const docs = [
        { id: "a", email: "a@x.com" },
        { id: "uid-b", email: "b@x.com" },
        { id: "c", email: "gone@x.com" },
        { id: "d" },
    ];
    const plan = planMigration(
        docs,
        uids([
            ["a@x.com", "uid-a"],
            ["b@x.com", "uid-b"],
        ]),
        new Set(docs.map((d) => d.id))
    );
    assert.equal(plan.moves.length + plan.alreadyCorrect.length + plan.needsAttention.length, docs.length);
}

console.log("migrate-user-ids planner: all checks passed");
