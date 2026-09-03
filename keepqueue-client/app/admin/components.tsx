"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, LogOut, Plus, UserPlus } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/hooks";
import { useCreateBusiness, useCreateUser, useSetBusinessActive } from "./hooks";
import {
    MAX_LENGTHS,
    validateCreateBusiness,
    validateCreateUser,
    type AdminBusinessRow,
    type AdminUserRow,
    type AdminUserType,
    type CreateAdminBusinessPayload,
    type CreateAdminUserPayload,
    type FieldErrors,
} from "./helpers";

const emptyUserForm: CreateAdminUserPayload = {
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    type: "business",
};

const emptyBusinessForm = {
    name: "",
    ownerId: "",
    phone: "",
    address: "",
};

function Field({ id, label, error, children }: { id: string; label: React.ReactNode; error?: string; children: React.ReactNode }) {
    const { t } = useLanguage();
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            {children}
            {error ? <p className="text-sm text-destructive">{t(error)}</p> : null}
        </div>
    );
}

function OptionalLabel({ text }: { text: string }) {
    const { t } = useLanguage();
    return (
        <span className="flex items-center gap-1">
            {text}
            <span className="text-xs font-normal text-muted-foreground">{t("adminOptionalSuffix")}</span>
        </span>
    );
}

// Radix unmounts DialogContent while closed, so the form state below starts fresh on every open.
function CreateUserForm({ onDone }: { onDone: () => void }) {
    const { t } = useLanguage();
    const [form, setForm] = useState<CreateAdminUserPayload>(emptyUserForm);
    const [errors, setErrors] = useState<FieldErrors>({});
    const createUser = useCreateUser();

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const payload: CreateAdminUserPayload = {
            ...form,
            email: form.email.trim().toLowerCase(),
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            phone: form.phone.trim(),
        };
        const nextErrors = validateCreateUser(payload);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        createUser.mutate(payload, { onSuccess: onDone });
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>{t("adminCreateUserTitle")}</DialogTitle>
                <DialogDescription>{t("adminCreateUserDescription")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                    <Field id="admin-user-email" label={t("email")} error={errors.email}>
                        <Input
                            id="admin-user-email"
                            type="email"
                            autoComplete="off"
                            maxLength={MAX_LENGTHS.email}
                            value={form.email}
                            onChange={(event) => setForm({ ...form, email: event.target.value })}
                            aria-invalid={!!errors.email}
                        />
                    </Field>
                    <Field id="admin-user-password" label={t("password")} error={errors.password}>
                        <Input
                            id="admin-user-password"
                            type="password"
                            autoComplete="new-password"
                            maxLength={MAX_LENGTHS.password}
                            value={form.password}
                            onChange={(event) => setForm({ ...form, password: event.target.value })}
                            aria-invalid={!!errors.password}
                        />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field id="admin-user-first-name" label={t("firstName")} error={errors.firstName}>
                            <Input
                                id="admin-user-first-name"
                                maxLength={MAX_LENGTHS.name}
                                value={form.firstName}
                                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                                aria-invalid={!!errors.firstName}
                            />
                        </Field>
                        <Field id="admin-user-last-name" label={t("lastName")} error={errors.lastName}>
                            <Input
                                id="admin-user-last-name"
                                maxLength={MAX_LENGTHS.name}
                                value={form.lastName}
                                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                                aria-invalid={!!errors.lastName}
                            />
                        </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field id="admin-user-phone" label={t("phone")} error={errors.phone}>
                            <Input
                                id="admin-user-phone"
                                type="tel"
                                maxLength={MAX_LENGTHS.phone}
                                value={form.phone}
                                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                                aria-invalid={!!errors.phone}
                            />
                        </Field>
                        <Field id="admin-user-type" label={t("adminAccountType")}>
                            <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as AdminUserType })}>
                                <SelectTrigger id="admin-user-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="business">{t("adminAccountTypeBusiness")}</SelectItem>
                                    <SelectItem value="customer">{t("adminAccountTypeCustomer")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onDone} disabled={createUser.isPending}>
                        {t("cancel")}
                    </Button>
                    <Button type="submit" disabled={createUser.isPending}>
                        {createUser.isPending ? t("adminCreating") : t("adminCreate")}
                    </Button>
                </DialogFooter>
            </form>
        </>
    );
}

export function CreateUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <CreateUserForm onDone={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    );
}

