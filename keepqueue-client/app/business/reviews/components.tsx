"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Flag, EyeOff, Eye, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks";
import type { ReviewWithUser } from "@/lib/types/business";
import { timestampToString } from "@/lib/helpers/time";

interface StatsCardProps {
    averageRating: number;
    totalReviews: number;
    distribution: number[];
}

export function StatsCard({ averageRating, totalReviews, distribution }: StatsCardProps) {
    const { t } = useLanguage();
    const maxCount = Math.max(...distribution, 1);

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                    <div className="text-5xl font-bold mb-2">{averageRating || "—"}</div>
                    <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`h-5 w-5 ${star <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {totalReviews} {t("totalReviews").toLowerCase()}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{t("ratingDistribution")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                        const count = distribution[stars - 1];
                        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                        return (
                            <div key={stars} className="flex items-center gap-2 text-sm">
                                <span className="w-6 text-right">{stars}</span>
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <div className="flex-1 bg-muted rounded-full h-2">
                                    <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                                </div>
                                <span className="w-8 text-muted-foreground text-right">{count}</span>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
}

interface ReviewCardProps {
    review: ReviewWithUser;
    index: number;
    onToggleFlag: (id: string, flagged: boolean) => void;
    timezone: string;
}

export function ReviewCard({ review, index, onToggleFlag, timezone }: ReviewCardProps) {
    const { t } = useLanguage();
    const userName = `${review.user?.firstName || ""} ${review.user?.lastName || ""}`.trim() || t("anonymous");
    const initials = `${(review.user?.firstName || "?")[0]}${(review.user?.lastName || "?")[0]}`.toUpperCase();
    const dateStr = timestampToString(review.created, { tz: timezone, format: "DD/MM/YYYY" });

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
            <Card className={review.flagged ? "border-destructive/50 opacity-75" : ""}>
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm">{userName}</p>
                                    {review.flagged && (
                                        <Badge variant="destructive" className="text-xs">
                                            <Flag className="h-3 w-3 mr-1" />
                                            {t("reviewHidden")}
                                        </Badge>
                                    )}
                                </div>
                                <span className="text-xs text-muted-foreground">{dateStr}</span>
                            </div>
                            <div className="flex gap-0.5 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`h-3.5 w-3.5 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                                    />
                                ))}
                            </div>
                            {review.text && <p className="text-sm text-muted-foreground mt-2">{review.text}</p>}
                        </div>
                    </div>
                    <div className="flex justify-end mt-3 pt-2 border-t">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onToggleFlag(review.id!, !review.flagged)}
                            className="text-xs"
                        >
                            {review.flagged ? (
                                <>
                                    <Eye className="h-3 w-3 mr-1" />
                                    {t("showReview")}
                                </>
                            ) : (
                                <>
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    {t("hideReview")}
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export function EmptyState() {
    const { t } = useLanguage();
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-muted p-4 mb-4">
                        <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{t("noReviewsYet")}</h3>
                    <p className="text-sm text-muted-foreground text-center">{t("reviewsWillAppear")}</p>
                </CardContent>
            </Card>
        </motion.div>
    );
}
