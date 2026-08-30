"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, UserX, XCircle, DollarSign, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks";

interface KpiCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    index: number;
    subtitle?: string;
}

export function KpiCard({ title, value, icon, index, subtitle }: KpiCardProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">{title}</p>
                            <p className="text-3xl font-bold mt-1">{value}</p>
                            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
                        </div>
                        <div className="rounded-full bg-muted p-3">{icon}</div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

interface PeriodSelectorProps {
    period: string;
    setPeriod: (val: string) => void;
}

export function PeriodSelector({ period, setPeriod }: PeriodSelectorProps) {
    const { t } = useLanguage();
    return (
        <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="7">{t("last7Days")}</SelectItem>
                <SelectItem value="30">{t("last30Days")}</SelectItem>
                <SelectItem value="90">{t("last90Days")}</SelectItem>
            </SelectContent>
        </Select>
    );
}

interface TopServicesCardProps {
    topServices: { name: string; revenue: number; count: number }[];
    currency: string;
}

export function TopServicesCard({ topServices, currency }: TopServicesCardProps) {
    const { t } = useLanguage();
    const maxCount = Math.max(...topServices.map((s) => s.count), 1);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {t("topServices")}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {topServices.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{t("noDataAvailable")}</p>
                ) : (
                    topServices.map((svc) => {
                        const percentage = (svc.count / maxCount) * 100;
                        return (
                            <div key={svc.name} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{svc.name}</span>
                                    <span className="text-muted-foreground">
                                        {svc.count} {t("bookings")} · {currency}
                                        {svc.revenue}
                                    </span>
                                </div>
                                <div className="bg-muted rounded-full h-2">
                                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}

export function getKpiCards(t: (key: string) => string, stats: any) {
    return [
        {
            title: t("totalBookings"),
            value: stats.totalBookings,
            icon: <CalendarDays className="h-5 w-5 text-muted-foreground" />,
        },
        {
            title: t("noShowRate"),
            value: `${stats.noShowRate}%`,
            icon: <UserX className="h-5 w-5 text-muted-foreground" />,
            subtitle: `${stats.noShows} ${t("totalReviews").toLowerCase()}`,
        },
        {
            title: t("cancellationRate"),
            value: `${stats.cancellationRate}%`,
            icon: <XCircle className="h-5 w-5 text-muted-foreground" />,
            subtitle: `${stats.cancellations} ${t("cancelled").toLowerCase()}`,
        },
        {
            title: t("revenue"),
            value: `${stats.totalRevenue}`,
            icon: <DollarSign className="h-5 w-5 text-muted-foreground" />,
        },
    ];
}
