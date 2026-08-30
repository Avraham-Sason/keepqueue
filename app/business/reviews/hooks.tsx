import { useMemo } from "react";
import type { Review } from "@/lib/types";
import type { BusinessWithRelations } from "@/lib/types/business";

interface ReviewWithUser extends Review {
    user: { firstName?: string; lastName?: string; email?: string };
}

export function useReviewStats(reviews: ReviewWithUser[]) {
    return useMemo(() => {
        if (reviews.length === 0) {
            return { averageRating: 0, totalReviews: 0, distribution: [0, 0, 0, 0, 0] };
        }

        const totalReviews = reviews.length;
        const sumRating = reviews.reduce((acc, r) => acc + r.rating, 0);
        const averageRating = Math.round((sumRating / totalReviews) * 10) / 10;

        const distribution = [0, 0, 0, 0, 0];
        reviews.forEach((r) => {
            distribution[r.rating - 1]++;
        });

        return { averageRating, totalReviews, distribution };
    }, [reviews]);
}
