"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useLanguage } from "@/hooks";
import type { BusinessOwner } from "@/lib/types";
import { useBusinessProxy } from "../hooks";
import BusinessLoading from "../loading";

function BusinessProxy() {
    const { t } = useLanguage();
    const user = useAuthStore.user();
    useBusinessProxy();

    const ownedBusinessIds = (user as BusinessOwner | null)?.ownedBusinessIds ?? [];

    // With no business linked there is nothing to load and nowhere to redirect, so the
    // spinner would never resolve. Say so instead of looking permanently busy.
    if (!ownedBusinessIds.length) {
        return (
            <div className="center min-h-dvh p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="items-center text-center space-y-2">
                        <Building2 className="size-10 text-muted-foreground" aria-hidden="true" />
                        <CardTitle>{t("noBusinessYetTitle")}</CardTitle>
                        <CardDescription>{t("noBusinessYetDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-sm text-muted-foreground">
                        <p>{t("noBusinessYetContact")}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return <BusinessLoading />;
}

export default BusinessProxy;
