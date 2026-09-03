import type { Metadata } from "next";
import { getServerLanguage, getServerTranslation } from "@translations/server";
import LandingPage from "./landing-page";


export async function generateMetadata(): Promise<Metadata> {
    const lang = await getServerLanguage();
    const t = await getServerTranslation();
    const title = t("metaHomeTitle");
    const description = t("metaHomeDescription");

    return {
        title,
        description,
        keywords: t("metaSiteKeywords").split(",").map((keyword) => keyword.trim()),
        alternates: { canonical: "/" },
        openGraph: {
            title,
            description,
            url: "https://keepqueue.com",
            siteName: t("brandName"),
            locale: lang === "he" ? "he_IL" : "en_US",
            type: "website",
            images: [
                {
                    url: "https://keepqueue.com/logo.png",
                    width: 1200,
                    height: 630,
                    alt: t("brandName"),
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: ["https://keepqueue.com/logo.png"],
        },
    };
}

export default async function HomePage() {
    const t = await getServerTranslation();
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Keepqueue",
        "url": "https://keepqueue.com",
        "operatingSystem": "Web",
        "applicationCategory": "BusinessApplication",
        "description": t("metaHomeDescription"),
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "ILS"
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <LandingPage />
        </>
    );
}
