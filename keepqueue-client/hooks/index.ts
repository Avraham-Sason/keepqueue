"use client";
import { useSettingsStore } from "@/lib/store";
import { useSyncExternalStore } from "react";

export function useLanguage() {
    const language = useSettingsStore.language();
    const setLanguage = useSettingsStore.setLanguage();
    const t = useSettingsStore.t();
    const dir: "rtl" | "ltr" = language === "he" ? "rtl" : "ltr";
    return { language, setLanguage, t, dir, isRtl: language === "he" } as const;
}

const MOBILE_BREAKPOINT = 768;

// useSyncExternalStore is the right shape for "read a browser API and subscribe to it": the
// server snapshot is explicit, and the value is read during render rather than set from an
// effect — which is what made every mobile layout render desktop first, then flip.
const mobileQuery = () => window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

const subscribeToMobile = (onChange: () => void) => {
    const mql = mobileQuery();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
};

export function useIsMobile() {
    return useSyncExternalStore(
        subscribeToMobile,
        () => mobileQuery().matches,
        () => false,
    );
}
