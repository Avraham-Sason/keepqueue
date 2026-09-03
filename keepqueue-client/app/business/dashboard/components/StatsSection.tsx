import { useLanguage } from "@/hooks";
import { timestampToString } from "@/lib/helpers";
import { useBusinessesStore } from "@/lib/store";
import { CalendarEventWithRelations } from "@/lib/types";
import { motion } from "framer-motion";
import { Calendar, DollarSign, TrendingUp, Users, LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface StatCardProps {
    title: string;
    icon: LucideIcon;
    value: string | number | ReactNode;
    description: string | ReactNode;
}

export const StatCard = ({ title, icon: Icon, value, description }: StatCardProps) => {
    return (
        <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
};

export const StatsSection = () => {
    const { t } = useLanguage();
    const currentBusiness = useBusinessesStore.currentBusiness();
    const calendar: CalendarEventWithRelations[] = currentBusiness?.calendar || [];
    const currency = currentBusiness?.currency || "₪";

    // Vacation and holiday blocks live in the same collection; only bookings are countable here.
    const businessAppointments = calendar.filter((apt) => apt.type === "APPOINTMENT");

    const today = timestampToString(new Date(), { format: "DD/MM/YY" });
    const todayAppointments = businessAppointments.filter(
        (apt) => apt.status !== "CANCELLED" && timestampToString(apt.start, { format: "DD/MM/YY" }) === today
    );
    const confirmedAppointments = businessAppointments.filter((apt) => apt.status === "CONFIRMED");
    const totalRevenue = businessAppointments.filter((apt) => apt.status === "DONE").reduce((sum, apt) => sum + (apt.service?.price ?? 0), 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
            <StatCard
                title={t("todayAppointments")}
                icon={Calendar}
                value={todayAppointments.length}
                description={todayAppointments.length === 0 ? t("noAppointmentsToday") : t("scheduledAppointments")}
            />

            <StatCard title={t("confirmed")} icon={Users} value={confirmedAppointments.length} description={t("awaitingArrival")} />

            <StatCard
                title={t("revenue")}
                icon={DollarSign}
                value={`${currency}${totalRevenue.toLocaleString()}`}
                description={t("fromCompletedAppointments")}
            />

            <StatCard
                title={t("totalAppointments")}
                icon={TrendingUp}
                value={businessAppointments.length}
                description={t("allAppointmentsInSystem")}
            />
        </motion.div>
    );
};
