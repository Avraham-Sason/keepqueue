"use client";

import { useSettingsStore } from "@/lib/store";
import { useEffect } from "react";
import { Button } from "../ui/button";
import { useLanguage } from "@/hooks";
import Image from "next/image";
import { Language } from "@/lib/types/global";

export function LanguageInitializer() {
    const language = useSettingsStore.language();
    const setLanguage = useSettingsStore.setLanguage();

    useEffect(() => {
        const saved = localStorage.getItem("language") as Language | null;
        if (saved === "he" || saved === "en") {
            setLanguage(saved);
        } else {
            setLanguage("he");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        localStorage.setItem("language", language);
        document.documentElement.lang = language;
        document.documentElement.dir = language === "he" ? "rtl" : "ltr";
        try {
            document.cookie = `language=${language}; path=/; max-age=31536000; samesite=lax`;
        } catch {}
    }, [language]);

    return null;
}

export const LanguageToggle = () => {
    const { language, setLanguage } = useLanguage();

    const handleLanguageChange = () => {
        setLanguage(language === "he" ? "en" : "he");
        window.location.reload();
    };

    return (
        <Button
            onClick={handleLanguageChange}
            aria-label={language === "en" ? "Switch to Hebrew" : "Switch to English"}
            className="px-2 bg-inherit hover:bg-gray-100"
        >
            <Image src={language === "en" ? "/flags/il.svg" : "/flags/us.svg"} alt="flag" width={24} height={16} />
        </Button>
    );
};
