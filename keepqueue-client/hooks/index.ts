"use client";
import { useSettingsStore } from "@/lib/store";
import { useState, useEffect } from "react";

export function useLanguage() {
    const language = useSettingsStore.language();
    const setLanguage = useSettingsStore.setLanguage();
    const t = useSettingsStore.t();
    const dir: "rtl" | "ltr" = language === "he" ? "rtl" : "ltr";
    return { language, setLanguage, t, dir, isRtl: language === "he" } as const;
}

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
    const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        const onChange = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };
        mql.addEventListener("change", onChange);
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    return !!isMobile;
}
