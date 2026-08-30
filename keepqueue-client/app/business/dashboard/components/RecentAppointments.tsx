import { useLanguage } from "@/hooks";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Calendar, CheckCircle, Clock, MoreHorizontal, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { timestampToMillis, timestampToString } from "@/lib/helpers";
import { useBusinessesStore } from "@/lib/store";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { CalendarEventWithRelations } from "@/lib/types";

export const RecentAppointmentsSection = () => {
    const { t } = useLanguage();
    const currentBusiness = useBusinessesStore.currentBusiness();
    const userTimeZone = useSettingsStore.userTimeZone();
    const businessAppointments: CalendarEventWithRelations[] = currentBusiness?.calendar || [];
    const upcomingAppointments = businessAppointments
        .filter((apt) => apt.status === "CONFIRMED" || apt.status === "BOOKED")
        .filter((apt) => timestampToMillis(apt.start) >= timestampToMillis(new Date()))
        .sort((a, b) => timestampToMillis(a.start) - timestampToMillis(b.start))
        .slice(0, 5);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "CONFIRMED":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "BOOKED":
                return <AlertCircle className="h-4 w-4 text-yellow-500" />;
            case "CANCELLED":
                return <XCircle className="h-4 w-4 text-red-500" />;
            case "DONE":
                return <CheckCircle className="h-4 w-4 text-blue-500" />;
            case "NO_SHOW":
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "CONFIRMED":
                return t("statusConfirmed");
            case "BOOKED":
                return t("statusPending");
            case "CANCELLED":
                return t("statusCancelled");
            case "DONE":
                return t("statusCompleted");
            case "NO_SHOW":
                return t("statusCancelled");
            default:
                return status;
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="col-span-4">
            <Card className="hover:shadow-lg transition-all duration-300 h-full">
                <CardHeader>
                    <CardTitle>{t("upcomingAppointmentsTitle")}</CardTitle>
                    <CardDescription>{t("yourUpcomingAppointments")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {upcomingAppointments.length > 0 ? (
                            upcomingAppointments.map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={appointment.user?.photoURL} alt={appointment.user?.firstName} />
                                            <AvatarFallback>{appointment.user?.firstName?.charAt(0) || "A"}</AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {appointment.title ||
                                                    appointment.service?.name ||
                                                    `${appointment.user?.firstName} ${appointment.user?.lastName}`.trim() ||
                                                    t("appointment")}
                                            </p>
                                            <p className="text-sm text-muted-foreground">{appointment.service?.name || t("appointment")}</p>
                                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                <span>{timestampToString(appointment.start, { format: "DD/MM/YY", tz: userTimeZone })}</span>
                                                <Clock className="h-3 w-3" />
                                                <span>{timestampToString(appointment.start, { format: "HH:mm", tz: userTimeZone })}</span>
                                            </div>
                                            {appointment.notes && <p className="text-xs text-muted-foreground italic">"{appointment.notes}"</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Badge variant="outline" className="flex items-center gap-1.5">
                                            {getStatusIcon(appointment.status)}
                                            <span>{getStatusText(appointment.status)}</span>
                                        </Badge>
                                        <Button variant="ghost" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-2">{t("noUpcomingAppointments")}</p>
                                <p className="text-sm">{t("upcomingAppointmentsEmptyHint")}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};
