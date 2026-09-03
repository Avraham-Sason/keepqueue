import { performance } from "perf_hooks";
import firebase_admin from "firebase-admin";
import {
    OnSnapshotParsers,
    QueryDocument,
    QueryDocumentByConditions,
    QueryDocumentOptional,
    QueryDocuments,
    QueryDocumentsByConditions,
    Snapshot,
    SnapshotBulk,
} from "./types";
import { logger } from "../managers";
import { DecodedIdToken } from "firebase-admin/auth";
import { StringObject } from "../types";
import dotenv from "dotenv";
import path from "path";
import { Timestamp } from "firebase-admin/firestore";
// The monorepo keeps one .env at the repo root, but a bare dotenv.config() resolves against
// the working directory — keepqueue-server/ — and would never find it. Load the package-local
// file first so it can still override, then fall back to the root one. dotenv never overwrites
// a variable that is already set, so in production the systemd EnvironmentFile still wins and
// both of these calls are silent no-ops.
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
// initial firebase
const requiredEnvVars = [
    "type",
    "project_id",
    "private_key_id",
    "private_key",
    "client_email",
    "client_id",
    "auth_uri",
    "token_uri",
    "auth_provider_x509_cert_url",
    "client_x509_cert_url",
    "universe_domain",
];
const envData: StringObject<string> = {};
requiredEnvVars.forEach((varName) => {
    const envVal = process.env[varName];
    if (!envVal) {
        console.error(`--- Error: Missing mandatory environment variable: ${varName}. ---`);
        process.exit(1);
    }
    envData[varName] = envVal;
});
export const serviceAccountFirebase = {
    type: envData.type,
    project_id: envData.project_id,
    private_key_id: envData.private_key_id,
    private_key: envData.private_key.replace(/\\n/g, "\n"),
    client_email: envData.client_email,
    client_id: envData.client_id,
    auth_uri: envData.auth_uri,
    token_uri: envData.token_uri,
    auth_provider_x509_cert_url: envData.auth_provider_x509_cert_url,
    client_x509_cert_url: envData.client_x509_cert_url,
    universe_domain: envData.universe_domain,
};
export const firebaseTimestamp = () => Timestamp.now();
firebase_admin.initializeApp({
    credential: firebase_admin.credential.cert(serviceAccountFirebase as firebase_admin.ServiceAccount),
    storageBucket: `${serviceAccountFirebase.project_id}.appspot.com`,
});
export const db = firebase_admin.firestore();
export const messaging = firebase_admin.messaging();
export const auth = firebase_admin.auth();

/// extract
export const simpleExtractData = (doc: FirebaseFirestore.DocumentSnapshot, includeId: boolean = true): StringObject => {
    const docData = doc.data();
    const date = {
        ...docData,
    };
    if (includeId) {
        date.id = doc.id;
    }
    return date;
};

/// documents
export const getAllDocuments = async (collectionPath: string, includeId: boolean = true) => {
    try {
        const snapshot = await db.collection(collectionPath).get();
        const documents = snapshot.docs.flatMap((doc) => {
            return simpleExtractData(doc, includeId);
        });
        return documents;
    } catch (error) {
        logger.error("Error fetching documents:", error);
        throw error;
    }
};

export const queryDocuments: QueryDocuments = async (collectionPath, fieldName, operator, value) => {
    try {
        const querySnapshot = await db.collection(collectionPath).where(fieldName, operator, value).get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc: FirebaseFirestore.DocumentSnapshot) => simpleExtractData(doc));
        return documents;
    } catch (error) {
        logger.error(`Error querying documents: ${collectionPath} - ${fieldName} - ${operator} - ${value} `, error);
        throw error;
    }
};

export const queryDocumentsByConditions: QueryDocumentsByConditions = async (collectionPath, whereConditions) => {
    try {
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection(collectionPath);
        whereConditions.forEach((condition) => {
            query = query.where(condition.fieldName, condition.operator, condition.value);
        });
        const querySnapshot = await query.get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc: FirebaseFirestore.DocumentSnapshot) => simpleExtractData(doc));
        return documents;
    } catch (error) {
        logger.error(`Error querying documents: ${collectionPath} - ${JSON.stringify(whereConditions)} `, error);
        throw error;
    }
};

