import { db } from "../connect";
import { addDoc, collection, deleteDoc, doc, DocumentData, getDoc, getDocs, query, Query, setDoc, where, WhereFilterOp } from "firebase/firestore";
import { StringObject } from "@/lib/types";
import { firebaseTimestamp, simpleExtractData } from "./global";
import { WhereCondition } from "./types";

export const getAllDocuments = async (collection_path: string) => {
    try {
        const snapshot = await getDocs(collection(db, collection_path));
        const documents = snapshot.docs.map((doc) => simpleExtractData(doc));
        return documents;
    } catch (error) {
        return [];
    }
};

export const getDocumentById = async (collection_path: string, doc_id: string) => {
    try {
        const doc_ref = doc(db, collection_path, doc_id);
        const doc_snap = await getDoc(doc_ref);
        if (!doc_snap.exists()) {
            throw new Error("Document not found, document id: " + doc_id);
        }
        return simpleExtractData(doc_snap);
    } catch (error) {
        console.error("Error from get_document_by_id", error);
        return null;
    }
};

/**
 * Unlike getDocumentById, this tells a missing document (null) apart from a failed read
 * (throws). The auth flow needs that distinction: a genuinely absent profile means the
 * account is not provisioned, while a permission or network error must not be mistaken
 * for one and sign a valid user out.
 */
export const getDocumentByIdOrThrow = async (collection_path: string, doc_id: string) => {
    const doc_snap = await getDoc(doc(db, collection_path, doc_id));
    return doc_snap.exists() ? simpleExtractData(doc_snap) : null;
};

/**
 * The three writers below reject when the write does not land. Swallowing the error and
 * answering `false` made every `try/catch` around them dead code and every caller ignored the
 * boolean, so a rules-denied write closed its dialog as if it had saved. The `true` they
 * resolve with is vestigial — callers that still read it keep compiling.
 */
export const setDocument = async (collection_path: string, doc_id: string, data: DocumentData) => {
    await setDoc(doc(db, collection_path, doc_id), data, { merge: true });
    return true;
};

export const addDocument = async (collection_path: string, data: DocumentData, include_id = false) => {
    const doc_ref = await addDoc(collection(db, collection_path), data);
    if (include_id) {
        await setDoc(doc_ref, { ...data, id: doc_ref.id }, { merge: true });
    }
    return true;
};

export const deleteDocument = async (collection_path: string, doc_id: string) => {
    await deleteDoc(doc(db, collection_path, doc_id));
    return true;
};

export const queryDocument = async (
    collection_path: string,
    field_name: string,
    operator: WhereFilterOp,
    value: any,
    ignore_log = false
): Promise<null | StringObject<any>> => {
    try {
        const q = query(collection(db, collection_path), where(field_name, operator, value));
        const query_snapshot = await getDocs(q);
        const documents = query_snapshot.docs.map((doc) => simpleExtractData(doc));
        if (documents.length < 1) {
            throw new Error(
                `No data to return from: \ncollection: ${collection_path}, \nfield_name: ${field_name}, \noperator: ${operator}, \nvalue: ${value}`
            );
        }
        return documents[0];
    } catch (error) {
        if (!ignore_log) {
            console.error("Error querying document:", error);
        }
        return null;
    }
};

export const queryDocuments = async (collection_path: string, field_name: string, operator: WhereFilterOp, value: any) => {
    try {
        const q = query(collection(db, collection_path), where(field_name, operator, value));
        const query_snapshot = await getDocs(q);
        const documents = query_snapshot.docs.map((doc) => simpleExtractData(doc));
        return documents;
    } catch (error) {
        console.error(`Error querying documents: ${collection_path} - ${field_name} - ${operator} - ${value} `, error);
        return [];
    }
};

export const queryDocumentsByConditions = async (collection_path: string, where_conditions: WhereCondition[]) => {
    try {
        let db_query: Query<DocumentData> = collection(db, collection_path) as Query<DocumentData>;
        where_conditions.forEach((condition) => {
            db_query = query(db_query, where(condition.field_name, condition.operator, condition.value));
        });
        const query_snapshot = await getDocs(db_query);
        const documents = query_snapshot.docs.map((doc) => simpleExtractData(doc));
        return documents;
    } catch (error) {
        console.error(`Error querying documents: ${collection_path} - ${JSON.stringify(where_conditions)} `, error);
        return [];
    }
};

export const queryDocumentByConditions = async (collection_path: string, where_conditions: WhereCondition[]) => {
    try {
        let db_query: Query<DocumentData> = collection(db, collection_path) as Query<DocumentData>;
        where_conditions.forEach((condition) => {
            db_query = query(db_query, where(condition.field_name, condition.operator, condition.value));
        });
        const query_snapshot = await getDocs(db_query);
        const documents = query_snapshot.docs.map((doc) => simpleExtractData(doc));
        if (!documents[0]) {
            throw new Error("No data returned from DB");
        }
        return documents[0];
    } catch (error) {
        console.error(`Error querying documents: ${collection_path} - ${JSON.stringify(where_conditions)} `, error);
        return null;
    }
};

export const getUserByPhone = async (phone: string) => {
    return await queryDocument("users", "phone_number", "==", phone, true);
};

export const getUserByEmail = async (email: string) => {
    return await queryDocument("users", "email", "==", email.toLowerCase(), true);
};

export const getUserByIdentifier = async (identifier: string) => {
    return (await getUserByPhone(identifier)) || (await getUserByEmail(identifier));
};

export const addAuditRecord = async (action: string, entity: string, details: StringObject<any>) => {
    try {
        const ref = doc(collection(db, "audit"));
        const data = {
            action,
            entity,
            details,
        };

        await setDoc(ref, {
            ...data,
            datetime: firebaseTimestamp(),
        });
        return data;
    } catch (error) {
        console.error(error);
    }
};
