"use client";

import { useBusinessesStore } from "@/lib/store";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import type { Service } from "@/lib/types";
import { useServices, useServiceDialog } from "./hooks";
import { ServiceCard, EmptyState, ServiceDialog, DeleteServiceDialog } from "./components";
import { formatDuration, formatPrice } from "./heleprs";
import { useLanguage } from "@/hooks";
import { addDocument, setDocument } from "@/lib/firebase";
import { useRefreshBusiness } from "../hooks";
import StarBorder from "@/components/StarBorder";

function Services() {
    const { t } = useLanguage();
    const currentBusiness = useBusinessesStore.currentBusiness();
    const services = currentBusiness?.services || [];
    const { deleteServiceId, setDeleteServiceId, isDeleting, handleDeleteService } = useServices();
    const { isOpen, editingService, openAddDialog, openEditDialog, closeDialog } = useServiceDialog();
    const refreshBusiness = useRefreshBusiness();
    const handleSaveService = async (serviceData: Partial<Service>) => {
        try {
            if (editingService) {
                await setDocument("services", serviceData.id!, serviceData);
                refreshBusiness();
            } else {
                await addDocument("services", serviceData);
                refreshBusiness();
            }
            closeDialog();
        } catch (error) {
            console.error("Error saving service:", error);
        }
    };
    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("services")}</h1>
                    <p className="text-muted-foreground mt-1">{t("manageAllServices")}</p>
                </div>
                <StarBorder onClick={openAddDialog} className="w-11/12 mx-auto sm:mx-0 sm:w-auto ">
                    <div className="flex gap-1 items-center">
                        <Plus className="h-4 w-4" />
                        {t("addNewService")}
                    </div>
                </StarBorder>
            </motion.div>

            {/* Services List */}
            {services.length === 0 ? (
                <EmptyState onAddService={openAddDialog} />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {services
                        .filter((service) => service.active)
                        .map((service, index) => (
                            <ServiceCard
                                key={service.id}
                                service={service}
                                index={index}
                                currency={currentBusiness?.currency}
                                onEdit={openEditDialog}
                                onDelete={setDeleteServiceId}
                                formatDuration={(minutes) => formatDuration(minutes, t)}
                            />
                        ))}
                </div>
            )}

            {/* Add/Edit Service Dialog */}
            <ServiceDialog
                isOpen={isOpen}
                onClose={closeDialog}
                onSave={handleSaveService}
                service={editingService}
                businessId={currentBusiness?.id}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteServiceDialog
                serviceId={deleteServiceId}
                isDeleting={isDeleting}
                onClose={() => setDeleteServiceId(null)}
                onConfirm={handleDeleteService}
            />
        </div>
    );
}

export default Services;
