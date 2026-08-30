import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSelectors, setState, SetState } from "./utils";
import heTranslations from "../translations/he.json";
import enTranslations from "../translations/en.json";
import { Language } from "../types/global";

type Translations = typeof heTranslations;
type TranslationsKey = keyof typeof heTranslations | keyof typeof enTranslations | (string & {});

interface SettingsState {
    a11yEnabled: boolean;
    toggleA11y: () => void;
    setA11y: (enabled: boolean) => void;
    language: Language;
    isRtl: boolean;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationsKey) => string;
    userTimeZone: string;
    setUserTimeZone: SetState<string>;
}

const translations: Record<Language, Translations> = {
    he: heTranslations,
    en: enTranslations,
};

export const useSettingsStoreBase = create<SettingsState>()(
    persist(
        (set, get) => ({
            a11yEnabled: false,
            toggleA11y: () => set({ a11yEnabled: !get().a11yEnabled }),
            setA11y: (enabled) => set({ a11yEnabled: enabled }),
            language: "he",
            isRtl: true,
            setLanguage: (lang) => set({ language: lang, isRtl: lang === "he" }),
            t: (key) => {
                const current = translations[get().language] as Record<string, string>;
                const fallbackEn = enTranslations as Record<string, string>;
                if (Object.prototype.hasOwnProperty.call(current, key) && current[key]) {
                    return current[key];
                }
                if (Object.prototype.hasOwnProperty.call(fallbackEn, key) && fallbackEn[key]) {
                    return fallbackEn[key];
                }
                return key as string;
            },
            userTimeZone: "Asia/Jerusalem",
            setUserTimeZone: (updater) => setState(updater, set, "userTimeZone"),
        }),
        {
            name: "settings",
            partialize: (state) => ({
                a11yEnabled: state.a11yEnabled,
                language: state.language,
                isRtl: state.isRtl,
                userTimeZone: state.userTimeZone,
            }),
        }
    )
);

export const useSettingsStore = createSelectors<SettingsState>(useSettingsStoreBase);
