import type { Metadata } from "next";
import { getServerTranslation } from "@translations/server";
import { Marketplace } from "./components";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getServerTranslation();
    const title = `${t("marketplaceTitle")} | ${t("brandName")}`;
    const description = t("marketplaceSubtitle");

    return {
        title,
        description,
        alternates: { canonical: "/marketplace" },
        openGraph: {
            title,
            description,
            url: "/marketplace",
            siteName: t("brandName"),
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
    };
}

export default async function MarketplacePage() {
    const t = await getServerTranslation();

    return (
        <main className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
            <header className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">{t("marketplaceTitle")}</h1>
                <p className="text-muted-foreground">{t("marketplaceSubtitle")}</p>
            </header>
            <Marketplace />
        </main>
    );
}
