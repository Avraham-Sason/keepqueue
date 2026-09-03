"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Calendar, Clock, ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks";
import Link from "next/link";

export default function BookingSuccessPage() {
    const { t, isRtl } = useLanguage();
    const ForwardIcon = isRtl ? ArrowLeft : ArrowRight;
    const searchParams = useSearchParams();

    const businessName = searchParams.get("business") || "";
    const serviceName = searchParams.get("service") || "";
    const date = searchParams.get("date") || "";
    const time = searchParams.get("time") || "";
    const businessId = searchParams.get("businessId") || "";

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card>
                    <CardHeader className="text-center pb-2">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="flex justify-center mb-4"
                        >
                            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                            </div>
                        </motion.div>
                        <CardTitle className="text-2xl">{t("bookingSuccessPageTitle")}</CardTitle>
                        <p className="text-muted-foreground mt-1">{t("bookingSuccessPageDescription")}</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {(serviceName || date || time) && (
                            <div className="rounded-lg border p-4 space-y-3">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                    {t("appointmentDetails")}
                                </h3>
                                {businessName && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">{t("businessLabel")}:</span>
                                        <span className="font-medium">{businessName}</span>
                                    </div>
                                )}
                                {serviceName && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">{t("serviceLabel")}:</span>
                                        <span className="font-medium">{serviceName}</span>
                                    </div>
                                )}
                                {date && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{date}</span>
                                    </div>
                                )}
                                {time && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{time}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                            <h3 className="font-semibold text-sm">{t("whatsNext")}</h3>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• {t("whatsNextLine1")}</li>
                                <li>• {t("whatsNextLine2")}</li>
                                <li>• {t("whatsNextLine3")}</li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-2">
                            {businessId && (
                                <Button asChild className="w-full">
                                    <Link href={`/home/${businessId}`}>
                                        <ForwardIcon className="me-2 h-4 w-4" />
                                        {t("bookAnotherAppointment")}
                                    </Link>
                                </Button>
                            )}
                            <Button variant="outline" asChild className="w-full">
                                <Link href="/customer/dashboard">{t("viewMyAppointments")}</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
