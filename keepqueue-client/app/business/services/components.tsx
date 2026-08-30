"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Clock, DollarSign, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import type { Service } from "@/lib/types";
import { useServiceForm } from "./hooks";
import { formatPrice } from "./heleprs";
import { useLanguage } from "@/hooks";

interface ServiceCardProps {
    service: Service;
    index: number;
    currency?: string;
    onEdit: (service: Service) => void;
    onDelete: (serviceId: string) => void;
    formatDuration: (minutes: number, t: (key: string) => string) => string;
}

export function ServiceCard({ service, index, currency, onEdit, onDelete, formatDuration }: ServiceCardProps) {
    const { t } = useLanguage();
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.1 }}>
            <Card className="hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="text-xl mb-1">{service.name}</CardTitle>
                            <CardDescription>
                                {service.active ? (
                                    <Badge variant="secondary" className="mt-1 ">
                                        <CheckCircle2 className="h-3 w-3 me-1" />
                                        {t("serviceActive")}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="mt-1 ">
                                        <XCircle className="h-3 w-3 me-1" />
                                        {t("serviceInactive")}
                                    </Badge>
                                )}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                    <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{t("durationLabel:")}</span>
                            <span className="font-medium">{formatDuration(service.durationMin, t)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{t("priceLabel")}</span>
                            <span className="font-medium">{formatPrice(service.price, currency || "")}</span>
                        </div>
                        {service.paddingBefore && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">{t("preparationTime")}</span>
                                <span className="font-medium">
                                    {service.paddingBefore} {t("minutes")}
                                </span>
                            </div>
                        )}
                        {service.paddingAfter && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">{t("cleanupTime")}</span>
                                <span className="font-medium">
                                    {service.paddingAfter} {t("minutes")}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 mt-auto pt-4 border-t">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(service)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {t("edit")}
                        </Button>
                        <Button variant="destructive" size="sm" className="flex-1" onClick={() => onDelete(service.id!)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t("delete")}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

interface EmptyStateProps {
    onAddService: () => void;
}

export function EmptyState({ onAddService }: EmptyStateProps) {
    const { t } = useLanguage();
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <Card className="hover:shadow-lg transition-all duration-300">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-muted p-4 mb-4">
                        <Plus className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{t("noServicesYet")}</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-center">{t("startByAddingFirstService")}</p>
                    <Button onClick={onAddService} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        {t("addNewService")}
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}

interface ServiceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (serviceData: Partial<Service>) => Promise<void>;
    service: Service | null;
    businessId?: string;
}

export function ServiceDialog({ isOpen, onClose, onSave, service, businessId }: ServiceDialogProps) {
    const { t } = useLanguage();
    const { formData, setFormData, isSaving, setIsSaving } = useServiceForm(service, isOpen);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const serviceData: Partial<Service> = {
                ...(service || {}),
                ...formData,
                businessId,
                operationSchedule: service?.operationSchedule || [],
                active: true,
            };
            if (serviceData.paddingAfter === 0) {
                delete serviceData.paddingAfter;
            }
            if (serviceData.paddingBefore === 0) {
                delete serviceData.paddingBefore;
            }
            await onSave(serviceData);
        } catch (error) {
            console.error("Error saving service:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>{service ? t("editService") : t("addNewService")}</DialogTitle>
                    <DialogDescription>{service ? t("updateServiceDetails") : t("fillDetailsToAddService")}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t("serviceNameLabel")}</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder={t("serviceNamePlaceholder")}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="durationMin">{t("durationMinutesLabel")}</Label>
                                <Input
                                    id="durationMin"
                                    type="number"
                                    min="1"
                                    value={formData.durationMin}
                                    onChange={(e) => setFormData({ ...formData, durationMin: parseInt(e.target.value) || 0 })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="price">{t("priceLabelRequired")}</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="paddingBefore">{t("preparationTimeMinutes")}</Label>
                                <Input
                                    id="paddingBefore"
                                    type="number"
                                    min="0"
                                    value={formData.paddingBefore}
                                    onChange={(e) => setFormData({ ...formData, paddingBefore: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="paddingAfter">{t("cleanupTimeMinutes")}</Label>
                                <Input
                                    id="paddingAfter"
                                    type="number"
                                    min="0"
                                    value={formData.paddingAfter}
                                    onChange={(e) => setFormData({ ...formData, paddingAfter: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                            {t("cancel")}
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? t("saving") : service ? t("update") : t("add")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface DeleteServiceDialogProps {
    serviceId: string | null;
    isDeleting: boolean;
    onClose: () => void;
    onConfirm: (serviceId: string) => void;
}

export function DeleteServiceDialog({ serviceId, isDeleting, onClose, onConfirm }: DeleteServiceDialogProps) {
    const { t } = useLanguage();
    return (
        <Dialog open={serviceId !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>{t("deleteService")}</DialogTitle>
                    <DialogDescription>{t("deleteServiceConfirmation")}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isDeleting}>
                        {t("cancel")}
                    </Button>
                    <Button variant="destructive" onClick={() => serviceId && onConfirm(serviceId)} disabled={isDeleting}>
                        {isDeleting ? t("deleting") : t("delete")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
