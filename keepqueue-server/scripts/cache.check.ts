/**
 * Self-check for the snapshot boot path: the startup timeout on initSnapshot, and the cache
 * upsert that keeps a listener resync from duplicating a whole collection. Pure logic, no
 * Firebase, no credentials.
 *
 *   cd keepqueue-server && npm run check:cache
 */
import assert from "node:assert/strict";
import { cacheManager } from "../src/managers";
import { firestoreCollections } from "../src/types";
import { OnSnapshotConfig } from "../src/firebase/types";

// src/firebase/helpers.ts reads a service account at import time and exits without one. Standing
// in for it here is what keeps this check credential-free while still driving the real
// initSnapshot; the assignment must run before initialCache is required.
let snapshotBulkStub: (configs: OnSnapshotConfig[]) => Promise<void> = async () => {};
const helpersPath = require.resolve("../src/firebase/helpers");
require.cache[helpersPath] = {
    id: helpersPath,
    filename: helpersPath,
    loaded: true,
    exports: { snapshotBulk: (configs: OnSnapshotConfig[]) => snapshotBulkStub(configs) },
} as unknown as NodeModule;

const { initSnapshot } = require("../src/firebase/initialCache") as typeof import("../src/firebase/initialCache");

const main = async () => {
    /// startup timeout — a listener that never delivers must not hang boot forever
    snapshotBulkStub = () => new Promise<void>(() => {});
    await assert.rejects(initSnapshot(20), /did not deliver within 20ms/);

    /// a listener error reaches the caller instead of being swallowed by an unsettled promise
    snapshotBulkStub = () => Promise.reject(new Error("PERMISSION_DENIED on initial listen"));
    await assert.rejects(initSnapshot(1000), /PERMISSION_DENIED/);

    /// the happy path still resolves, and its timer is cleared (this script exits immediately)
    let captured: OnSnapshotConfig[] = [];
    snapshotBulkStub = async (configs) => {
        captured = configs;
    };
    await initSnapshot(1000);

    /// every subscription uses the real Firestore collection name, snake_case included
    assert.deepEqual(
        captured.map((config) => config.collectionName),
        [...firestoreCollections]
    );

    /// ...while the cache keeps the camelCase keys its consumers read
    const templates = captured.find((config) => config.collectionName === "message_templates")!;
    templates.onFirstTime!([{ id: "t1", content: "hi" }], templates);
    assert.equal(cacheManager.get("messageTemplates").length, 1);
    assert.equal(cacheManager.get("messageTemplatesMap").size, 1);

    /// a resync replays the whole collection as 'added' — it must upsert, not concat
    templates.onAdd!([{ id: "t1", content: "hi" }], templates);
    templates.onAdd!([{ id: "t1", content: "hi" }], templates);
    assert.equal(cacheManager.get("messageTemplates").length, 1);
    assert.equal(cacheManager.get("messageTemplatesMap").size, 1);

    /// an edit replaces in place, a genuinely new document is still appended
    templates.onAdd!([{ id: "t1", content: "edited" }, { id: "t2" }], templates);
    assert.equal(cacheManager.get("messageTemplates").length, 2);
    assert.equal(cacheManager.get("messageTemplates")[0].content, "edited");

    /// the merge this replaced is what grew unbounded, and it is still one option away
    cacheManager.set("messageTemplates", [{ id: "t1" }, { id: "t2" }] as any, { merge: true });
    assert.equal(cacheManager.get("messageTemplates").length, 4);

    /// removals clear both slots
    templates.onRemove!([{ id: "t1" }, { id: "t2" }], templates);
    assert.equal(cacheManager.get("messageTemplates").length, 0);
    assert.equal(cacheManager.get("messageTemplatesMap").size, 0);

    console.log("snapshot boot + cache merge: all checks passed");
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
