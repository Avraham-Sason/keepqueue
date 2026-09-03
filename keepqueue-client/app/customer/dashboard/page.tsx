"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore, useSettingsStore } from "@/lib/store";
import { useLanguage } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, XCircle, CalendarDays, Star } from "lucide-react";
import { motion } from "framer-motion";
import { apiCall } from "@/lib/helpers";
import { timestampToString } from "@/lib/helpers/time";
import type { CalendarEvent, CalendarEventStatus, Customer } from "@/lib/types";
import Link from "next/link";

const statusVariant: Record<CalendarEventStatus, "default" | "secondary" | "destructive" | "outline"> = {
    BOOKED: "secondary",
    CONFIRMED: "default",
    CANCELLED: "destructive",
    NO_SHOW: "destructive",
    DONE: "outline",
};

export default function CustomerDashboardPage() {
    const { t } = useLanguage();
    const user = useAuthStore.user();
    const timezone = useSettingsStore.userTimeZone();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [cancelDialogId, setCancelDialogId] = useState<string | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [reviewTarget, setReviewTarget] = useState<any | null>(null);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [reviewedEventIds, setReviewedEventIds] = useState<string[]>([]);

    useEffect(() => {
        if (!user?.id) return;

        const fetchAppointments = async () => {
            try {
                const result = await apiCall<any[]>("POST", "data", "getMyAppointments");
                setAppointments(result || []);
                setLoadError(null);
            } catch (error) {
                setLoadError(error instanceof Error ? error.message : t("errorGeneric"));
            } finally {
                setIsLoading(false);
            }
        };

        fetchAppointments();
    }, [user?.id]);

    const { upcoming, past } = useMemo(() => {
        const now = Date.now() / 1000;
        const upcoming: any[] = [];
        const past: any[] = [];

        appointments.forEach((apt) => {
            const ts = apt.start?.seconds || apt.start?._seconds || 0;
            if (ts > now && apt.status !== "CANCELLED") {
                upcoming.push(apt);
            } else {
                past.push(apt);
            }
        });

        upcoming.sort((a, b) => {
            const aTs = a.start?.seconds || a.start?._seconds || 0;
            const bTs = b.start?.seconds || b.start?._seconds || 0;
            return aTs - bTs;
        });

        past.sort((a, b) => {
            const aTs = a.start?.seconds || a.start?._seconds || 0;
            const bTs = b.start?.seconds || b.start?._seconds || 0;
            return bTs - aTs;
        });

        return { upcoming, past };
    }, [appointments]);

    const handleCancel = async (eventId: string) => {
        setIsCancelling(true);
        setCancelError(null);
        try {
            await apiCall("POST", "actions", "businesses/appointments/cancel", { calendarEventId: eventId });
            setAppointments((prev) => prev.map((a) => (a.id === eventId ? { ...a, status: "CANCELLED" } : a)));
            setCancelDialogId(null);
        } catch (error) {
            // Leaving the dialog open with a message is the point: closing it on failure told
            // the customer their appointment was cancelled when it was not.
            setCancelError(error instanceof Error ? error.message : t("errorGeneric"));
        } finally {
            setIsCancelling(false);
        }
    };

    const openReviewDialog = (appointment: any) => {
        setReviewTarget(appointment);
        setReviewRating(0);
        setReviewText("");
        setReviewError(null);
    };

    const handleSubmitReview = async () => {
        if (!reviewTarget || !user?.id) return;
        if (reviewRating < 1) {
            setReviewError(t("reviewErrorSelectRating"));
            return;
        }

        setIsSubmittingReview(true);
        setReviewError(null);
        try {
            const text = reviewText.trim();
            await apiCall("POST", "actions", "businesses/reviews/create", {
                businessId: reviewTarget.businessId,
                userId: user.id,
                calendarEventId: reviewTarget.id,
                rating: reviewRating,
                ...(text ? { text } : {}),
            });
            setReviewedEventIds((prev) => [...prev, reviewTarget.id]);
            setReviewTarget(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : "";
            if (message.toLowerCase().includes("already reviewed")) {
                setReviewedEventIds((prev) => (prev.includes(reviewTarget.id) ? prev : [...prev, reviewTarget.id]));
                setReviewError(t("reviewAlreadySubmitted"));
            } else {
                setReviewError(message || t("reviewErrorGeneric"));
            }
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const customerBusinessIds = (user as Customer)?.businessIds || [];

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t("hello")}, {user?.firstName}
                </h1>
                <p className="text-muted-foreground mt-1">{t("welcomeCustomerPanel")}</p>
            </motion.div>

            {customerBusinessIds.length > 0 && (
                <div className="flex gap-2">
                    {customerBusinessIds.map((bid) => (
                        <Button key={bid} variant="outline" size="sm" asChild>
                            <Link href={`/home/${bid}`}>
                                <CalendarDays className="h-4 w-4 me-1" />
                                {t("bookNewAppointment")}
                            </Link>
                        </Button>
                    ))}
                </div>
            )}

            {loadError && (
                <Card className="border-destructive">
                    <CardContent className="py-4 text-sm text-destructive">{loadError}</CardContent>
                </Card>
            )}

            {/* Upcoming */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {t("upcomingAppointmentsTitle")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {upcoming.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">{t("noUpcomingAppointmentsCustomer")}</p>
                    ) : (
                        <div className="space-y-3">
                            {upcoming.map((apt, i) => (
                                <motion.div
                                    key={apt.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center justify-between p-3 rounded-lg border"
                                >
                                    <div>
                                        <p className="font-medium">{apt.serviceName || apt.title}</p>
                                        {apt.businessName && <p className="text-sm text-muted-foreground">{apt.businessName}</p>}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                            <Clock className="h-3 w-3" />
                                            <span>
                                                {timestampToString(apt.start, { tz: timezone, format: "DD/MM/YYYY HH:mm" })}
                                            </span>
                                            <Badge variant={statusVariant[apt.status as CalendarEventStatus]}>
                                                {t(`status${apt.status}`)}
                                            </Badge>
                                        </div>
                                    </div>
                                    {(apt.status === "BOOKED" || apt.status === "CONFIRMED") && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setCancelDialogId(apt.id)}
                                            className="text-destructive"
                                        >
                                            <XCircle className="h-3 w-3 me-1" />
                                            {t("cancel")}
                                        </Button>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Past */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("pastAppointments")}</CardTitle>
                </CardHeader>
                <CardContent>
                    {past.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">{t("noPastAppointments")}</p>
                    ) : (
                        <div className="space-y-3">
                            {past.slice(0, 10).map((apt) => (
                                <div key={apt.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border opacity-75">
                                    <div>
                                        <p className="font-medium">{apt.serviceName || apt.title}</p>
                                        {apt.businessName && <p className="text-sm text-muted-foreground">{apt.businessName}</p>}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{timestampToString(apt.start, { tz: timezone, format: "DD/MM/YYYY HH:mm" })}</span>
                                            <Badge variant={statusVariant[apt.status as CalendarEventStatus]}>
                                                {t(`status${apt.status}`)}
                                            </Badge>
                                        </div>
                                    </div>
                                    {apt.status === "DONE" &&
                                        (reviewedEventIds.includes(apt.id) ? (
                                            <span className="text-sm text-muted-foreground shrink-0">{t("reviewThanks")}</span>
                                        ) : (
                                            <Button size="sm" variant="outline" className="shrink-0" onClick={() => openReviewDialog(apt)}>
                                                <Star className="h-3 w-3 me-1" />
                                                {t("leaveReview")}
                                            </Button>
                                        ))}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog
                open={reviewTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setReviewTarget(null);
                        setReviewError(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>{t("leaveReview")}</DialogTitle>
                        <DialogDescription>
                            {reviewTarget?.businessName ? `${t("reviewFor")} ${reviewTarget.businessName}` : t("reviewDialogDescription")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t("reviewRatingLabel")}</Label>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        aria-label={`${star} ${t("stars")}`}
                                        aria-pressed={reviewRating === star}
                                        onClick={() => setReviewRating(star)}
                                        className="p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <Star
                                            className={`h-6 w-6 ${
                                                star <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reviewText">{t("reviewTextLabel")}</Label>
                            <Textarea
                                id="reviewText"
                                maxLength={2000}
                                value={reviewText}
                                placeholder={t("reviewTextPlaceholder")}
                                onChange={(e) => setReviewText(e.target.value)}
                            />
                        </div>
                        {reviewError && (
                            <p role="alert" className="text-sm text-destructive">
                                {reviewError}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReviewTarget(null)} disabled={isSubmittingReview}>
                            {t("back")}
                        </Button>
                        <Button onClick={handleSubmitReview} disabled={isSubmittingReview || reviewRating < 1}>
                            {isSubmittingReview ? t("processing") : t("submitReview")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={cancelDialogId !== null} onOpenChange={(open) => { if (!open) { setCancelDialogId(null); setCancelError(null); } }}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>{t("cancelMyAppointment")}</DialogTitle>
                        <DialogDescription>{t("cancelAppointmentCustomerConfirm")}</DialogDescription>
                    </DialogHeader>
                    {cancelError && <p className="text-sm text-destructive">{cancelError}</p>}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogId(null)} disabled={isCancelling}>
                            {t("back")}
                        </Button>
                        <Button variant="destructive" onClick={() => cancelDialogId && handleCancel(cancelDialogId)} disabled={isCancelling}>
                            {isCancelling ? t("processing") : t("cancelAppointment")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
