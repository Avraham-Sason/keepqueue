import React, { useState } from "react";
import type { Customer, CalendarEventWithRelations } from "@/lib/types";
import { getDocumentById, setDocument } from "@/lib/firebase";
import { useRefreshBusiness } from "../hooks";
import { getUserById } from "./helpers";

export function useCustomers() {
    const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null);
    const [blockingCustomerId, setBlockingCustomerId] = useState<string | null>(null);
    const [isBlocking, setIsBlocking] = useState(false);
    const refreshBusiness = useRefreshBusiness();

    const handleBlockCustomer = async (customerId: string, businessId: string) => {
        setIsBlocking(true);
        try {
            const customer = (await getUserById(customerId)) as Customer | null;
            if (!customer) {
                console.error("Customer not found");
                return;
            }

            const currentBlockedIds = customer.blockedByBusinessIds || [];
            if (!currentBlockedIds.includes(businessId)) {
                const updatedBlockedIds = [...currentBlockedIds, businessId];
                await setDocument("users", customerId, {
                    blockedByBusinessIds: updatedBlockedIds,
                });
                refreshBusiness();
            }
            setBlockingCustomerId(null);
        } catch (error) {
            console.error("Error blocking customer:", error);
        } finally {
            setIsBlocking(false);
        }
    };

    const handleUnblockCustomer = async (customerId: string, businessId: string) => {
        setIsBlocking(true);
        try {
            const customer = (await getDocumentById("users", customerId)) as Customer | null;
            if (!customer) {
                console.error("Customer not found");
                return;
            }

            const currentBlockedIds = customer.blockedByBusinessIds || [];
            const updatedBlockedIds = currentBlockedIds.filter((id) => id !== businessId);
            await setDocument("users", customerId, {
                blockedByBusinessIds: updatedBlockedIds,
            });
            refreshBusiness();
            setBlockingCustomerId(null);
        } catch (error) {
            console.error("Error unblocking customer:", error);
        } finally {
            setIsBlocking(false);
        }
    };

    const openAppointmentsDialog = (customerId: string) => {
        setViewingCustomerId(customerId);
    };

    const closeAppointmentsDialog = () => {
        setViewingCustomerId(null);
    };

    const openBlockDialog = (customerId: string) => {
        setBlockingCustomerId(customerId);
    };

    const closeBlockDialog = () => {
        setBlockingCustomerId(null);
    };

    return {
        viewingCustomerId,
        blockingCustomerId,
        isBlocking,
        openAppointmentsDialog,
        closeAppointmentsDialog,
        openBlockDialog,
        closeBlockDialog,
        handleBlockCustomer,
        handleUnblockCustomer,
    };
}

export function useCustomerAppointments(customerId: string | null, calendar: CalendarEventWithRelations[] | undefined) {
    const customerAppointments = React.useMemo(() => {
        if (!customerId || !calendar) return [];
        return calendar.filter((event) => event.userId === customerId);
    }, [customerId, calendar]);

    return customerAppointments;
}
