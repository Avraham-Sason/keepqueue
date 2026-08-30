"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLanguage } from "@/hooks";
import { LanguageToggle } from "@/components/config";
import { useBusinessesStore } from "@/lib/store";

export function BusinessHeader() {
    const { t } = useLanguage();
    const currentBusiness = useBusinessesStore.currentBusiness();
    return (
        <header className="flex shrink-0 items-center gap-2 border-b py-5 px-4 justify-between">
            <div className="text-lg font-semibold">
                {t("welcomeBusinessAdminPanelOf")} {currentBusiness?.name ?? ""}
            </div>
            <SidebarTrigger className="-ml-1" />
        </header>
    );
}
