"use client";

import { useBusinessesStore } from "@/lib/store";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks";
import { useCustomers, useCustomerAppointments } from "./hooks";
import { CustomerCard, EmptyState, CustomerAppointmentsDialog, BlockCustomerDialog } from "./components";
import type { Customer } from "@/lib/types";

function Customers() {
    const { t } = useLanguage();
    const currentBusiness = useBusinessesStore.currentBusiness();
    const customers = currentBusiness?.customers || [];
    const calendar = currentBusiness?.calendar || [];
    const businessId = currentBusiness?.id;

    const {
        viewingCustomerId,
        blockingCustomerId,
        isBlocking,
        openAppointmentsDialog,
        closeAppointmentsDialog,
        openBlockDialog,
        closeBlockDialog,
        handleBlockCustomer,
        handleUnblockCustomer,
    } = useCustomers();

    const viewingCustomer = useMemo(() => {
        if (!viewingCustomerId) return null;
        return customers.find((c) => c.id === viewingCustomerId) || null;
    }, [viewingCustomerId, customers]);

    const blockingCustomer = useMemo(() => {
        if (!blockingCustomerId) return null;
        return customers.find((c) => c.id === blockingCustomerId) || null;
    }, [blockingCustomerId, customers]);

    const customerAppointments = useCustomerAppointments(viewingCustomerId, calendar);

    const getCustomerAppointmentCount = (customerId: string) => {
        return calendar.filter((event) => event.userId === customerId).length;
    };

    const getCustomerNoShowCount = (customerId: string) => {
        return calendar.filter((event) => event.userId === customerId && event.status === "NO_SHOW").length;
    };

    const getCustomerCancelCount = (customerId: string) => {
        return calendar.filter((event) => event.userId === customerId && event.status === "CANCELLED").length;
    };

    const isCustomerBlocked = (customer: Customer) => {
        return customer.blockedByBusinessIds?.includes(businessId || "") || false;
    };

    const handleBlockConfirm = () => {
        if (blockingCustomer && businessId) {
            const isBlocked = isCustomerBlocked(blockingCustomer);
            if (isBlocked) {
                handleUnblockCustomer(blockingCustomer.id!, businessId);
            } else {
                handleBlockCustomer(blockingCustomer.id!, businessId);
            }
        }
    };

    if (!currentBusiness || !businessId) {
        return null;
    }

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
                    <h1 className="text-3xl font-bold tracking-tight">{t("customers")}</h1>
                    <p className="text-muted-foreground mt-1">{t("manageAllCustomers")}</p>
                </div>
            </motion.div>

            {/* Customers List */}
            {customers.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {customers.map((customer, index) => {
                        const appointmentCount = getCustomerAppointmentCount(customer.id!);
                        const noShowCount = getCustomerNoShowCount(customer.id!);
                        const cancelCount = getCustomerCancelCount(customer.id!);
                        const isBlocked = isCustomerBlocked(customer);
                        return (
                            <CustomerCard
                                key={customer.id}
                                customer={customer}
                                index={index}
                                businessId={businessId}
                                isBlocked={isBlocked}
                                appointmentCount={appointmentCount}
                                noShowCount={noShowCount}
                                cancelCount={cancelCount}
                                onViewAppointments={openAppointmentsDialog}
                                onBlock={openBlockDialog}
                            />
                        );
                    })}
                </div>
            )}

            {/* View Appointments Dialog */}
            <CustomerAppointmentsDialog
                isOpen={viewingCustomerId !== null}
                onClose={closeAppointmentsDialog}
                customer={viewingCustomer}
                appointments={customerAppointments}
            />

            {/* Block/Unblock Customer Dialog */}
            <BlockCustomerDialog
                isOpen={blockingCustomerId !== null}
                onClose={closeBlockDialog}
                onConfirm={handleBlockConfirm}
                customer={blockingCustomer}
                isBlocking={isBlocking}
                isBlocked={blockingCustomer ? isCustomerBlocked(blockingCustomer) : false}
            />
        </div>
    );
}

export default Customers;
