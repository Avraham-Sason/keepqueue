import { StringObject } from "../types";

export type QueryDocuments = (
    collectionPath: string,
    fieldName: string,
    operator: FirebaseFirestore.WhereFilterOp,
    value: any
) => Promise<StringObject[]>;

export type WhereCondition = {
    fieldName: string;
    operator: FirebaseFirestore.WhereFilterOp;
    value: any;
};

export type QueryDocumentsByConditions = (collectionPath: string, whereConditions: WhereCondition[]) => Promise<StringObject[]>;

export type QueryDocumentByConditions = (collectionPath: string, whereConditions: WhereCondition[], log?: boolean) => Promise<StringObject>;

export type QueryDocument = (
    collectionPath: string,
    fieldName: string,
    operator: FirebaseFirestore.WhereFilterOp,
    value: any,
    ignoreLog?: boolean
) => Promise<StringObject>;

export type QueryDocumentOptional = (
    collectionPath: string,
    fieldName: string,
    operator: FirebaseFirestore.WhereFilterOp,
    value: any,
    ignoreLog?: boolean
) => Promise<StringObject | null>;

export type OnSnapshotCallback = (documents: any[], config: OnSnapshotConfig) => void;

export interface OnSnapshotParsers {
    onFirstTime?: OnSnapshotCallback;
    onAdd?: OnSnapshotCallback;
    onModify?: OnSnapshotCallback;
    onRemove?: OnSnapshotCallback;
}

export interface OnSnapshotConfig extends OnSnapshotParsers {
    collectionName: string;
    extraParsers?: OnSnapshotParsers[];
    customName?: string;
}

export type Snapshot = (config: OnSnapshotConfig) => Promise<void>;
export type SnapshotBulk = (snapshots: OnSnapshotConfig[], label?: string) => Promise<void>;
