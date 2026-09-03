"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
    MAX_INTERVALS_PER_DAY,
    createDefaultInterval,
    createInitialScheduleForm,
    scheduleFormToOperationSchedule,
    type OperationScheduleFormState,
} from "../editDetails/helpers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Trash2, Plus, Users } from "lucide-react";
import { motion } from "framer-motion";
import type { Service, StaffMember, StaffRole } from "@/lib/types";
import { useLanguage } from "@/hooks";

interface StaffCardProps {
    staff: StaffMember;
    index: number;
    onEdit: (staff: StaffMember) => void;
    onDelete: (staffId: string) => void;
}

export function StaffCard({ staff, index, onEdit, onDelete }: StaffCardProps) {
    const { t } = useLanguage();
    const initials = `${(staff.firstName || "?")[0]}${(staff.lastName || "?")[0]}`.toUpperCase();

    const roleLabel: Record<StaffRole, string> = {
        owner: t("staffRoleOwner"),
        manager: t("staffRoleManager"),
        employee: t("staffRoleEmployee"),
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.1 }}>
            <Card className="hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                <CardHeader>
                    <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10" style={{ borderColor: staff.color, borderWidth: 2 }}>
                            <AvatarFallback style={{ backgroundColor: staff.color + "20", color: staff.color }}>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <CardTitle className="text-lg">
                                {staff.firstName} {staff.lastName}
                            </CardTitle>
                            <Badge variant="secondary" className="mt-1">
                                {roleLabel[staff.role]}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                    <div className="space-y-2 mb-4 text-sm">
                        {staff.email && (
                            <div className="text-muted-foreground">
                                {t("email")}: <span className="text-foreground">{staff.email}</span>
                            </div>
                        )}
                        {staff.phone && (
                            <div className="text-muted-foreground">
                                {t("phone")}: <span className="text-foreground">{staff.phone}</span>
                            </div>
                        )}
                        {staff.notes && <p className="text-muted-foreground italic">{staff.notes}</p>}
                    </div>
                    <div className="flex gap-2 mt-auto pt-4 border-t">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(staff)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {t("edit")}
                        </Button>
                        <Button variant="destructive" size="sm" className="flex-1" onClick={() => onDelete(staff.id!)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t("delete")}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export function EmptyState({ onAdd }: { onAdd: () => void }) {
    const { t } = useLanguage();
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-muted p-4 mb-4">
                        <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{t("noStaffYet")}</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-center">{t("staffWillAppear")}</p>
                    <Button onClick={onAdd} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        {t("addStaff")}
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}

interface StaffDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<StaffMember>) => Promise<void>;
    staff: StaffMember | null;
    services: Service[];
}

