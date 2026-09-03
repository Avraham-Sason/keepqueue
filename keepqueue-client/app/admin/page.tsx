"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useLanguage } from "@/hooks";
import { AdminActions, BusinessesSection, UsersSection } from "./components";
import { useAdminOverview } from "./hooks";

export default function AdminPage() {
    const { t } = useLanguage();
    const { data, isLoading, isError } = useAdminOverview();

    const businesses = data?.businesses ?? [];
    const users = data?.users ?? [];
    const owners = useMemo(() => users.filter((user) => user.type === "business"), [users]);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">{t("adminPanelTitle")}</h1>
                    <p className="text-sm text-muted-foreground">{t("adminPanelSubtitle")}</p>
                </div>
                <AdminActions owners={owners} />
            </div>

            {isLoading ? (
                <Card>
                    <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                        <Spinner />
                        {t("adminLoading")}
                    </CardContent>
                </Card>
            ) : isError ? (
                <Card>
                    <CardContent className="py-12 text-center text-sm text-destructive">{t("adminLoadError")}</CardContent>
                </Card>
            ) : (
                <>
                    <BusinessesSection businesses={businesses} />
                    <UsersSection users={users} />
                </>
            )}
        </div>
    );
}
