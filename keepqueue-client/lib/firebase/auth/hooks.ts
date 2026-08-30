import { signInWithPopup, User } from "firebase/auth";
import { useCallback } from "react";
import { auth, googleLoginProvider } from "../connect";

export const useLoginWithGoogle = () => {
    const signInWithGoogle = useCallback(async (): Promise<User> => {
        const result = await signInWithPopup(auth, googleLoginProvider);
        const user = result.user;
        return user;
    }, [auth, googleLoginProvider]);
    return signInWithGoogle;
};
