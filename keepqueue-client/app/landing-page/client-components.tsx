"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme";
import { useLanguage } from "@/hooks";
import { A11yToggle } from "@/components/config/a11y";
import { LanguageToggle } from "@/components/config";

const NAV_LINKS = [
    { href: "/#features", label: "navFeatures" },
    { href: "/#why", label: "navWhy" },
    { href: "/marketplace", label: "navMarketplace" },
];

const MOBILE_ONLY_LINKS = [
    { href: "/auth/signin/business", label: "businessLogin" },
    { href: "/auth/signin/customer", label: "customerLogin" },
    { href: "/privacy", label: "privacyPolicy" },
    { href: "/terms", label: "termsOfUse" },
];

export function SiteHeader() {
    const { t } = useLanguage();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center">
                        <Image src="/logo.png" alt="logo" width={32} height={32} />
                    </div>
                    <span className="text-xl font-bold">{t("brandName")}</span>
                </Link>

                <nav className="hidden md:flex items-center gap-4">
                    {NAV_LINKS.map(({ href, label }) => (
                        <Link key={href} href={href} className="text-sm font-medium hover:text-primary transition-colors">
                            {t(label)}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <A11yToggle />
                    <LanguageToggle />
                    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden" aria-label={t("menu")}>
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="top" className="pt-12">
                            <SheetTitle>{t("menu")}</SheetTitle>
                            <nav className="flex flex-col gap-1 mt-4">
                                {[...NAV_LINKS, ...MOBILE_ONLY_LINKS].map(({ href, label }) => (
                                    <Link
                                        key={href}
                                        href={href}
                                        onClick={() => setMenuOpen(false)}
                                        className="py-2 text-base font-medium hover:text-primary transition-colors"
                                    >
                                        {t(label)}
                                    </Link>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
