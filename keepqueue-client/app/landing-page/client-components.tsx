"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme";
import { useLanguage } from "@/hooks";
import { A11yToggle } from "@/components/config/a11y";
import { LanguageToggle } from "@/components/config";
import Image from "next/image";

export function SiteHeader() {
    const { t } = useLanguage();
    return (
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center">
                        <Image src="/logo.png" alt="logo" width={32} height={32} />
                    </div>
                    <span className="text-xl font-bold">{t("brandName")}</span>
                </div>

                <nav className="hidden md:flex items-center gap-4">
                    <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
                        {t("navFeatures")}
                    </Link>
                    <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
                        {t("navPricing")}
                    </Link>
                    <Link href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
                        {t("navTestimonials")}
                    </Link>
                    <Link href="/customer/marketplace" className="text-sm font-medium hover:text-primary transition-colors">
                        {t("navMarketplace")}
                    </Link>
                </nav>
                <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <A11yToggle />
                    <LanguageToggle />
                </div>
            </div>
        </header>
    );
}

export function NewsletterSection() {
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    return (
        <section className="py-20 px-4 bg-primary/5">
            <div className="container max-w-4xl mx-auto text-center">
                <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("newsletterReady")}</h2>
                    <p className="text-xl text-muted-foreground mb-8">{t("newsletterJoin")}</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto mb-8">
                        <Input
                            type="email"
                            placeholder={t("newsletterEmailPlaceholder")}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1"
                        />
                        <Button>{t("startNow")}</Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
