import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Business, BusinessWithRelations, type User } from "../types";
import { createSelectors } from "./utils";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase/connect";
import { getAllDocuments, queryDocument } from "../firebase";
import { useBusinessesStoreBase } from "./businesses";
import { getBusinessByOwnerId } from "@/app/business/helpers";

export type LoginType = "business" | "customer";

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isBusinessOwner: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User; isBusinessOwner?: boolean }>;
    logout: () => Promise<void>;
}

export const useAuthStoreBase = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isBusinessOwner: false,

            login: async (email, password) => {
                try {
                    const credential = await signInWithEmailAndPassword(auth, email, password);
                    const firebaseUser = credential.user;
                    const foundUser = (await queryDocument("users", "email", "==", email)) as User | null;
                    if (!foundUser) {
                        await signOut(auth);
                        return { success: false, error: "authErrorTypeMismatch" };
                    }
                    const isBusinessOwner = foundUser.type === "business";
                    set({ user: foundUser, isAuthenticated: true, isBusinessOwner });
                    return { success: true, user: foundUser, isBusinessOwner };
                } catch (error: any) {
                    const isInvalidCredentials = ["auth/invalid-credential", "auth/invalid-email", "auth/wrong-password"].includes(error?.code);
                    const error_key = isInvalidCredentials ? "authErrorInvalidCredentials" : "authErrorGeneric";
                    return { success: false, error: error_key };
                }
            },

            logout: async () => {
                try {
                    await signOut(auth);
                } finally {
                    useBusinessesStoreBase.setState({ currentBusiness: null });
                    set({ user: null, isAuthenticated: false, isBusinessOwner: false });
                }
            },
        }),
        {
            name: "AuthStore",
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated, isBusinessOwner: state.isBusinessOwner }),
        }
    )
);

export const useAuthStore = createSelectors<AuthState>(useAuthStoreBase);
