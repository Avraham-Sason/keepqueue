"use client";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/lib/store";
import { useLanguage } from "@/hooks";
import { Accessibility, SlashSquare } from "lucide-react";
import { useEffect } from "react";

export function A11yToggle() {
    const a11yEnabled = useSettingsStore.a11yEnabled();
    const toggleA11y = useSettingsStore.toggleA11y();
    const { t } = useLanguage();

    return (
        <Button
            aria-pressed={a11yEnabled}
            aria-label={a11yEnabled ? t("disableAccessibilityMode") : t("enableAccessibilityMode")}
            title={t("accessibilityMode")}
            variant="ghost"
            size="icon"
            onClick={toggleA11y}
        >
            {a11yEnabled ? <SlashSquare className="h-4 w-4" /> : <Accessibility className="h-4 w-4" />}
        </Button>
    );
}

export function A11yInitializer() {
    const a11yEnabled = useSettingsStore.a11yEnabled();
    useEffect(() => {
        const root = document.documentElement;
        if (a11yEnabled) {
            root.classList.add("a11y");
        } else {
            root.classList.remove("a11y");
        }
    }, [a11yEnabled]);
    return null;
}
