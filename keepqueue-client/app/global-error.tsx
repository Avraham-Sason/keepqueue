"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSettingsStore } from "@/lib/store/settingsStore";
import "./globals.css";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const language = useSettingsStore.language();
    const t = useSettingsStore.t();

    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html lang={language} dir={language === "he" ? "rtl" : "ltr"}>
            <body className="w-screen min-h-dvh">
                <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
                    <h1 className="text-2xl font-bold">{t("errorTitle")}</h1>
                    <p className="text-muted-foreground max-w-md">{t("errorBody")}</p>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                        <button
                            onClick={reset}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            {t("errorRetry")}
                        </button>
                        <Link
                            href="/"
                            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                        >
                            {t("backToHome")}
                        </Link>
                    </div>
                    {error.digest && (
                        <p className="text-xs text-muted-foreground">
                            {t("errorReference")}: {error.digest}
                        </p>
                    )}
                </div>
            </body>
        </html>
    );
}
