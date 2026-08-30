import { StringObject } from "@/lib/types";
import { OnSnapshotParsers, Snapshot, SnapshotDocument, WhereCondition } from "./types";
import { collection, doc, DocumentData, DocumentSnapshot, onSnapshot, orderBy, query, Query, QuerySnapshot, where } from "firebase/firestore";
import { db } from "../connect";
import { simpleExtractData } from "./global";
import { SetState } from "@/lib/store/utils";

export const parseSnapshotAsObject = (setState: SetState, filterCondition?: (v: any) => boolean): OnSnapshotParsers => {
    return {
        onFirstTime: (docs) => {
            if (filterCondition) {
                docs = docs.filter(filterCondition);
            }
            const object: StringObject<any> = {};
            docs.forEach((v) => {
                object[v.id] = v;
            });
            setState(object);
        },
        onAdd: (docs) => {
            if (filterCondition) {
                docs = docs.filter(filterCondition);
            }
            setState((prev: any) => {
                const update = { ...prev };
                docs.forEach((v) => {
                    update[v.id] = v;
                });
                return update;
            });
        },
        onModify: (docs) => {
            if (filterCondition) {
                docs = docs.filter(filterCondition);
            }
            setState((prev: any) => {
                const update = { ...prev };
                docs.forEach((v) => {
                    update[v.id] = v;
                });
                return update;
            });
        },
        onRemove: (docs) => {
            setState((prev: any) => {
                const update = { ...prev };
                docs.forEach((v) => {
                    delete update[v.id];
                });
                return update;
            });
        },
    };
};

export const parseSnapshotAsArray = (setState: SetState, filterCondition?: (v: any) => boolean): OnSnapshotParsers => {
    return {
        onFirstTime: (docs: any[]) => {
            if (filterCondition) {
                docs = docs.filter(filterCondition);
            }
            setState(docs);
        },
        onAdd: (docs: any[]) => {
            if (filterCondition) {
                docs = docs.filter(filterCondition);
            }
            setState((prev: any) => [...prev, ...docs]);
        },
        onModify: (docs: any[]) => {
            if (filterCondition) {
                docs = docs.filter(filterCondition);
            }
            setState((prev: any) => {
                const newState = [...prev];
                docs.forEach((doc: any) => {
                    const index = newState.findIndex((d: any) => d.id === doc.id);
                    if (index !== -1) {
                        newState[index] = doc;
                    }
                });
                return newState;
            });
        },
        onRemove: (docs: any[]) => {
            if (filterCondition) {
                docs = docs.filter(filterCondition);
            }
            setState((prev: any) => prev.filter((doc: any) => !docs.some((d: any) => d.id === doc.id)));
        },
    };
};

