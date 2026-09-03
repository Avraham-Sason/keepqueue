"use client";

import { useBusinessesStore } from "@/lib/store";
import React from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import type { StaffMember } from "@/lib/types";
import { useStaffDialog, useStaffActions } from "./hooks";
import { StaffCard, EmptyState, StaffDialog, DeleteStaffDialog } from "./components";
import { useLanguage } from "@/hooks";
import { addDocument, setDocument } from "@/lib/firebase";
import { useRefreshBusiness } from "../hooks";
import StarBorder from "@/components/StarBorder";
import { toast } from "sonner";

function Staff() {
    const { t } = useLanguage();
    const currentBusiness = useBusinessesStore.currentBusiness();
    const staffMembers = (currentBusiness?.staff || []).filter((s) => s.isActive);
    const { isOpen, editingStaff, openAddDialog, openEditDialog, closeDialog } = useStaffDialog();
    const { deleteStaffId, setDeleteStaffId, isDeleting, handleDeleteStaff } = useStaffActions();
    const refreshBusiness = useRefreshBusiness();

    const handleSaveStaff = async (staffData: Partial<StaffMember>) => {
        try {
            if (editingStaff) {
                await setDocument("staff", staffData.id!, staffData);
            } else {
                await addDocument("staff", { ...staffData, businessId: currentBusiness?.id });
            }
            refreshBusiness();
            closeDialog();
            toast.success(t("changesSaved"));
        } catch (error) {
            console.error("Error saving staff:", error);
            toast.error(t("businessDetailsSaveError"));
        }
    };

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
                    <h1 className="text-3xl font-bold tracking-tight">{t("staffTitle")}</h1>
                    <p className="text-muted-foreground mt-1">{t("manageAllStaff")}</p>
                </div>
                <StarBorder onClick={openAddDialog} className="w-11/12 mx-auto sm:mx-0 sm:w-auto">
                    <div className="flex gap-1 items-center">
                        <Plus className="h-4 w-4" />
                        {t("addStaff")}
                    </div>
                </StarBorder>
            </motion.div>

            {staffMembers.length === 0 ? (
                <EmptyState onAdd={openAddDialog} />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {staffMembers.map((member, index) => (
                        <StaffCard key={member.id} staff={member} index={index} onEdit={openEditDialog} onDelete={setDeleteStaffId} />
                    ))}
                </div>
            )}

            <StaffDialog
                isOpen={isOpen}
                onClose={closeDialog}
                onSave={handleSaveStaff}
                staff={editingStaff}
                services={(currentBusiness?.services ?? []).filter((service) => service.active !== false)}
            />

            <DeleteStaffDialog
                staffId={deleteStaffId}
                isDeleting={isDeleting}
                onClose={() => setDeleteStaffId(null)}
                onConfirm={handleDeleteStaff}
            />
        </div>
    );
}

export default Staff;
