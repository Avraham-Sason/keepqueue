"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/hooks";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const { t } = useLanguage();

    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
            <Image src="/logo.png" alt={t("brandName")} width={48} height={48} />
            <h1 className="text-2xl font-bold">{t("errorTitle")}</h1>
            <p className="text-muted-foreground max-w-md">{t("errorBody")}</p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <Button onClick={reset}>{t("errorRetry")}</Button>
                <Button variant="outline" asChild>
                    <Link href="/">{t("backToHome")}</Link>
                </Button>
            </div>
            {error.digest && (
                <p className="text-xs text-muted-foreground">
                    {t("errorReference")}: {error.digest}
                </p>
            )}
        </div>
    );
}
