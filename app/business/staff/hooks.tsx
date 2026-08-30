import { useState } from "react";
import type { StaffMember } from "@/lib/types";
import { addDocument, setDocument } from "@/lib/firebase";
import { useRefreshBusiness } from "../hooks";

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
    const [deleteStaffId, setDeleteStaffId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const refreshBusiness = useRefreshBusiness();

    const handleDeleteStaff = async (staffId: string) => {
        setIsDeleting(true);
        try {
            await setDocument("staff", staffId, { isActive: false });
            setDeleteStaffId(null);
            refreshBusiness();
        } catch (error) {
            console.error("Error deleting staff:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return { deleteStaffId, setDeleteStaffId, isDeleting, handleDeleteStaff };
}

export function useStaffForm(staff: StaffMember | null, isOpen: boolean) {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "employee" as "owner" | "manager" | "employee",
        color: "#3b82f6",
        notes: "",
    });
    const [isSaving, setIsSaving] = useState(false);

    useState(() => {
        if (staff) {
            setFormData({
                firstName: staff.firstName || "",
                lastName: staff.lastName || "",
                email: staff.email || "",
                phone: staff.phone || "",
                role: staff.role || "employee",
                color: staff.color || "#3b82f6",
                notes: staff.notes || "",
            });
        } else {
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                role: "employee",
                color: "#3b82f6",
                notes: "",
            });
        }
    });

    return { formData, setFormData, isSaving, setIsSaving };
}
