import { jsonFailed, jsonOK } from "../../../helpers";
import { logAudit } from "../../../helpers/audit";
import { CalendarEvent, RouterService, Review } from "../../../types";
import { db, firebaseTimestamp } from "../../../firebase";
import { cacheManager } from "../../../managers";
import { AuthenticatedRequest } from "../../../middlewares/authGuard";
import { CreateReviewModel, ModerateReviewModel } from "./schemes";


/**
 * Recomputes the business's public score from the reviews that count.
 *
 * Both writers need this and only one had it, so hiding an abusive review left it shaping the
 * rating for ever. Flagged reviews are excluded here exactly as they are excluded from the
 * public list, so the number and the reviews behind it always agree.
 */
const recomputeBusinessRating = async (businessId: string, extraRating?: number) => {
    const reviews = cacheManager.get("reviews", []) as Review[];
    const ratings = reviews.filter((r) => r.businessId === businessId && !r.flagged).map((r) => r.rating as number);
    if (extraRating !== undefined) ratings.push(extraRating);

    const ratingCount = ratings.length;
    const ratingAvg = ratingCount ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratingCount) * 100) / 100 : 0;

    await db.collection("businesses").doc(businessId).update({ ratingAvg, ratingCount, timestamp: firebaseTimestamp() });
    return { ratingAvg, ratingCount };
};

export const SCreateReview: RouterService = async (req, res, next) => {
    try {
        const body = req.body as CreateReviewModel;

        // Reviews are the public signal a stranger judges the business by, so the review has to
        // be tied to the person who actually attended.
        //
        // requireSelfOrBusinessOwner lets the business through on any userId — right for booking
        // on a customer's behalf, wrong here: it let an owner publish five-star reviews as
        // arbitrary users. A review is always written by its own author.
        const requester = (req as AuthenticatedRequest).user;
        if (!requester || body.userId !== requester.uid) {
            res.status(403).json(jsonFailed("A review can only be left by the person who wrote it"));
            return;
        }

        const business = (cacheManager.get("businessesMap", new Map()) as Map<string, unknown>).get(body.businessId);
        if (!business) {
            res.status(404).json(jsonFailed("Business not found"));
            return;
        }

        if (body.calendarEventId) {
            const calendarMap = cacheManager.get("calendarMap", new Map());
            const appointment = calendarMap.get(body.calendarEventId) as CalendarEvent | undefined;
            if (!appointment) {
                res.status(404).json(jsonFailed("Appointment not found"));
                return;
            }
            // The appointment was only checked for being DONE. Citing somebody else's completed
            // appointment, at a different business, passed the "verified review" gate and then
            // moved the unrelated business's public rating.
            if (appointment.userId !== body.userId || appointment.businessId !== body.businessId) {
                res.status(403).json(jsonFailed("That appointment is not yours"));
                return;
            }
            if (appointment.status !== "DONE") {
                res.status(422).json(jsonFailed("Can only review completed appointments"));
                return;
            }

            const reviews = cacheManager.get("reviews", []) as Review[];
            const existing = reviews.find((r) => r.calendarEventId === body.calendarEventId && r.userId === body.userId);
            if (existing) {
                res.status(409).json(jsonFailed("You have already reviewed this appointment"));
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
        await recomputeBusinessRating(body.businessId, body.rating);

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

        // The cache still holds the pre-update flag, so hand the recompute the new value rather
        // than waiting for the snapshot listener to catch up.
        const reviews = (cacheManager.get("reviews", []) as Review[]).map((r) => (r.id === reviewId ? { ...r, flagged } : r));
        cacheManager.set("reviews", reviews);
        const totals = await recomputeBusinessRating(existing.businessId);

        logAudit({
            businessId: existing.businessId,
            userId: (req as AuthenticatedRequest).user?.uid ?? "",
            entity: "reviews",
            action: "moderate",
            subEntity: reviewId,
        });

        res.json(jsonOK({ reviewId, flagged, ...totals }));
    } catch (error) {
        next(error);
    }
};
