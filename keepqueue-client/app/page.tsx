import type { Metadata } from "next";
import { getServerTranslation } from "@translations/server";
import LandingPage from "./landing-page";


export async function generateMetadata(): Promise<Metadata> {
    const t = await getServerTranslation();
    const title = `KeepQueue | מערכת זימון תורים חכמה לעסקים - ${t("heroMain")} ${t("heroSub")}`;
    const description = "הפלטפורמה המתקדמת ביותר לניהול וזימון תורים אונליין. ייעלו את העסק שלכם ואפשרו ללקוחות להזמין תור בקליק בצורה פשוטה ומהירה.";
    
    return {
        title,
        description,
        keywords: ["זימון תורים", "מערכת לזימון תורים", "ניהול תורים", "יומן תורים דיגיטלי", "KeepQueue"],
        openGraph: {
            title,
            description,
            url: "https://keepqueue.com",
            siteName: t("brandName"),
            locale: "he_IL",
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

export default function HomePage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "KeepQueue",
        "operatingSystem": "Web",
        "applicationCategory": "BusinessApplication",
        "description": "מערכת חכמה לזימון וניהול תורים אונליין לעסקים ולקוחות.",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "ILS"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "120"
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
