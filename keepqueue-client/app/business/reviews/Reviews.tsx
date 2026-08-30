"use client";

import { useBusinessesStore, useSettingsStore } from "@/lib/store";
import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks";
import { useReviewStats } from "./hooks";
import { StatsCard, ReviewCard, EmptyState } from "./components";
import { setDocument } from "@/lib/firebase";
import { useRefreshBusiness } from "../hooks";

function Reviews() {
    const { t } = useLanguage();
    const currentBusiness = useBusinessesStore.currentBusiness();
    const timezone = useSettingsStore.userTimeZone();
    const reviews = currentBusiness?.reviews || [];
    const refreshBusiness = useRefreshBusiness();
    const { averageRating, totalReviews, distribution } = useReviewStats(reviews);

    const handleToggleFlag = async (reviewId: string, flagged: boolean) => {
        try {
            await setDocument("reviews", reviewId, { flagged });
            refreshBusiness();
        } catch (error) {
            console.error("Error toggling review flag:", error);
        }
    };

    if (!currentBusiness) return null;

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h1 className="text-3xl font-bold tracking-tight">{t("reviewsTitle")}</h1>
                <p className="text-muted-foreground mt-1">{t("manageAllReviews")}</p>
            </motion.div>

            {reviews.length === 0 ? (
                <EmptyState />
            ) : (
                <>
                    <StatsCard averageRating={averageRating} totalReviews={totalReviews} distribution={distribution} />
                    <div className="grid gap-3">
                        {reviews.map((review, index) => (
                            <ReviewCard
                                key={review.id}
                                review={review}
                                index={index}
                                onToggleFlag={handleToggleFlag}
                                timezone={timezone}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default Reviews;