export const snapshot: Snapshot = (config, snapshotsFirstTime, settings) => {
    let resolvePromise: () => void;
    let isResolved = false;
    const promise = new Promise<void>((resolve) => {
        if (!settings?.disableLogs) {
            console.log(`==> ${config.collectionName} subscribed.`);
        }
        resolvePromise = () => {
            if (!isResolved) {
                isResolved = true;
                resolve();
            }
        };
    });

    let collectionRef: Query<DocumentData> = collection(db, config.collectionName);

    if (config.conditions) {
        config.conditions.forEach((condition) => {
            collectionRef = query(collectionRef, where(condition.field_name, condition.operator, condition.value));
        });
    }
    if (config.orderBy) {
        config.orderBy.forEach((order) => {
            collectionRef = query(collectionRef, orderBy(order.fieldName, order.direction));
        });
    }

    const unsubscribe = onSnapshot(
        collectionRef,
        (snapshot: QuerySnapshot<DocumentData>) => {
            const firstTimeKey = JSON.stringify({
                collectionName: config.collectionName,
                conditions: config.conditions || [],
                orderBy: config.orderBy || [],
            });
            if (!snapshotsFirstTime.includes(firstTimeKey)) {
                snapshotsFirstTime.push(firstTimeKey);
                const documents = snapshot.docs.map((doc) => simpleExtractData(doc));

                config.onFirstTime?.(documents, config);
                config.extraParsers?.forEach((extraParser) => {
                    extraParser.onFirstTime?.(documents, config);
                });
                resolvePromise();
            } else {
                const addedDocs: DocumentData[] = [];
                const modifiedDocs: DocumentData[] = [];
                const removedDocs: DocumentData[] = [];
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        addedDocs.push(simpleExtractData(change.doc));
                    } else if (change.type === "modified") {
                        modifiedDocs.push(simpleExtractData(change.doc));
                    } else if (change.type === "removed") {
                        removedDocs.push(simpleExtractData(change.doc));
                    }
                });
                if (addedDocs.length) {
                    config.onAdd?.(addedDocs, config);
                }
                if (modifiedDocs.length) {
                    config.onModify?.(modifiedDocs, config);
                }
                if (removedDocs.length) {
                    config.onRemove?.(removedDocs, config);
                }

                config.extraParsers?.forEach((extraParser) => {
                    if (addedDocs.length) {
                        extraParser.onAdd?.(addedDocs, config);
                    }
                    if (modifiedDocs.length) {
                        extraParser.onModify?.(modifiedDocs, config);
                    }
                    if (removedDocs.length) {
                        extraParser.onRemove?.(removedDocs, config);
                    }
                });
            }
        },
        (error) => {
            console.error(`Error listening to collection: ${config.collectionName}`, error);
            resolvePromise();
        }
    );

    return { promise, unsubscribe };
};

export const snapshotDocument: SnapshotDocument = (config, snapshotsFirstTime) => {
    let resolvePromise: () => void;
    let isResolved = false;
    const promise = new Promise<void>((resolve) => {
        console.log(`==> Document in ${config.collectionName} subscribed.`);
        resolvePromise = () => {
            if (!isResolved) {
                isResolved = true;
                resolve();
            }
        };
    });

    const documentRef = doc(db, config.collectionName, config.documentId);

    const unsubscribe = onSnapshot(
        documentRef,
        (docSnapshot: DocumentSnapshot<DocumentData>) => {
            if (!snapshotsFirstTime.includes(config.collectionName)) {
                snapshotsFirstTime.push(config.collectionName);
                if (docSnapshot.exists()) {
                    const document = simpleExtractData(docSnapshot);
                    if (checkConditions(document, config.conditions)) {
                        config.onFirstTime?.([document], config);
                        config.extraParsers?.forEach((extraParser) => {
                            extraParser.onFirstTime?.([document], config);
                        });
                    } else {
                        console.warn(`Document in ${config.collectionName} does not meet conditions.`);
                    }
                } else {
                    console.warn(`Document not found in ${config.collectionName}.`);
                }
                resolvePromise();
            } else {
                if (docSnapshot.exists()) {
                    const document = simpleExtractData(docSnapshot);
                    if (checkConditions(document, config.conditions)) {
                        config.onModify?.([document], config);
                        config.extraParsers?.forEach((extraParser) => {
                            extraParser.onModify?.([document], config);
                        });
                    }
                } else {
                    config.onRemove?.([], config);
                    config.extraParsers?.forEach((extraParser) => {
                        extraParser.onRemove?.([], config);
                    });
                }
            }
        },
        (error) => {
            console.error(`Error listening to document in ${config.collectionName}:`, error);
            resolvePromise();
        }
    );

    return { promise, unsubscribe };
};

const checkConditions = (document: DocumentData, conditions?: WhereCondition[]): boolean => {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every((condition) => {
        const fieldValue = document[condition.field_name];
        switch (condition.operator) {
            case "==":
                return fieldValue === condition.value;
            case "!=":
                return fieldValue !== condition.value;
            case "<":
                return fieldValue < condition.value;
            case "<=":
                return fieldValue <= condition.value;
            case ">":
                return fieldValue > condition.value;
            case ">=":
                return fieldValue >= condition.value;
            case "array-contains":
                return Array.isArray(fieldValue) && fieldValue.includes(condition.value);
            default:
                return false;
        }
    });
};
