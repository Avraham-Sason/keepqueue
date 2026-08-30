"use client";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks";
import { useAuthStore, useBusinessesStore } from "@/lib/store";
import { Clock, Mail, Phone } from "lucide-react";
import { ReactNode, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatWorkingHoursFromSchedule } from "@/lib/helpers/schedule";

export const BusinessDetailsSections = () => {
    const { t } = useLanguage();
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="col-span-4 lg:col-span-3">
            <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                    <CardTitle>{t("businessDetails")}</CardTitle>
                    <CardDescription>{t("yourInfoOnPlatform")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <BusinessDetailsCards />
                    <BusinessServices />
                </CardContent>
            </Card>
        </motion.div>
    );
};

const BusinessDetailsCard = ({ icon, title, value }: { icon: ReactNode; title: string; value: string }) => {
    return (
        <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">{icon}</div>
            <div>
                <p className="text-xs text-muted-foreground">{title}</p>
                <p className="text-sm font-medium">{value}</p>
            </div>
        </div>
    );
};

const BusinessDetailsCards = () => {
    const currentBusiness = useBusinessesStore.currentBusiness();
    const businessOwner = useAuthStore.user()!;
    const { t } = useLanguage();
    const workingHoursValue = useMemo(() => {
        const summary = formatWorkingHoursFromSchedule(currentBusiness?.operationSchedule ?? [], (key: string) => t(key as any));
        return summary ? summary.split("\n").join(" • ") : "-";
    }, [currentBusiness?.operationSchedule, t]);
    return (
        <div className="space-y-3">
            {(currentBusiness?.phone || businessOwner.phone) && (
                <BusinessDetailsCard
                    icon={<Phone className="h-5 w-5 text-primary" />}
                    title={t("phone")}
                    value={currentBusiness?.phone ?? businessOwner.phone}
                />
            )}

            <BusinessDetailsCard icon={<Mail className="h-5 w-5 text-primary" />} title={t("email")} value={businessOwner.email} />

            <BusinessDetailsCard icon={<Clock className="h-5 w-5 text-primary" />} title={t("workingHours")} value={workingHoursValue} />
        </div>
    );
};

const BusinessServices = () => {
    const currentBusiness = useBusinessesStore.currentBusiness();
    const { t } = useLanguage();
    return (
        <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">{t("yourServices")}</h4>
            <div className="flex flex-wrap gap-2">
                {currentBusiness?.services && currentBusiness.services.length > 0 ? (
                    currentBusiness.services.map((service) => (
                        <Badge key={service.id} variant="secondary">
                            {service.name}
                        </Badge>
                    ))
                ) : (
                    <p className="text-xs text-muted-foreground">{t("noServices")}</p>
                )}
            </div>
        </div>
    );
};
