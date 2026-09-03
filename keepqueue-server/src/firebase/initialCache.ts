import { cacheManager } from "../managers";
import { DocBase, firestoreCollections } from "../types";
import { snapshotBulk } from "./helpers";
import { OnSnapshotConfig } from "./types";

const SNAPSHOT_STARTUP_TIMEOUT_MS = 30_000;

type FirestoreCollection = (typeof firestoreCollections)[number];
type CamelCase<S extends string> = S extends `${infer Head}_${infer Tail}` ? `${Head}${Capitalize<CamelCase<Tail>>}` : S;

// The Firestore collection name is the single source of truth; the cache key is derived from it.
// Two hand-written lists is how `message_templates` ended up subscribed as `messageTemplates`,
// which delivers nothing. Typing the result as CamelCase<FirestoreCollection> makes tsc reject a
// collection whose derived key is not a real CacheStore slot.
const cacheKeyOf = (collection: FirestoreCollection) =>
    collection.replace(/_(.)/g, (_, char: string) => char.toUpperCase()) as CamelCase<FirestoreCollection>;

export const initSnapshot = async (timeoutMs: number = SNAPSHOT_STARTUP_TIMEOUT_MS) => {
    let deadline: NodeJS.Timeout;
    // A listener that neither delivers nor errors leaves boot hanging forever: no HTTP server,
    // no exit, nothing for a supervisor to restart. The deadline turns that into a crash.
    const expiry = new Promise<never>((_, reject) => {
        deadline = setTimeout(() => reject(new Error(`firestore snapshots did not deliver within ${timeoutMs}ms`)), timeoutMs);
    });
    try {
        await Promise.race([snapshotBulk(firestoreCollections.map((collection) => parseDocuments(collection))), expiry]);
    } finally {
        clearTimeout(deadline!);
    }
};

const parseDocuments = (collectionName: FirestoreCollection): OnSnapshotConfig => {
    const arrayKey = cacheKeyOf(collectionName);
    const mapKey = `${arrayKey}Map` as const;

    // Firestore replays the whole collection as 'added' when a listener has been disconnected
    // too long to resume from its token, so a plain concat re-appends every document on every
    // reconnect: the array grows without bound and /data/* starts returning duplicates.
    const upsert = (documents: DocBase[]) => {
        cacheManager.set(arrayKey, documents, { merge: true, replacePrevValues: true });
        cacheManager.set(mapKey, documents, { merge: true, replacePrevValues: true });
    };

    return {
        collectionName,
        onFirstTime: (documents: DocBase[]) => {
            cacheManager.set(arrayKey, documents);
            cacheManager.set(mapKey, new Map(documents.map((document) => [document.id!, document])));
        },
        onAdd: upsert,
        onModify: upsert,
        onRemove: (documents: DocBase[]) => {
            documents.forEach((document) => {
                cacheManager.delete(arrayKey, document.id);
                cacheManager.delete(mapKey, document.id);
            });
        },
    };
};
