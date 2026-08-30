"use client";

import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AuthGuardProps {
    children: React.ReactNode;
    requiredRole?: "business" | "customer";
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
    const isAuthenticated = useAuthStore.isAuthenticated();
    const isBusinessOwner = useAuthStore.isBusinessOwner();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            const redirectPath = requiredRole === "customer" ? "/auth/signin/customer" : "/auth/signin/business";
            router.replace(redirectPath);
            return;
        }

        if (requiredRole === "business" && !isBusinessOwner) {
            router.replace("/auth/signin/business");
            return;
        }

        if (requiredRole === "customer" && isBusinessOwner) {
            router.replace("/auth/signin/customer");
            return;
        }
    }, [isAuthenticated, isBusinessOwner, requiredRole, router]);

    if (!isAuthenticated) return null;
    if (requiredRole === "business" && !isBusinessOwner) return null;
    if (requiredRole === "customer" && isBusinessOwner) return null;

    return <>{children}</>;
}
