import { useState } from "react";
import type { StaffMember } from "@/lib/types";
import { addDocument, setDocument } from "@/lib/firebase";
import { useRefreshBusiness } from "../hooks";
import { useLanguage } from "@/hooks";
import { toast } from "sonner";

export function useStaffDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

    const openAddDialog = () => {
        setEditingStaff(null);
        setIsOpen(true);
    };

    const openEditDialog = (staff: StaffMember) => {
        setEditingStaff(staff);
        setIsOpen(true);
    };

    const closeDialog = () => {
        setIsOpen(false);
        setEditingStaff(null);
    };

    return { isOpen, editingStaff, openAddDialog, openEditDialog, closeDialog };
}

export function useStaffActions() {
    const { t } = useLanguage();
    const [deleteStaffId, setDeleteStaffId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const refreshBusiness = useRefreshBusiness();

    const handleDeleteStaff = async (staffId: string) => {
        setIsDeleting(true);
        try {
            await setDocument("staff", staffId, { isActive: false });
            setDeleteStaffId(null);
            refreshBusiness();
            toast.success(t("changesSaved"));
        } catch (error) {
            console.error("Error deleting staff:", error);
            toast.error(t("businessDetailsSaveError"));
        } finally {
            setIsDeleting(false);
        }
    };

    return { deleteStaffId, setDeleteStaffId, isDeleting, handleDeleteStaff };
}

