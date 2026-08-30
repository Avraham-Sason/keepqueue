import type React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { BusinessConfig, BusinessHeader, BusinessSidebar } from "./components";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function BusinessDashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard requiredRole="business">
            <SidebarProvider>
                <BusinessConfig />
                <BusinessSidebar />
                <SidebarInset>
                    <BusinessHeader />
                    <div className="flex-1 size-full space-y-4 p-4 md:p-8 pt-6">{children}</div>
                </SidebarInset>
            </SidebarProvider>
        </AuthGuard>
    );
}
