import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth } from "../connect";

let restored: Promise<FirebaseUser | null> | null = null;

export const waitForFirebaseAuth = (): Promise<FirebaseUser | null> => {
    restored ??= new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            unsubscribe();
            resolve(firebaseUser);
        });
    });
    return restored;
};
