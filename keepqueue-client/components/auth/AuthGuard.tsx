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
    const isAuthenticated = useAuthStore.isAuthenticated();
    const user = useAuthStore.user();
    const router = useRouter();

    const actualRole = (user?.type as Role | undefined) ?? undefined;
    const roleMismatch = !!requiredRole && !!actualRole && actualRole !== requiredRole;
    // Authenticated but the profile has not landed yet: render nothing rather than let a
    // guarded section flash before the role is known.
    const roleUnknown = !!requiredRole && !actualRole;

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace(signInPathFor(requiredRole));
            return;
        }
        if (roleMismatch && actualRole) {
            router.replace(homePathFor(actualRole));
        }
    }, [isAuthenticated, roleMismatch, actualRole, requiredRole, router]);

    if (!isAuthenticated) return null;
    if (roleMismatch || roleUnknown) return null;

    return <>{children}</>;
}
