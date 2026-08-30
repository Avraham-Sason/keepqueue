"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore, useSettingsStore } from "@/lib/store";
import { useLanguage } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, XCircle, CalendarDays } from "lucide-react";
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

    useEffect(() => {
        if (!user?.id) return;

        const fetchAppointments = async () => {
            try {
                const result = await apiCall<any[]>("POST", "data", "getCollection", {
                    collectionName: "calendar",
                    conditions: [{ field: "userId", operator: "==", value: user.id }],
                });
                setAppointments(result || []);
            } catch (error) {
                console.error("Error fetching appointments:", error);
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
        try {
            await apiCall("POST", "actions", "businesses/appointments/cancel", { calendarEventId: eventId });
            setAppointments((prev) => prev.map((a) => (a.id === eventId ? { ...a, status: "CANCELLED" } : a)));
            setCancelDialogId(null);
        } catch (error) {
            console.error("Error cancelling:", error);
        } finally {
            setIsCancelling(false);
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
                                <CalendarDays className="h-4 w-4 mr-1" />
                                {t("bookNewAppointment")}
                            </Link>
                        </Button>
                    ))}
                </div>
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
                                        <p className="font-medium">{apt.title}</p>
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
                                            <XCircle className="h-3 w-3 mr-1" />
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
                                <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg border opacity-75">
                                    <div>
                                        <p className="font-medium">{apt.title}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{timestampToString(apt.start, { tz: timezone, format: "DD/MM/YYYY HH:mm" })}</span>
                                            <Badge variant={statusVariant[apt.status as CalendarEventStatus]}>
                                                {t(`status${apt.status}`)}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={cancelDialogId !== null} onOpenChange={(open) => !open && setCancelDialogId(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>{t("cancelMyAppointment")}</DialogTitle>
                        <DialogDescription>{t("cancelAppointmentCustomerConfirm")}</DialogDescription>
                    </DialogHeader>
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
