"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AlertTriangle, Check, Copy, Share2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks";
import { useBusinessesStore } from "@/lib/store";

const COPIED_FEEDBACK_MS = 2000;

export const BookingLinkSection = () => {
    const { t } = useLanguage();
    const currentBusiness = useBusinessesStore.currentBusiness();
    const linkInputRef = useRef<HTMLInputElement>(null);
    const [copied, setCopied] = useState(false);

    if (!currentBusiness?.id) return null;

    const bookingUrl = typeof window !== "undefined" ? `${window.location.origin}/home/${currentBusiness.id}` : "";
    const hasBookableServices = (currentBusiness.services ?? []).some((service) => service.active);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(bookingUrl);
            setCopied(true);
            toast.success(t("bookingLinkCopied"));
            setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
        } catch {
            linkInputRef.current?.select();
            toast.error(t("bookingLinkCopyFailed"));
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <Card className="border-primary/40">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-primary" />
                        {t("shareBookingLink")}
                    </CardTitle>
                    <CardDescription>{t("bookingLinkHint")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                            ref={linkInputRef}
                            readOnly
                            dir="ltr"
                            value={bookingUrl}
                            aria-label={t("yourBookingPage")}
                            onFocus={(event) => event.target.select()}
                            className="font-mono"
                        />
                        <Button onClick={handleCopyLink} className="shrink-0">
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {t("copyLink")}
                        </Button>
                    </div>
                    {!hasBookableServices && (
                        <div className="flex flex-col gap-2 rounded-lg border border-yellow-500/60 bg-yellow-500/10 p-3 sm:flex-row sm:items-center">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600" />
                            <p className="flex-1 text-sm">{t("bookingLinkNeedsServices")}</p>
                            <Button asChild size="sm" variant="outline">
                                <Link href="/business/services">{t("addService")}</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};
