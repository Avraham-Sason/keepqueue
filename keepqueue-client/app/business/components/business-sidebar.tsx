"use client";

import { Calendar, Home, Users, Users2, Settings, BarChart3, Clock, Star, LogOut, Edit } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    useSidebar,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLanguage, useIsMobile } from "@/hooks";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore, useSettingsStore } from "@/lib/store";
import { useBusinessesStore } from "@/lib/store/businesses";
import Image from "next/image";
import { A11yToggle, LanguageToggle } from "@/components/config";
import { ThemeToggle } from "@/components/theme";
import { usePathname, useRouter } from "next/navigation";

const menuItems = [
    {
        title: "dashboard",
        url: "/business/dashboard",
        icon: Home,
    },
    {
        title: "editDetails",
        url: "/business/editDetails",
        icon: Edit,
    },
    {
        title: "calendar",
        url: "/business/calendar",
        icon: Calendar,
    },
    {
        title: "appointments",
        url: "/business/appointments",
        icon: Clock,
    },
    {
        title: "customers",
        url: "/business/customers",
        icon: Users,
    },
    {
        title: "services",
        url: "/business/services",
        icon: Settings,
    },
    {
        title: "staff",
        url: "/business/staff",
        icon: Users2,
    },
    {
        title: "analytics",
        url: "/business/analytics",
        icon: BarChart3,
    },
    {
        title: "reviews",
        url: "/business/reviews",
        icon: Star,
    },
];

export function BusinessSidebar() {
    const pathname = usePathname();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState(pathname.split("/")[2] || menuItems[0].title);
    const { toggleSidebar } = useSidebar();
    const isMobile = useIsMobile();

    const user = useAuthStore.user();
    const logout = useAuthStore.logout();
    const isRtl = useSettingsStore.isRtl();
    const currentBusiness = useBusinessesStore.currentBusiness();
    const router = useRouter();

    const handleSignOut = async () => {
        await logout();
        router.replace("/");
    };

    if (!user || !currentBusiness) {
        return null;
    }
    return (
        <Sidebar side={isRtl ? "right" : "left"} variant="sidebar">
            <SidebarHeader className="p-4 flex flex-row justify-between items-start">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center">
                        <Image src="/logo.png" alt="logo" width={32} height={32} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">{t("brandName")}</h2>
                        <p className="text-xs text-muted-foreground">{t("businessAdminPanel")}</p>
                    </div>
                </div>
                <SidebarTrigger className="-ml-1" isClose={true} />
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>{t("businessManagement")}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu onClick={() => isMobile && toggleSidebar()}>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={activeTab === item.title} onClick={() => setActiveTab(item.title)}>
                                        <Link href={`${item.url}`} className={cn("flex items-center justify-between")}>
                                            <div className={"flex items-center gap-2 "}>
                                                <item.icon className="h-4 w-4" />
                                                <span>{t(item.title)}</span>
                                            </div>
                                            {/* {item.badge && (
                                                <Badge variant="secondary" className="ml-auto">
                                                    {item.badge}
                                                </Badge>
                                            )} */}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-3 ">
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL ?? "/placeholder.svg?height=32&width=32"} />
                        <AvatarFallback>SA</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{currentBusiness?.name ?? t("brandName")}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <A11yToggle />
                    <ThemeToggle />
                    <LanguageToggle />
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4 me-2" />
                        {t("signOut")}
                    </Button>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
