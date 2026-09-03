import React, { useState } from "react";
import type { Customer, CalendarEventWithRelations } from "@/lib/types";
import { toast } from "sonner";
import { useLanguage } from "@/hooks";
import { useRefreshBusiness } from "../hooks";
import { blockCustomer, unblockCustomer } from "./helpers";

export function useCustomers() {
    const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null);
    const [blockingCustomerId, setBlockingCustomerId] = useState<string | null>(null);
    const [isBlocking, setIsBlocking] = useState(false);
    const refreshBusiness = useRefreshBusiness();
    const { t } = useLanguage();

    // blockedByBusinessIds lives on the customer's own users document, which firestore.rules
    // only lets that customer write. The browser therefore cannot do this at all: the writes
    // that used to be here were denied every time and the dialog closed as if they had worked.
    // The server owns the field and reaches it with the Admin SDK.
    const setBlocked = async (customerId: string, businessId: string, blocked: boolean) => {
        setIsBlocking(true);
        try {
            await (blocked ? blockCustomer(customerId, businessId) : unblockCustomer(customerId, businessId));
            toast.success(t(blocked ? "customerBlocked" : "customerUnblocked"));
            await refreshBusiness();
            setBlockingCustomerId(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t("errorGeneric"));
        } finally {
            setIsBlocking(false);
        }
    };

    const handleBlockCustomer = (customerId: string, businessId: string) => setBlocked(customerId, businessId, true);

    const handleUnblockCustomer = (customerId: string, businessId: string) => setBlocked(customerId, businessId, false);

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
