import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme";
import { QueryProvider } from "@/components/query";
import { getServerTranslation, getServerLanguage } from "@translations/server";
import { LanguageInitializer, A11yInitializer } from "@/components/config";
import { cn } from "@/lib/utils";
import { Version } from "@/components/version";
import GlobalConfig from "@/components/config/GlobalConfig";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
    const t = await getServerTranslation();
    const title = `KeepQueue | מערכת זימון תורים חכמה לעסקים`;
    const description = "KeepQueue - הפלטפורמה המובילה לניהול וזימון תורים אונליין. פתרון חכם, מהיר וידידותי לעסקים וללקוחות.";
    
    return {
        metadataBase: new URL("https://keepqueue.com"),
        alternates: { canonical: "/" },
        title,
        description,
        keywords: ["זימון תורים", "מערכת לזימון תורים", "ניהול תורים", "KeepQueue"],
        generator: "v0.dev",
        openGraph: {
            title,
            description,
            siteName: t("brandName"),
            locale: "he_IL",
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
            <body className={cn(inter.className, "w-screen min-h-dvh")} suppressHydrationWarning>
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
                    </ThemeProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
