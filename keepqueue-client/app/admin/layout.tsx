import type React from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard requiredRole="admin">
            <div className="flex-1 size-full space-y-6 p-4 md:p-8 pt-6">{children}</div>
        </AuthGuard>
    );
}
