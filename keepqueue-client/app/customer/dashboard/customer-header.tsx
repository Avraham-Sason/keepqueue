"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme";
import { A11yToggle } from "@/components/config/a11y";
import Link from "next/link";
import { useLanguage } from "@/hooks";
import { useAuthStore } from "@/lib/store";
import Image from "next/image";

export function CustomerHeader() {
    const { t } = useLanguage();
    const user = useAuthStore.user();
    const logout = useAuthStore.logout();
    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 py-2">
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1">
                    <Link href="/customer/marketplace" className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-lg  flex items-center justify-center">
                            <Image src="/logo.png" alt="logo" width={32} height={32} />
                        </div>
                        <span className="text-xl hidden sm:block font-bold">{t("brandName")}</span>
                    </Link>
                    <A11yToggle />
                    <ThemeToggle />
                </div>
                {(user?.firstName || user?.lastName) && (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.photoURL ?? "/placeholder.svg?height=32&width=32"} />
                                <AvatarFallback>UN</AvatarFallback>
                            </Avatar>
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium">
                                    {user?.firstName ?? ""} {user?.lastName ?? ""}
                                </p>
                            </div>
                        </div>

                        <Button variant="outline" size="sm" asChild>
                            <Link href="/" onClick={logout}>
                                <LogOut className="h-4 w-4 mr-2" />
                                {t("signOut")}
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </header>
    );
}
