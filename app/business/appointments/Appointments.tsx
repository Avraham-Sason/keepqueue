"use client";

import { useBusinessesStore, useSettingsStore } from "@/lib/store";
import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks";
import { useAppointments, useAppointmentActions } from "./hooks";
import { AppointmentFilters, AppointmentCard, EmptyState, CancelDialog } from "./components";

function Appointments() {
    const { t } = useLanguage();
    const currentBusiness = useBusinessesStore.currentBusiness();
    const timezone = useSettingsStore.userTimeZone();
    const calendar = currentBusiness?.calendar || [];
    const services = currentBusiness?.services || [];

    const { filteredAppointments, statusFilter, setStatusFilter, serviceFilter, setServiceFilter, searchQuery, setSearchQuery } =
        useAppointments(calendar);

    const { isProcessing, cancelDialogEventId, setCancelDialogEventId, handleConfirm, handleCancel, handleMarkNoShow, handleMarkDone } =
        useAppointmentActions();

    if (!currentBusiness) return null;

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("appointments")}</h1>
                    <p className="text-muted-foreground mt-1">{t("manageAllAppointments")}</p>
                </div>
            </motion.div>

            <AppointmentFilters
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                serviceFilter={serviceFilter}
                setServiceFilter={setServiceFilter}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                services={services}
            />

            {filteredAppointments.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid gap-3">
                    {filteredAppointments.map((event, index) => (
                        <AppointmentCard
                            key={event.id}
                            event={event}
                            index={index}
                            isProcessing={isProcessing}
                            onConfirm={handleConfirm}
                            onCancelDialog={setCancelDialogEventId}
                            onMarkNoShow={handleMarkNoShow}
                            onMarkDone={handleMarkDone}
                            timezone={timezone}
                        />
                    ))}
                </div>
            )}

            <CancelDialog
                eventId={cancelDialogEventId}
                isProcessing={isProcessing}
                onClose={() => setCancelDialogEventId(null)}
                onConfirm={handleCancel}
            />
        </div>
    );
}

export default Appointments;
