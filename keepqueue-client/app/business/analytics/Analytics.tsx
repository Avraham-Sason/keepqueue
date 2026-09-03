"use client";

import { useBusinessesStore } from "@/lib/store";
import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks";
import { useAnalytics } from "./hooks";
import { KpiCard, PeriodSelector, TopServicesCard, getKpiCards } from "./components";
import BusinessLoading from "../loading";

function Analytics() {
    const { t } = useLanguage();
    const currentBusiness = useBusinessesStore.currentBusiness();
    const currency = currentBusiness?.currency || "₪";

    const { totalBookings, noShows, cancellations, noShowRate, cancellationRate, topServices, totalRevenue, isLoading, isError, period, setPeriod } =
        useAnalytics(currentBusiness?.id);

    if (!currentBusiness) return null;

    const kpiCards = getKpiCards(t, { totalBookings, noShows, cancellations, noShowRate, cancellationRate, totalRevenue });

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("analyticsTitle")}</h1>
                    <p className="text-muted-foreground mt-1">{t("manageAnalytics")}</p>
                </div>
                <PeriodSelector period={period} setPeriod={setPeriod} />
            </motion.div>

            {isError ? (
                <p className="text-sm text-destructive">{t("analyticsLoadError")}</p>
            ) : isLoading ? (
                <BusinessLoading />
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {kpiCards.map((card, index) => (
                            <KpiCard key={card.title} title={card.title} value={card.value} icon={card.icon} index={index} subtitle={card.subtitle} />
                        ))}
                    </div>

                    <TopServicesCard topServices={topServices} currency={currency} />
                </>
            )}
        </div>
    );
}

export default Analytics;
