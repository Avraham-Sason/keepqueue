"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, User, Ban, CheckCircle2, XCircle, Eye, Mail, Phone, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import type { Customer, CalendarEventWithRelations } from "@/lib/types";
import { useLanguage } from "@/hooks";
import { formatCustomerName, getCustomerInitials } from "./helpers";
import { timestampToString, timestampToMillis } from "@/lib/helpers";

interface CustomerCardProps {
    customer: Customer;
    index: number;
    businessId: string;
    isBlocked: boolean;
    appointmentCount: number;
    noShowCount?: number;
    cancelCount?: number;
    onViewAppointments: (customerId: string) => void;
    onBlock: (customerId: string) => void;
}

export function CustomerCard({ customer, index, businessId, isBlocked, appointmentCount, noShowCount = 0, cancelCount = 0, onViewAppointments, onBlock }: CustomerCardProps) {
    const { t } = useLanguage();
    const customerName = formatCustomerName(customer);
    const initials = getCustomerInitials(customer);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.1 }}>
            <Card className="hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={customer.photoURL} alt={customerName} />
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <CardTitle className="text-xl mb-1">{customerName}</CardTitle>
                        </div>
                        {isBlocked ? (
                            <Badge variant="destructive" className="ml-2">
                                <Ban className="h-3 w-3 me-1" />
                                {t("blocked")}
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="ml-2">
                                <CheckCircle2 className="h-3 w-3 me-1" />
                                {t("active")}
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                    <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{t("name")}:</span>
                            <span className="font-medium">{customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{t("email")}:</span>
                            <span className="font-medium">{customer.email}</span>
                        </div>
                        {customer.phone && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{t("phone")}:</span>
                                <span className="font-medium">{customer.phone}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{t("appointments")}:</span>
                            <span className="font-medium">{appointmentCount}</span>
                        </div>
                        {(noShowCount > 0 || cancelCount > 0) && (
                            <div className="flex items-center gap-2 text-sm">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                {noShowCount > 0 && (
                                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                                        {t("customerNoShowCount")}: {noShowCount}
                                    </Badge>
                                )}
                                {cancelCount > 0 && appointmentCount > 0 && (
                                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                                        {t("customerCancelRate")}: {Math.round((cancelCount / appointmentCount) * 100)}%
                                    </Badge>
                                )}
                            </div>
                        )}
                        {customer.lastEventAt && (
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{t("lastAppointment")}:</span>
                                <span className="font-medium">{timestampToString(customer.lastEventAt, { format: "DD/MM/YY" })}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 mt-auto pt-4 border-t">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => onViewAppointments(customer.id!)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t("viewAppointments")}
                        </Button>
                        <Button variant={isBlocked ? "default" : "destructive"} size="sm" className="flex-1" onClick={() => onBlock(customer.id!)}>
                            <Ban className="h-4 w-4 mr-2" />
                            {isBlocked ? t("unblock") : t("block")}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

interface EmptyStateProps {
    onAddCustomer?: () => void;
}

export function EmptyState({ onAddCustomer }: EmptyStateProps) {
    const { t } = useLanguage();
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <Card className="hover:shadow-lg transition-all duration-300">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-muted p-4 mb-4">
                        <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{t("noCustomersYet")}</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-center">{t("customersWillAppearHere")}</p>
                </CardContent>
            </Card>
        </motion.div>
    );
}

interface CustomerAppointmentsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    customer: Customer | null;
    appointments: CalendarEventWithRelations[];
}

export function CustomerAppointmentsDialog({ isOpen, onClose, customer, appointments }: CustomerAppointmentsDialogProps) {
    const { t } = useLanguage();
    const customerName = customer ? formatCustomerName(customer) : "";

    const sortedAppointments = React.useMemo(() => {
        return [...appointments].sort((a, b) => timestampToMillis(a.start) - timestampToMillis(b.start));
    }, [appointments]);

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
            BOOKED: { variant: "default", label: t("booked") },
            CONFIRMED: { variant: "secondary", label: t("confirmed") },
            CANCELLED: { variant: "destructive", label: t("cancelled") },
            NO_SHOW: { variant: "destructive", label: t("noShow") },
            DONE: { variant: "outline", label: t("done") },
        };
        const statusInfo = statusMap[status] || { variant: "outline" as const, label: status };
        return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {t("appointmentsFor")} {customerName}
                    </DialogTitle>
                    <DialogDescription>{t("viewAllAppointmentsForCustomer")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {sortedAppointments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">{t("noAppointmentsFound")}</div>
                    ) : (
                        sortedAppointments.map((appointment) => (
                            <Card key={appointment.id}>
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{appointment.title}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                <span>
                                                    {timestampToString(appointment.start, { format: "DD/MM/YY HH:mm" })} -{" "}
                                                    {timestampToString(appointment.end, { format: "HH:mm" })}
                                                </span>
                                            </div>
                                            {appointment.service && (
                                                <div className="text-sm text-muted-foreground">
                                                    {t("service")}: {appointment.service.name}
                                                </div>
                                            )}
                                            {appointment.notes && <div className="text-sm text-muted-foreground italic">"{appointment.notes}"</div>}
                                        </div>
                                        <div>{getStatusBadge(appointment.status)}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        {t("close")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface BlockCustomerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    customer: Customer | null;
    isBlocking: boolean;
    isBlocked: boolean;
}

export function BlockCustomerDialog({ isOpen, onClose, onConfirm, customer, isBlocking, isBlocked }: BlockCustomerDialogProps) {
    const { t } = useLanguage();
    const customerName = customer ? formatCustomerName(customer) : "";

    const getConfirmationMessage = () => {
        const message = isBlocked ? t("unblockCustomerConfirmation") : t("blockCustomerConfirmation");
        return message.replace("{customerName}", customerName);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>{isBlocked ? t("unblockCustomer") : t("blockCustomer")}</DialogTitle>
                    <DialogDescription>{getConfirmationMessage()}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isBlocking}>
                        {t("cancel")}
                    </Button>
                    <Button variant={isBlocked ? "default" : "destructive"} onClick={onConfirm} disabled={isBlocking}>
                        {isBlocking ? t("processing") : isBlocked ? t("unblock") : t("block")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
