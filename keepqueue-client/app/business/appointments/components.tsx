"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Clock, UserX, Search } from "lucide-react";
import { motion } from "framer-motion";
import type { CalendarEventStatus, CalendarEventWithRelations, Service } from "@/lib/types";
import { getStatusVariant } from "./helpers";
import { useLanguage } from "@/hooks";
import { timestampToString } from "@/lib/helpers/time";

interface AppointmentFiltersProps {
    statusFilter: CalendarEventStatus | "ALL";
    setStatusFilter: (value: CalendarEventStatus | "ALL") => void;
    serviceFilter: string;
    setServiceFilter: (value: string) => void;
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    services: Service[];
}

export function AppointmentFilters({
    statusFilter,
    setStatusFilter,
    serviceFilter,
    setServiceFilter,
    searchQuery,
    setSearchQuery,
    services,
}: AppointmentFiltersProps) {
    const { t } = useLanguage();
    const statuses: (CalendarEventStatus | "ALL")[] = ["ALL", "BOOKED", "CONFIRMED", "CANCELLED", "NO_SHOW", "DONE"];

    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={t("searchAppointments")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as CalendarEventStatus | "ALL")}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {statuses.map((s) => (
                        <SelectItem key={s} value={s}>
                            {s === "ALL" ? t("allStatuses") : t(`status${s}`)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">{t("allServices")}</SelectItem>
                    {services
                        .filter((s) => s.active)
                        .map((s) => (
                            <SelectItem key={s.id} value={s.id!}>
                                {s.name}
                            </SelectItem>
                        ))}
                </SelectContent>
            </Select>
        </div>
    );
}

interface AppointmentCardProps {
    event: CalendarEventWithRelations;
    index: number;
    isProcessing: boolean;
    onConfirm: (id: string) => void;
    onCancelDialog: (id: string) => void;
    onMarkNoShow: (id: string) => void;
    onMarkDone: (id: string) => void;
    timezone: string;
}

export function AppointmentCard({
    event,
    index,
    isProcessing,
    onConfirm,
    onCancelDialog,
    onMarkNoShow,
    onMarkDone,
    timezone,
}: AppointmentCardProps) {
    const { t } = useLanguage();
    const userName = `${event.user?.firstName || ""} ${event.user?.lastName || ""}`.trim() || t("anonymous");
    const initials = `${(event.user?.firstName || "?")[0]}${(event.user?.lastName || "?")[0]}`.toUpperCase();
    const serviceName = event.service?.name || event.title;

    const startStr = timestampToString(event.start, { format: "DD/MM/YYYY", tz: timezone });
    const timeStr = timestampToString(event.start, { format: "HH:mm", tz: timezone });

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
            <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-medium truncate">{userName}</p>
                                <Badge variant={getStatusVariant(event.status)}>{t(`status${event.status}`)}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{serviceName}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {startStr} {timeStr}
                                </span>
                                {event.service?.durationMin && (
                                    <span>
                                        {event.service.durationMin} {t("minutesShort")}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {(event.status === "BOOKED" || event.status === "CONFIRMED") && (
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                            {event.status === "BOOKED" && (
                                <Button size="sm" variant="outline" className="flex-1" disabled={isProcessing} onClick={() => onConfirm(event.id!)}>
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {t("confirmAppointment")}
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                disabled={isProcessing}
                                onClick={() => onCancelDialog(event.id!)}
                            >
                                <XCircle className="h-3 w-3 mr-1" />
                                {t("cancelAppointment")}
                            </Button>
                            <Button size="sm" variant="outline" disabled={isProcessing} onClick={() => onMarkNoShow(event.id!)}>
                                <UserX className="h-3 w-3 mr-1" />
                                {t("markNoShow")}
                            </Button>
                            <Button size="sm" variant="outline" disabled={isProcessing} onClick={() => onMarkDone(event.id!)}>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {t("markDone")}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

interface EmptyStateProps {}

export function EmptyState({}: EmptyStateProps) {
    const { t } = useLanguage();
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-muted p-4 mb-4">
                        <Clock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{t("noAppointmentsYet")}</h3>
                    <p className="text-sm text-muted-foreground text-center">{t("appointmentsWillAppear")}</p>
                </CardContent>
            </Card>
        </motion.div>
    );
}

interface CancelDialogProps {
    eventId: string | null;
    isProcessing: boolean;
    onClose: () => void;
    onConfirm: (id: string) => void;
}

export function CancelDialog({ eventId, isProcessing, onClose, onConfirm }: CancelDialogProps) {
    const { t } = useLanguage();
    return (
        <Dialog open={eventId !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>{t("cancelAppointment")}</DialogTitle>
                    <DialogDescription>{t("cancelAppointmentConfirmation")}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                        {t("back")}
                    </Button>
                    <Button variant="destructive" onClick={() => eventId && onConfirm(eventId)} disabled={isProcessing}>
                        {isProcessing ? t("processing") : t("cancelAppointment")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
