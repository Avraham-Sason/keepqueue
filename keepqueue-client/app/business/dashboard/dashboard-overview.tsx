"use client";

import { useParams } from "next/navigation";
import { useBusinessesStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store";
import type { User } from "@/lib/types";
import BusinessLoading from "../loading";
import { BusinessDetailsSections, QuickActionsSection, RecentAppointmentsSection, StatsSection, WelcomeSection } from "./components";

export function DashboardOverview() {
    const params = useParams<{ businessId: string }>();
    const businessIdParam = params?.businessId;
    const businessId = Array.isArray(businessIdParam) ? businessIdParam[0] : businessIdParam;

    const user = useAuthStore.user();
    const businessOwner = user as User;

    const currentBusiness = useBusinessesStore.currentBusiness();

    if (!businessOwner || businessOwner.type !== "business") {
        return <BusinessLoading />;
    }

    if (!currentBusiness || (businessId && currentBusiness.id !== businessId)) {
        return <BusinessLoading />;
    }

    return (
        <div className="space-y-8">
            <WelcomeSection />
            <StatsSection />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <RecentAppointmentsSection />
                <BusinessDetailsSections />
            </div>
            <QuickActionsSection />
        </div>
    );
}