export const queryDocumentByConditions: QueryDocumentByConditions = async (collectionPath, whereConditions, log = true) => {
    try {
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection(collectionPath);
        whereConditions.forEach((condition) => {
            query = query.where(condition.fieldName, condition.operator, condition.value);
        });
        const querySnapshot = await query.get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc: FirebaseFirestore.DocumentSnapshot) => simpleExtractData(doc));
        if (!documents[0]) {
            throw "no data returned from DB";
        }
        return documents[0];
    } catch (error) {
        if (log) {
            logger.error(`Error querying documents: ${collectionPath} - ${JSON.stringify(whereConditions)} `, error);
        }
        throw error;
    }
};

/// document
export const queryDocument: QueryDocument = async (collectionPath, fieldName, operator, value, ignoreLog = false) => {
    try {
        const querySnapshot = await db.collection(collectionPath).where(fieldName, operator, value).get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc: FirebaseFirestore.DocumentSnapshot) => simpleExtractData(doc));
        if (documents.length < 1) {
            throw `No data to return from: collection: ${collectionPath}, field_name: ${fieldName}, operator: ${operator}, value:${value}`;
        }
        return documents[0];
    } catch (error) {
        if (!ignoreLog) {
            logger.error(
                "Error querying document: " + JSON.stringify({ collection_path: collectionPath, field_name: fieldName, operator, value }),
                error
            );
        }
        throw error;
    }
};

export const queryDocumentOptional: QueryDocumentOptional = async (collectionPath, fieldName, operator, value, ignoreLog = true) => {
    try {
        const querySnapshot = await db.collection(collectionPath).where(fieldName, operator, value).get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc: FirebaseFirestore.DocumentSnapshot) => simpleExtractData(doc));
        return documents[0] || null;
    } catch (error) {
        if (!ignoreLog) {
            logger.error(
                "Error querying optional document: " + JSON.stringify({ collection_path: collectionPath, field_name: fieldName, operator, value }),
                error
            );
        }
        return null;
    }
};

export const getDocumentById = async (collectionPath: string, docId: string, includeId: boolean = true): Promise<StringObject> => {
    try {
        const docRef = db.collection(collectionPath).doc(docId);
        const doc = await docRef.get();
        if (!doc.exists) {
            throw "Document not found, document id: " + docId;
        }
        return simpleExtractData(doc, includeId);
    } catch (error) {
        logger.error("error from getDocumentById", error);
        throw error;
    }
};

export const getDocumentByIdOptional = async (collectionPath: string, docId: string, includeId: boolean = true): Promise<StringObject | null> => {
    try {
        const docRef = db.collection(collectionPath).doc(docId);
        const doc = await docRef.get();
        if (!doc.exists) {
            throw "Document not found, document id: " + docId;
        }
        return simpleExtractData(doc, includeId);
    } catch (error) {
        logger.error("error from getDocumentByIdOptional", error);
        return null;
    }
};

export const setDocument = async (collectionPath: string, docId: string, data: {}, merge: boolean = true): Promise<void> => {
    try {
        await db
            .collection(collectionPath)
            .doc(docId)
            .set({ ...data }, { merge });
    } catch (error) {
        logger.error(`failed to create document by id: ${docId} in collection: ${collectionPath}`, error);
        throw `failed to create document by id ${docId} in collection ${collectionPath}`;
    }
};

export const addDocument = async (collectionPath: string, data: {}, includeId = false, customId?: string): Promise<void> => {
    try {
        const newDocument = customId ? db.collection(collectionPath).doc(customId) : db.collection(collectionPath).doc();
        const update = includeId ? { ...data, id: newDocument.id } : data;
        await newDocument.set(update);
    } catch (error) {
        logger.error(`failed to create document in collection: ${collectionPath}`, error);
        throw `failed to create document in collection ${collectionPath}`;
    }
};

