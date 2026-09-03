import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type User } from "../types";
import { createSelectors } from "./utils";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase/connect";
import { getDocumentByIdOrThrow } from "../firebase";
import { useBusinessesStoreBase } from "./businesses";

export type LoginType = "business" | "customer";

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isBusinessOwner: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User; isBusinessOwner?: boolean }>;
    logout: () => Promise<void>;
}

// The profile document id is the Firebase Auth uid. Reading it by id is also the only
// shape firestore.rules can authorize — a query filtered on email cannot prove
// `userId == request.auth.uid` and is rejected outright.
const loadProfile = (uid: string) => getDocumentByIdOrThrow("users", uid) as Promise<User | null>;

const sessionFrom = (user: User) => ({
    user,
    isAuthenticated: true,
    isBusinessOwner: user.type === "business",
    isAdmin: user.type === "admin",
});

export const useAuthStoreBase = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isBusinessOwner: false,
            isAdmin: false,

            login: async (email, password) => {
                let signedIn = false;
                try {
                    const credential = await signInWithEmailAndPassword(auth, email, password);
                    signedIn = true;
                    const foundUser = await loadProfile(credential.user.uid);
                    if (!foundUser) {
                        await signOut(auth);
                        return { success: false, error: "authErrorProfileMissing" };
                    }
                    const session = sessionFrom(foundUser);
                    set(session);
                    return { success: true, user: foundUser, isBusinessOwner: session.isBusinessOwner };
                } catch (error: any) {
                    // Credentials were fine but the profile read failed — keep the Firebase
                    // session out of a half-signed-in state rather than leaving it dangling.
                    if (signedIn) await signOut(auth).catch(() => undefined);
                    const isInvalidCredentials = ["auth/invalid-credential", "auth/invalid-email", "auth/wrong-password", "auth/user-not-found"].includes(
                        error?.code
                    );
                    return { success: false, error: isInvalidCredentials ? "authErrorInvalidCredentials" : "authErrorGeneric" };
                }
            },

            logout: async () => {
                try {
                    await signOut(auth);
                } finally {
                    useBusinessesStoreBase.setState({ currentBusiness: null });
                    set({ user: null, isAuthenticated: false, isBusinessOwner: false, isAdmin: false });
                }
            },
        }),
        {
            name: "AuthStore",
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                isBusinessOwner: state.isBusinessOwner,
                isAdmin: state.isAdmin,
            }),
        }
    )
);

const clearSession = () => {
    useBusinessesStoreBase.setState({ currentBusiness: null });
    useAuthStoreBase.setState({ user: null, isAuthenticated: false, isBusinessOwner: false, isAdmin: false });
};

if (typeof window !== "undefined") {
    onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
            if (useAuthStoreBase.getState().isAuthenticated) clearSession();
            return;
        }
        if (useAuthStoreBase.getState().user?.id === firebaseUser.uid) return;
        try {
            const foundUser = await loadProfile(firebaseUser.uid);
            if (!foundUser) {
                clearSession();
                return;
            }
            useAuthStoreBase.setState(sessionFrom(foundUser));
        } catch {
            // A failed read is not proof the account is gone. Leave the persisted session
            // alone so an offline reload does not log the user out.
        }
    });
}

export const useAuthStore = createSelectors<AuthState>(useAuthStoreBase);
