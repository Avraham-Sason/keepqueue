"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "date-fns";

interface CalendarLocalizationContextValue {
    locale: Locale;
    dir: "rtl" | "ltr";
    isRtl: boolean;
    translate: (key: string, replacements?: Record<string, string | number>) => string;
}

const CalendarLocalizationContext = createContext<CalendarLocalizationContextValue | null>(null);

interface CalendarLocalizationProviderProps {
    value: CalendarLocalizationContextValue;
    children: React.ReactNode;
}

export function CalendarLocalizationProvider({ value, children }: CalendarLocalizationProviderProps) {
    const memoizedValue = useMemo(
        () => ({
            locale: value.locale,
            dir: value.dir,
            isRtl: value.isRtl,
            translate: value.translate,
        }),
        [value]
    );

    return <CalendarLocalizationContext.Provider value={memoizedValue}>{children}</CalendarLocalizationContext.Provider>;
}

export function useCalendarLocalization() {
    const context = useContext(CalendarLocalizationContext);
    if (!context) {
        throw new Error("useCalendarLocalization must be used within a CalendarLocalizationProvider");
    }
    return context;
}

