import { jsonFailed, jsonOK } from "../../../helpers";
import { logAudit } from "../../../helpers/audit";
import { RouterService, Review } from "../../../types";
import { db, firebaseTimestamp } from "../../../firebase";
import { cacheManager } from "../../../managers";
import { CreateReviewModel, ModerateReviewModel } from "./schemes";

export const SCreateReview: RouterService = async (req, res, next) => {
    try {
        const body = req.body as CreateReviewModel;

        // If calendarEventId provided, verify appointment exists and is DONE
        if (body.calendarEventId) {
            const calendarMap = cacheManager.get("calendarMap", new Map());
            const appointment = calendarMap.get(body.calendarEventId);
            if (!appointment) {
                res.json(jsonFailed("Appointment not found"));
                return;
            }
            if (appointment.status !== "DONE") {
                res.json(jsonFailed("Can only review completed appointments"));
                return;
            }
        }

        // Check for duplicate review on same appointment
        if (body.calendarEventId) {
            const reviews = cacheManager.get("reviews", []) as Review[];
            const existing = reviews.find(
                (r) => r.calendarEventId === body.calendarEventId && r.userId === body.userId
            );
            if (existing) {
                res.json(jsonFailed("You have already reviewed this appointment"));
                return;
            }
        }

        const newRef = db.collection("reviews").doc();
        const reviewDoc: Review = {
            id: newRef.id,
            businessId: body.businessId,
            userId: body.userId,
            calendarEventId: body.calendarEventId || "",
            rating: body.rating as 1 | 2 | 3 | 4 | 5,
            text: body.text || "",
            flagged: false,
            created: firebaseTimestamp(),
            timestamp: firebaseTimestamp(),
        };

        await newRef.set(reviewDoc);

        // Update business rating aggregates
        const reviews = cacheManager.get("reviews", []) as Review[];
        const businessReviews = reviews.filter((r) => r.businessId === body.businessId);
        const allRatings = [...businessReviews.map((r) => r.rating), body.rating];
        const ratingAvg = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
        const ratingCount = allRatings.length;

        await db.collection("businesses").doc(body.businessId).update({
            ratingAvg: Math.round(ratingAvg * 100) / 100,
            ratingCount,
            timestamp: firebaseTimestamp(),
        });

        res.json(jsonOK({ reviewId: newRef.id }));
    } catch (error) {
        next(error);
    }
};

export const SModerateReview: RouterService = async (req, res, next) => {
    try {
        const { reviewId, flagged } = req.body as ModerateReviewModel;
        const reviewsMap = cacheManager.get("reviewsMap", new Map());
        const existing = reviewsMap.get(reviewId);
        if (!existing) {
            res.json(jsonFailed("Review not found"));
            return;
        }

        await db.collection("reviews").doc(reviewId).update({
            flagged,
            timestamp: firebaseTimestamp(),
        });

        logAudit({ businessId: existing.businessId, userId: "", entity: "reviews", action: "moderate", subEntity: reviewId });

        res.json(jsonOK({ reviewId, flagged }));
    } catch (error) {
        next(error);
    }
};
