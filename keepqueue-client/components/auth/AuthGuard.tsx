"use client";

import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Role = "business" | "customer" | "admin";

interface AuthGuardProps {
    children: React.ReactNode;
    requiredRole?: Role;
}

const signInPathFor = (role?: Role) => (role === "customer" ? "/auth/signin/customer" : "/auth/signin/business");

// Where a signed-in user belongs when they land on a section that is not theirs. Sending
// them to a sign-in page instead would ask them to log in while already logged in.
const homePathFor = (role: Role) => (role === "admin" ? "/admin" : role === "business" ? "/business" : "/customer/dashboard");

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
    // During hydration zustand serves the store's initial state, not the persisted one, so on
    // every reload isAuthenticated reads false for one render. Deciding then signed out a live
    // session; nothing is decided until Firebase has reported and the store has synced to it.
    const sessionResolved = useAuthStore.sessionResolved();
    const isAuthenticated = useAuthStore.isAuthenticated();
    const user = useAuthStore.user();
    const router = useRouter();

    const actualRole = (user?.type as Role | undefined) ?? undefined;
    const roleMismatch = !!requiredRole && !!actualRole && actualRole !== requiredRole;
    // Authenticated but the profile has not landed yet: render nothing rather than let a
    // guarded section flash before the role is known.
    const roleUnknown = !!requiredRole && !actualRole;

    useEffect(() => {
        if (!sessionResolved) return;
        if (!isAuthenticated) {
            router.replace(signInPathFor(requiredRole));
            return;
        }
        if (roleMismatch && actualRole) {
            router.replace(homePathFor(actualRole));
        }
    }, [sessionResolved, isAuthenticated, roleMismatch, actualRole, requiredRole, router]);

    if (!sessionResolved || !isAuthenticated) return null;
    if (roleMismatch || roleUnknown) return null;

    return <>{children}</>;
}