function CreateBusinessForm({ owners, onDone }: { owners: AdminUserRow[]; onDone: () => void }) {
    const { t } = useLanguage();
    const [form, setForm] = useState(emptyBusinessForm);
    const [errors, setErrors] = useState<FieldErrors>({});
    const createBusiness = useCreateBusiness();
    const hasOwners = owners.length > 0;

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const payload: CreateAdminBusinessPayload = {
            name: form.name.trim(),
            ownerId: form.ownerId,
            phone: form.phone.trim() || undefined,
            address: form.address.trim() || undefined,
        };
        const nextErrors = validateCreateBusiness(payload);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        createBusiness.mutate(payload, { onSuccess: onDone });
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>{t("adminCreateBusinessTitle")}</DialogTitle>
                <DialogDescription>{t("adminCreateBusinessDescription")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                    <Field id="admin-business-name" label={t("businessName")} error={errors.name}>
                        <Input
                            id="admin-business-name"
                            maxLength={MAX_LENGTHS.businessName}
                            value={form.name}
                            onChange={(event) => setForm({ ...form, name: event.target.value })}
                            aria-invalid={!!errors.name}
                        />
                    </Field>
                    <Field id="admin-business-owner" label={t("adminBusinessOwner")} error={errors.ownerId}>
                        <Select
                            value={form.ownerId || undefined}
                            onValueChange={(value) => setForm({ ...form, ownerId: value })}
                            disabled={!hasOwners}
                        >
                            <SelectTrigger id="admin-business-owner" aria-invalid={!!errors.ownerId}>
                                <SelectValue placeholder={t("adminSelectOwner")} />
                            </SelectTrigger>
                            <SelectContent>
                                {owners.map((owner) => (
                                    <SelectItem key={owner.id} value={owner.id}>
                                        {`${owner.firstName} ${owner.lastName}`.trim()} · {owner.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    {!hasOwners ? <p className="text-sm text-destructive">{t("adminNoOwnersAvailable")}</p> : null}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field id="admin-business-phone" label={<OptionalLabel text={t("phone")} />} error={errors.phone}>
                            <Input
                                id="admin-business-phone"
                                type="tel"
                                maxLength={MAX_LENGTHS.phone}
                                value={form.phone}
                                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                                aria-invalid={!!errors.phone}
                            />
                        </Field>
                        <Field id="admin-business-address" label={<OptionalLabel text={t("address")} />}>
                            <Input
                                id="admin-business-address"
                                maxLength={MAX_LENGTHS.address}
                                value={form.address}
                                onChange={(event) => setForm({ ...form, address: event.target.value })}
                            />
                        </Field>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onDone} disabled={createBusiness.isPending}>
                        {t("cancel")}
                    </Button>
                    <Button type="submit" disabled={!hasOwners || createBusiness.isPending}>
                        {createBusiness.isPending ? t("adminCreating") : t("adminCreate")}
                    </Button>
                </DialogFooter>
            </form>
        </>
    );
}

export function CreateBusinessDialog({
    open,
    onOpenChange,
    owners,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    owners: AdminUserRow[];
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <CreateBusinessForm owners={owners} onDone={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    );
}

function BusinessCard({ business }: { business: AdminBusinessRow }) {
    const { t } = useLanguage();
    const setActive = useSetBusinessActive();

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{business.name}</CardTitle>
                    <Badge variant={business.isActive ? "secondary" : "outline"}>
                        {business.isActive ? t("active") : t("adminInactive")}
                    </Badge>
                </div>
                <CardDescription>{business.ownerName || business.ownerEmail || t("adminOwnerUnknown")}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3">
                <div className="grid gap-1 text-sm text-muted-foreground">
                    {business.ownerEmail ? <span className="ellipsis">{business.ownerEmail}</span> : null}
                    {business.phone ? <span>{business.phone}</span> : null}
                    {business.address ? <span>{business.address}</span> : null}
                    {business.timezone ? <span>{business.timezone}</span> : null}
                </div>
                <Button
                    variant={business.isActive ? "outline" : "default"}
                    size="sm"
                    className="mt-auto"
                    disabled={setActive.isPending}
                    onClick={() => setActive.mutate({ businessId: business.id, isActive: !business.isActive })}
                >
                    {business.isActive ? t("adminDeactivate") : t("adminActivate")}
                </Button>
            </CardContent>
        </Card>
    );
}

export function BusinessesSection({ businesses }: { businesses: AdminBusinessRow[] }) {
    const { t } = useLanguage();

    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">{t("adminBusinessesTitle")}</h2>
                <Badge variant="outline">{businesses.length}</Badge>
            </div>
            {businesses.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">{t("adminNoBusinesses")}</CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {businesses.map((business) => (
                        <BusinessCard key={business.id} business={business} />
                    ))}
                </div>
            )}
        </section>
    );
}

const userTypeLabelKey = (type: AdminUserRow["type"]) =>
    type === "business" ? "adminAccountTypeBusiness" : type === "admin" ? "adminAccountTypeAdmin" : "adminAccountTypeCustomer";

function UserCard({ user }: { user: AdminUserRow }) {
    const { t } = useLanguage();
    const fullName = `${user.firstName} ${user.lastName}`.trim();

    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{fullName || user.email}</CardTitle>
                    <Badge variant={user.isActive ? "secondary" : "outline"}>{user.isActive ? t("active") : t("adminInactive")}</Badge>
                </div>
                <CardDescription className="ellipsis">{user.email}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{t(userTypeLabelKey(user.type))}</Badge>
                    {user.type === "business" ? (
                        <Badge variant="outline">
                            {t("adminOwnedBusinesses")} {user.ownedBusinessIds.length}
                        </Badge>
                    ) : null}
                </div>
                {user.phone ? <span className="text-sm text-muted-foreground">{user.phone}</span> : null}
            </CardContent>
        </Card>
    );
}

export function UsersSection({ users }: { users: AdminUserRow[] }) {
    const { t } = useLanguage();

    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">{t("adminUsersTitle")}</h2>
                <Badge variant="outline">{users.length}</Badge>
            </div>
            {users.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">{t("adminNoUsers")}</CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {users.map((user) => (
                        <UserCard key={user.id} user={user} />
                    ))}
                </div>
            )}
        </section>
    );
}

export function AdminActions({ owners }: { owners: AdminUserRow[] }) {
    const { t } = useLanguage();
    const router = useRouter();
    const logout = useAuthStore.logout();
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [businessDialogOpen, setBusinessDialogOpen] = useState(false);

    const handleSignOut = async () => {
        await logout();
        router.replace("/auth/signin/business");
    };

    return (
        <div className="flex flex-wrap gap-2">
            <Button onClick={() => setUserDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                {t("adminCreateUserTitle")}
            </Button>
            <Button variant="outline" onClick={() => setBusinessDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                {t("adminCreateBusinessTitle")}
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                {t("signOut")}
            </Button>
            <CreateUserDialog open={userDialogOpen} onOpenChange={setUserDialogOpen} />
            <CreateBusinessDialog open={businessDialogOpen} onOpenChange={setBusinessDialogOpen} owners={owners} />
        </div>
    );
}
