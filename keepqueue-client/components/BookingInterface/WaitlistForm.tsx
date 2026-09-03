"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks";
import { apiCall } from "@/lib/helpers/api";
import type { Service } from "@/lib/types";

interface WaitlistFormProps {
    businessId: string;
    userId: string;
    service: Service;
    /** How far ahead the customer is willing to be offered a slot. */
    windowDays?: number;
}

/**
 * Shown when a service has no free slot left. Joining goes through the API, which is where the
 * business, the service and the window are validated and where a duplicate is refused — a direct
 * Firestore write skipped all of it, and `priority` used to be settable by the caller.
 */
export function WaitlistForm({ businessId, userId, service, windowDays = 30 }: WaitlistFormProps) {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [joined, setJoined] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleJoin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await apiCall("POST", "actions", "businesses/waitlist/add", {
                businessId,
                userId,
                serviceId: service.id,
                preferredWindow: { from: Date.now(), to: Date.now() + windowDays * 24 * 60 * 60 * 1000 },
            });
            setJoined(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : t("errorGeneric"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Bell className="size-4" aria-hidden="true" />
                        {t("waitlistTitle")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {joined ? (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                            {t("waitlistJoined")}
                        </p>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">{t("waitlistDescription")}</p>
                            {error && (
                                <p role="alert" className="text-sm text-destructive">
                                    {error}
                                </p>
                            )}
                            <Button type="button" onClick={handleJoin} disabled={isLoading}>
                                {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                                {t("waitlistJoin")}
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