export const deleteDocument = async (collectionPath: string, docId: string): Promise<void> => {
    try {
        await db.collection(collectionPath).doc(docId).delete();
    } catch (error) {
        throw `Failed to delete document with id ${docId} from collection ${collectionPath}`;
    }
};

/// token
export const verifyToken = async (authorization: string | undefined): Promise<DecodedIdToken> => {
    try {
        if (!authorization) {
            throw "Authorization token is required";
        }
        if (!authorization.toLowerCase().startsWith("bearer")) {
            throw "Invalid authorization token";
        }
        const token = authorization.split(/bearer\s+(.+)/i)[1];

        if (!token) {
            throw "validation error: Token not found";
        }
        // checkRevoked also rejects tokens belonging to a disabled account. Without it a
        // revoked session stays valid until the token expires — up to an hour — and there is
        // no way to force anyone out. It costs a user-record lookup per authenticated request,
        // which is the right trade at pilot traffic; revisit if request latency matters more
        // than being able to cut off an account immediately.
        const res = await firebase_admin.auth().verifyIdToken(token, true);
        if (!res) {
            throw "User not found";
        }
        return res;
    } catch (error) {
        logger.error("error from verifyToken", error);
        throw error;
    }
};

/// snapshots
const snapshotsFirstTime: string[] = [];

export const snapshot: Snapshot = (config) => {
    return new Promise<void>((resolve, reject) => {
        const { collectionName, customName = collectionName } = config;
        let booted = false;

        db.collection(config.collectionName).onSnapshot(
            (snapshot) => {
                if (!snapshotsFirstTime.includes(customName)) {
                    snapshotsFirstTime.push(customName);
                    const documents = snapshot.docs.flatMap((doc: FirebaseFirestore.DocumentSnapshot) => simpleExtractData(doc));

                    config.onFirstTime?.(documents, config);
                    config.extraParsers?.forEach((extraParser: OnSnapshotParsers) => {
                        extraParser.onFirstTime?.(documents, config);
                    });
                    booted = true;
                    resolve();
                } else {
                    const getDocsFromSnapshot = (action: string): StringObject[] => {
                        return snapshot
                            .docChanges()
                            .filter((change) => change.type === action)
                            .map((change) => simpleExtractData(change.doc));
                    };
                    const [added, modified, removed] = [
                        getDocsFromSnapshot("added"),
                        getDocsFromSnapshot("modified"),
                        getDocsFromSnapshot("removed"),
                    ];

                    if (added.length) {
                        config.onAdd?.(added, config);
                    }
                    if (modified.length) {
                        config.onModify?.(modified, config);
                    }
                    if (removed.length) {
                        config.onRemove?.(removed, config);
                    }
                    config.extraParsers?.forEach((extraParser: OnSnapshotParsers) => {
                        if (added.length) {
                            extraParser.onAdd?.(added, config);
                        }
                        if (modified.length) {
                            extraParser.onModify?.(modified, config);
                        }
                        if (removed.length) {
                            extraParser.onRemove?.(removed, config);
                        }
                    });
                }
            },
            (error) => {
                logger.error(`Error listening to collection: ${collectionName}`, error);
                if (!booted) {
                    // Only logging here left boot waiting on a promise nothing could ever settle.
                    reject(error);
                    return;
                }
                // Firestore retries transient stream failures itself and only reaches this
                // callback once the listener is gone for good. Staying up would mean serving a
                // cache frozen at the moment it died, with nothing to say so; exiting lets the
                // supervisor restart and re-listen.
                process.exit(1);
            }
        );
    });
};

export const snapshotBulk: SnapshotBulk = async (snapshotsConfig, label = "custom snapshots") => {
    const start = performance.now();
    logger.log(`==> ${label} started... `);
    await Promise.all(snapshotsConfig.map(async (snapshotConfig) => await snapshot(snapshotConfig)));
    logger.log(`==> ${label} ended. It took ${(performance.now() - start).toFixed(2)} ms`);
};
