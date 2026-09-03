import type React from "react";
import type { Metadata } from "next";
import { Heebo, Rubik } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme";
import { QueryProvider } from "@/components/query";
import { getServerTranslation, getServerLanguage } from "@translations/server";
import { LanguageInitializer, A11yInitializer } from "@/components/config";
import { cn } from "@/lib/utils";
import { Version } from "@/components/version";
import GlobalConfig from "@/components/config/GlobalConfig";
import { Toaster } from "@/components/ui/sonner";

// The product's default language is Hebrew and Inter has no Hebrew glyphs, so every Hebrew
// character fell back to a system font. globals.css already asked for --font-heebo and
// --font-rubik; nothing had ever defined them.
const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo", display: "swap" });
const rubik = Rubik({ subsets: ["hebrew", "latin"], variable: "--font-rubik", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
    const lang = await getServerLanguage();
    const t = await getServerTranslation();
    const title = t("metaSiteTitle");
    const description = t("metaSiteDescription");

    return {
        metadataBase: new URL("https://keepqueue.com"),
        title,
        description,
        keywords: t("metaSiteKeywords").split(",").map((keyword) => keyword.trim()),
        openGraph: {
            title,
            description,
            siteName: t("brandName"),
            locale: lang === "he" ? "he_IL" : "en_US",
            type: "website",
            images: [
                {
                    url: "/logo.png",
                    width: 1200,
                    height: 630,
                    alt: t("brandName"),
                },
            ],
        },
        icons: {
            icon: "/logo.png",
            shortcut: "/logo.png",
            apple: "/logo.png",
        },
    };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const lang = await getServerLanguage();
    const t = await getServerTranslation();
    return (
        <html lang={lang} dir={lang === "he" ? "rtl" : "ltr"} suppressHydrationWarning>
            <body className={cn(heebo.variable, rubik.variable, heebo.className, "w-screen min-h-dvh")} suppressHydrationWarning>
                <A11yInitializer />
                <Version />
                <LanguageInitializer />
                <GlobalConfig />
                <QueryProvider>
                    <ThemeProvider  attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-background focus:px-4 focus:py-2">
                            {t("skipToMain")}
                        </a>
                        <div id="main-content">{children}</div>
                        <Toaster />
                    </ThemeProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
