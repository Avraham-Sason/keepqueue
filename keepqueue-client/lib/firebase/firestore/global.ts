import { StringObject } from "@/lib/types";
import { DocumentData, DocumentSnapshot, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";

export const firebaseTimestamp = Timestamp.now;

export const simpleExtractData = (doc: DocumentSnapshot<DocumentData> | QueryDocumentSnapshot<DocumentData>): StringObject<any> => {
    const docData = doc.data();
    return {
        ...docData,
        id: doc.id,
    };
};