export function StaffDialog({ isOpen, onClose, onSave, staff, services }: StaffDialogProps) {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "employee" as StaffRole,
        color: "#3b82f6",
        notes: "",
    });
    const [isSaving, setIsSaving] = useState(false);
    const [scheduleForm, setScheduleForm] = useState<OperationScheduleFormState>(() => createInitialScheduleForm(null));
    const [serviceIds, setServiceIds] = useState<string[]>([]);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        setSaveError(null);
        setScheduleForm(createInitialScheduleForm(staff?.operationSchedule));
        setServiceIds(staff?.serviceIds ?? []);
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
            setFormData({ firstName: "", lastName: "", email: "", phone: "", role: "employee", color: "#3b82f6", notes: "" });
        }
    }, [staff, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveError(null);
        try {
            await onSave({
                ...(staff || {}),
                ...formData,
                isActive: true,
                operationSchedule: scheduleFormToOperationSchedule(scheduleForm),
                serviceIds,
            });
        } catch (error) {
            // Closing on failure told the owner the change had saved when it had not.
            setSaveError(error instanceof Error ? error.message : t("errorGeneric"));
        } finally {
            setIsSaving(false);
        }
    };

    const toggleDay = (index: number) =>
        setScheduleForm((prev) => prev.map((day, i) => (i === index ? { ...day, isOpen: !day.isOpen } : day)));

    const setInterval = (dayIndex: number, intervalIndex: number, field: "start" | "end", value: string) =>
        setScheduleForm((prev) =>
            prev.map((day, i) =>
                i === dayIndex
                    ? { ...day, intervals: day.intervals.map((interval, j) => (j === intervalIndex ? { ...interval, [field]: value } : interval)) }
                    : day
            )
        );

    const addInterval = (dayIndex: number) =>
        setScheduleForm((prev) =>
            prev.map((day, i) =>
                i === dayIndex && day.intervals.length < MAX_INTERVALS_PER_DAY ? { ...day, intervals: [...day.intervals, createDefaultInterval()] } : day
            )
        );

    const removeInterval = (dayIndex: number, intervalIndex: number) =>
        setScheduleForm((prev) =>
            prev.map((day, i) => (i === dayIndex ? { ...day, intervals: day.intervals.filter((_, j) => j !== intervalIndex) } : day))
        );

    const toggleService = (serviceId: string) =>
        setServiceIds((prev) => (prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]));

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>{staff ? t("editStaff") : t("addStaff")}</DialogTitle>
                    <DialogDescription>{staff ? t("editStaff") : t("addStaff")}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="staffFirstName">{t("firstName")}</Label>
                                <Input
                                    id="staffFirstName"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="staffLastName">{t("lastName")}</Label>
                                <Input
                                    id="staffLastName"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="staffEmail">{t("staffEmail")}</Label>
                                <Input
                                    id="staffEmail"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="staffPhone">{t("staffPhone")}</Label>
                                <Input
                                    id="staffPhone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>{t("staffRole")}</Label>
                                <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val as StaffRole })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="owner">{t("staffRoleOwner")}</SelectItem>
                                        <SelectItem value="manager">{t("staffRoleManager")}</SelectItem>
                                        <SelectItem value="employee">{t("staffRoleEmployee")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="staffColor">{t("staffColor")}</Label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        id="staffColor"
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="h-9 w-14 rounded border cursor-pointer"
                                    />
                                    <span className="text-sm text-muted-foreground">{formData.color}</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="staffNotes">{t("staffNotes")}</Label>
                            <Textarea
                                id="staffNotes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={2}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t("staffServicesLabel")}</Label>
                            <p className="text-xs text-muted-foreground">{t("staffServicesHelper")}</p>
                            {services.length === 0 ? (
                                <p className="text-sm text-muted-foreground">{t("noServicesYet")}</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {services.map((service) => {
                                        const checked = serviceIds.includes(service.id!);
                                        return (
                                            <button
                                                key={service.id}
                                                type="button"
                                                role="checkbox"
                                                aria-checked={checked}
                                                onClick={() => toggleService(service.id!)}
                                                className={`rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                                    checked ? "border-primary bg-primary/10" : "border-input hover:bg-accent"
                                                }`}
                                            >
                                                {service.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label>{t("staffHoursLabel")}</Label>
                            <p className="text-xs text-muted-foreground">{t("staffHoursHelper")}</p>
                            <div className="grid gap-2">
                                {scheduleForm.map((day, dayIndex) => (
                                    <div key={day.day} className="rounded-md border p-2">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={`staff-day-${day.day}`}
                                                checked={day.isOpen}
                                                onCheckedChange={() => toggleDay(dayIndex)}
                                            />
                                            <Label htmlFor={`staff-day-${day.day}`} className="text-sm font-normal">
                                                {t(`weekday${day.day}`)}
                                            </Label>
                                        </div>
                                        {day.isOpen && (
                                            <div className="mt-2 grid gap-2">
                                                {day.intervals.map((interval, intervalIndex) => (
                                                    <div key={intervalIndex} className="flex items-center gap-2">
                                                        <Input
                                                            type="time"
                                                            aria-label={t("openingTime")}
                                                            value={interval.start}
                                                            onChange={(e) => setInterval(dayIndex, intervalIndex, "start", e.target.value)}
                                                            className="w-32"
                                                        />
                                                        <span className="text-muted-foreground">–</span>
                                                        <Input
                                                            type="time"
                                                            aria-label={t("closingTime")}
                                                            value={interval.end}
                                                            onChange={(e) => setInterval(dayIndex, intervalIndex, "end", e.target.value)}
                                                            className="w-32"
                                                        />
                                                        {day.intervals.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeInterval(dayIndex, intervalIndex)}
                                                            >
                                                                {t("remove")}
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                                {day.intervals.length < MAX_INTERVALS_PER_DAY && (
                                                    <Button type="button" variant="outline" size="sm" onClick={() => addInterval(dayIndex)}>
                                                        {t("addInterval")}
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                    {saveError && <p className="text-sm text-destructive">{saveError}</p>}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                            {t("cancel")}
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? t("saving") : staff ? t("update") : t("add")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface DeleteStaffDialogProps {
    staffId: string | null;
    isDeleting: boolean;
    onClose: () => void;
    onConfirm: (id: string) => void;
}

export function DeleteStaffDialog({ staffId, isDeleting, onClose, onConfirm }: DeleteStaffDialogProps) {
    const { t } = useLanguage();
    return (
        <Dialog open={staffId !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>{t("deleteStaff")}</DialogTitle>
                    <DialogDescription>{t("deleteStaffConfirmation")}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isDeleting}>
                        {t("cancel")}
                    </Button>
                    <Button variant="destructive" onClick={() => staffId && onConfirm(staffId)} disabled={isDeleting}>
                        {isDeleting ? t("deleting") : t("delete")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
