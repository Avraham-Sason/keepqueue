import { Unsubscribe, WhereFilterOp } from "firebase/firestore";

export type OnSnapshotCallback = (documents: any[], config: OnSnapshotConfig) => void;

export interface OnSnapshotParsers {
    onFirstTime?: OnSnapshotCallback;
    onAdd?: OnSnapshotCallback;
    onModify?: OnSnapshotCallback;
    onRemove?: OnSnapshotCallback;
}

export interface WhereCondition {
    field_name: string;
    operator: WhereFilterOp;
    value: any;
}

export interface OnSnapshotConfig extends OnSnapshotParsers {
    collectionName: string;
    extraParsers?: OnSnapshotParsers[];
    conditions?: WhereCondition[];
    orderBy?: { fieldName: string; direction: "asc" | "desc" }[];
    parseAs?: "object" | "array";
    subscribeTo?: "cache" | "db";
}

export interface OnSnapshotConfigDocument extends Omit<OnSnapshotParsers, "onAdd"> {
    collectionName: string;
    documentId: string;
    extraParsers?: Omit<OnSnapshotParsers, "onAdd">[];
    conditions?: WhereCondition[];
}

export interface SnapshotResult {
    promise: Promise<void>;
    unsubscribe: Unsubscribe;
}

export type Snapshot = (config: OnSnapshotConfig, snapshotsFirstTime: string[], settings?: { disableLogs?: boolean }) => SnapshotResult;

export type SnapshotDocument = (config: OnSnapshotConfigDocument, snapshotsFirstTime: string[]) => SnapshotResult;
