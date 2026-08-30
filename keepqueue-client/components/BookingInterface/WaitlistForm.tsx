"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Bell, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks";
import { addDocument, queryDocumentsByConditions, deleteDocument } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";
import type { Service } from "@/lib/types";

interface WaitlistFormProps {
    businessId: string;
    userId: string;
    service: Service;
    existingWaitItem?: any;
    onJoined?: () => void;
    onLeft?: () => void;
}

export function WaitlistForm({ businessId, userId, service, existingWaitItem, onJoined, onLeft }: WaitlistFormProps) {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [joined, setJoined] = useState(!!existingWaitItem);

    const handleJoin = async () => {
        setIsLoading(true);
        try {
            const now = Timestamp.now();
            const expiresAt = Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000);

            await addDocument("waitlist", {
                businessId,
                userId,
                serviceId: service.id,
                preferredWindow: {
                    from: now,
                    to: expiresAt,
                },
                priority: 0,
                expiresAt,
                created: now,
                timestamp: now,
            });

            setJoined(true);
            onJoined?.();
        } catch (error) {
            console.error("Error joining waitlist:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLeave = async () => {
        setIsLoading(true);
        try {
            const items = await queryDocumentsByConditions("waitlist", [
                { field_name: "userId", operator: "==", value: userId },
                { field_name: "serviceId", operator: "==", value: service.id },
                { field_name: "businessId", operator: "==", value: businessId },
            ]);

            if (items && items.length > 0) {
                for (const item of items) {
                    await deleteDocument("waitlist", item.id);
                }
            }

            setJoined(false);
            onLeft?.();
        } catch (error) {
            console.error("Error leaving waitlist:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-dashed">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        {t("waitlistTitle")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{t("waitlistDescription")}</p>

                    {joined ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-700 dark:text-green-400">{t("onWaitlist")}</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleLeave} disabled={isLoading} className="w-full">
                                {t("leaveWaitlist")}
                            </Button>
                        </div>
                    ) : (
                        <Button onClick={handleJoin} disabled={isLoading} className="w-full">
                            <Clock className="h-4 w-4 mr-2" />
                            {isLoading ? t("processing") : t("joinWaitlist")}
                        </Button>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
