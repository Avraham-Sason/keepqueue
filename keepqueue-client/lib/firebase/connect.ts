import { initializeApp, FirebaseApp } from "firebase/app";
import { FirebaseStorage, getStorage } from "firebase/storage";
import { Auth, getAuth, GoogleAuthProvider } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";

interface FirebaseInitResult {
    db: Firestore;
    auth: Auth;
    storage: FirebaseStorage;
    app: FirebaseApp;
    googleLoginProvider: GoogleAuthProvider;
}
const initApp = (): FirebaseInitResult => {
    const sanitizeEnv = (value?: string) => value?.trim().replace(/[\s,]+$/g, "");
    const firebaseConfig = {
        apiKey: sanitizeEnv(process.env.NEXT_PUBLIC_API_KEY),
        authDomain: sanitizeEnv(process.env.NEXT_PUBLIC_AUTH_DOMAIN),
        projectId: sanitizeEnv(process.env.NEXT_PUBLIC_PROJECT_ID),
        storageBucket: sanitizeEnv(process.env.NEXT_PUBLIC_STORAGE_BUCKET),
        messagingSenderId: sanitizeEnv(process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID),
        appId: sanitizeEnv(process.env.NEXT_PUBLIC_APP_ID),
    };

    const app: FirebaseApp = initializeApp(firebaseConfig);
    const auth: Auth = getAuth(app);
    auth.settings.appVerificationDisabledForTesting = false;
    const db: Firestore = getFirestore(app);
    const storage: FirebaseStorage = getStorage(app);
    const googleLoginProvider = new GoogleAuthProvider();
    return { db, auth, storage, app, googleLoginProvider };
};

export const { db, auth, storage, app, googleLoginProvider } = initApp();
