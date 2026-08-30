import React, { useState } from "react";
import type { Service } from "@/lib/types";
import { setDocument } from "@/lib/firebase";
import { useRefreshBusiness } from "../hooks";

export function useServices() {
    const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const refreshBusiness = useRefreshBusiness();

    const handleDeleteService = async (serviceId: string) => {
        setIsDeleting(true);
        try {
            await setDocument("services", serviceId, { active: false });
            setDeleteServiceId(null);
            refreshBusiness();
        } catch (error) {
            console.error("Error deleting service:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return {
        deleteServiceId,
        setDeleteServiceId,
        isDeleting,
        handleDeleteService,
    };
}

export function useServiceDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    const openAddDialog = () => {
        setEditingService(null);
        setIsOpen(true);
    };

    const openEditDialog = (service: Service) => {
        setEditingService(service);
        setIsOpen(true);
    };

    const closeDialog = () => {
        setIsOpen(false);
        setEditingService(null);
    };

    return {
        isOpen,
        editingService,
        openAddDialog,
        openEditDialog,
        closeDialog,
    };
}

export function useServiceForm(service: Service | null, isOpen: boolean) {
    const [formData, setFormData] = useState({
        name: "",
        durationMin: 60,
        price: 0,
        paddingBefore: 0,
        paddingAfter: 0,
    });
    const [isSaving, setIsSaving] = useState(false);

    React.useEffect(() => {
        if (service) {
            setFormData({
                name: service.name || "",
                durationMin: service.durationMin || 60,
                price: service.price || 0,
                paddingBefore: service.paddingBefore || 0,
                paddingAfter: service.paddingAfter || 0,
            });
        } else {
            setFormData({
                name: "",
                durationMin: 60,
                price: 0,
                paddingBefore: 0,
                paddingAfter: 0,
            });
        }
    }, [service, isOpen]);

    return {
        formData,
        setFormData,
        isSaving,
        setIsSaving,
    };
}
