"use client";

import { ChangeEvent, createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { deleteField } from "firebase/firestore";
import { toast } from "sonner";

import { firebaseTimestamp, setDocument } from "@/lib/firebase";
import { formatWorkingHoursFromSchedule } from "@/lib/helpers/schedule";
import { useAuthStore, useAuthStoreBase, useBusinessesStore } from "@/lib/store";
import type { BusinessWithRelations, Language, Policy, Weekday } from "@/lib/types";
import { useRefreshBusiness } from "../hooks";
import {
    type BasicInfoFormState,
    type OperationScheduleFormState,
    type OwnerInfoFormState,
    type PolicyFormState,
    type ScheduleDayFormState,
    type ScheduleIntervalFormState,
    createInitialBasicInfo,
    createInitialOwnerInfo,
    createInitialPolicyForm,
    createInitialScheduleForm,
    createDefaultInterval,
    scheduleFormToOperationSchedule,
    parseNonNegativeInteger,
    sanitizeString,
    fallbackLogo,
    MAX_INTERVALS_PER_DAY,
} from "./helpers";
import { useLanguage } from "@/hooks";

export function useEditDetailsForm() {
    const { t } = useLanguage();
    const currentBusiness = useBusinessesStore.currentBusiness();
    const businessOwner = useAuthStore.user();
    const setCurrentBusiness = useBusinessesStore.setCurrentBusiness();
    const refreshBusiness = useRefreshBusiness();

    const initialBasicInfo = useMemo(
        () => createInitialBasicInfo(currentBusiness, businessOwner),
        [currentBusiness, businessOwner]
    );
    const initialOwnerInfo = useMemo(() => createInitialOwnerInfo(businessOwner), [businessOwner]);
    const initialPolicyForm = useMemo(() => createInitialPolicyForm(currentBusiness), [currentBusiness]);
    const initialSchedule = useMemo(
        () => createInitialScheduleForm(currentBusiness?.operationSchedule),
        [currentBusiness?.operationSchedule]
    );
    const initialLogo = useMemo(() => currentBusiness?.logoUrl ?? fallbackLogo, [currentBusiness?.logoUrl]);

    const [basicInfo, setBasicInfo] = useState<BasicInfoFormState>(initialBasicInfo);
    const [ownerInfo, setOwnerInfo] = useState<OwnerInfoFormState>(initialOwnerInfo);
    const [policyForm, setPolicyForm] = useState<PolicyFormState>(initialPolicyForm);
    const [scheduleForm, setScheduleForm] = useState<OperationScheduleFormState>(initialSchedule);
    const [logoPreview, setLogoPreview] = useState(initialLogo);
    const [logoFileName, setLogoFileName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => setBasicInfo(initialBasicInfo), [initialBasicInfo]);
    useEffect(() => setOwnerInfo(initialOwnerInfo), [initialOwnerInfo]);
    useEffect(() => setPolicyForm(initialPolicyForm), [initialPolicyForm]);
    useEffect(() => setScheduleForm(initialSchedule), [initialSchedule]);
    useEffect(() => {
        setLogoPreview(initialLogo);
        setLogoFileName("");
    }, [initialLogo]);

    const normalizedSchedulePreview = useMemo(
        () => scheduleFormToOperationSchedule(scheduleForm),
        [scheduleForm]
    );
    const workingHoursSummary = useMemo(
        () => formatWorkingHoursFromSchedule(normalizedSchedulePreview, (key: string) => t(key as any)),
        [normalizedSchedulePreview, t]
    );

    const categoriesPreview = useMemo(
        () => basicInfo.categories.split(",").map((item) => item.trim()).filter(Boolean),
        [basicInfo.categories]
    );

    const handleReset = () => {
        setBasicInfo(initialBasicInfo);
        setOwnerInfo(initialOwnerInfo);
        setPolicyForm(initialPolicyForm);
        setScheduleForm(initialSchedule);
        setLogoPreview(initialLogo);
        setLogoFileName("");
    };

    const handleSubmit = async () => {
        if (!currentBusiness?.id) {
            toast.error(t("businessDetailsSaveError"));
            return;
        }

        const normalizedCategories = basicInfo.categories
            .split(",")
            .map((item) => sanitizeString(item))
            .filter(Boolean);
        const normalizedName = sanitizeString(basicInfo.name);
        const normalizedPhone = sanitizeString(basicInfo.phone);
        const normalizedAddress = sanitizeString(basicInfo.address);
        const normalizedDescription = sanitizeString(basicInfo.description);

        const cancellationWindowMin = parseNonNegativeInteger(
            sanitizeString(policyForm.cancellationWindowMin),
            currentBusiness.policy?.cancellationWindowMin ?? 120
        );
        const lateThresholdMin = parseNonNegativeInteger(
            sanitizeString(policyForm.lateThresholdMin),
            currentBusiness.policy?.lateThresholdMin ?? 10
        );

        const noShowLimitInput = sanitizeString(policyForm.noShowLimit);
        const hasNoShowLimit = noShowLimitInput.length > 0;
        const noShowLimitValue = hasNoShowLimit
            ? parseNonNegativeInteger(noShowLimitInput, currentBusiness.policy?.noShowLimit ?? 0)
            : null;

        const policyPayload: Record<string, number | boolean | ReturnType<typeof deleteField>> = {
            cancellationWindowMin,
            lateThresholdMin,
            noShowAutoBlock: policyForm.noShowAutoBlock,
        };

        const policyForStore: Policy = {
            cancellationWindowMin,
            lateThresholdMin,
            noShowAutoBlock: policyForm.noShowAutoBlock,
        };

        if (hasNoShowLimit && typeof noShowLimitValue === "number") {
            policyPayload.noShowLimit = noShowLimitValue;
            policyForStore.noShowLimit = noShowLimitValue;
        } else {
            policyPayload.noShowLimit = deleteField();
        }

        const ownerPayload = {
            firstName: sanitizeString(ownerInfo.firstName),
            lastName: sanitizeString(ownerInfo.lastName),
            email: ownerInfo.email.trim().toLowerCase(),
            phone: sanitizeString(ownerInfo.phone),
        };

        const schedulePayload = scheduleFormToOperationSchedule(scheduleForm);
        const updateTimestamp = firebaseTimestamp();
        const shouldUpdateLogo = Boolean(logoPreview && logoPreview !== initialLogo);
        const businessPayload: Record<string, any> = {
            name: normalizedName,
            phone: normalizedPhone,
            address: normalizedAddress,
            categories: normalizedCategories,
            lang: basicInfo.language,
            currency: basicInfo.currency,
            description: normalizedDescription,
            operationSchedule: schedulePayload,
            timestamp: updateTimestamp,
            policy: policyPayload,
        };

        if (shouldUpdateLogo) {
            businessPayload.logoUrl = logoPreview;
        }

        setIsSaving(true);
        try {
            const businessSaved = await setDocument("businesses", currentBusiness.id, businessPayload);
            if (!businessSaved) {
                throw new Error("business_update_failed");
            }

            if (businessOwner?.id) {
                const ownerSaved = await setDocument("users", businessOwner.id, ownerPayload);
                if (!ownerSaved) {
                    throw new Error("owner_update_failed");
                }

                useAuthStoreBase.setState((prevState) => ({
                    ...prevState,
                    user: prevState.user
                        ? {
                              ...prevState.user,
                              ...ownerPayload,
                          }
                        : prevState.user,
                }));
            }

            setCurrentBusiness((prev) => {
                if (!prev) return prev;
                const nextPolicy: Policy = {
                    ...(prev.policy ?? {}),
                    ...policyForStore,
                };
                if (!hasNoShowLimit) {
                    delete nextPolicy.noShowLimit;
                }

                const nextBusiness: BusinessWithRelations = {
                    ...prev,
                    name: normalizedName,
                    phone: normalizedPhone,
                    address: normalizedAddress,
                    categories: normalizedCategories,
                    lang: basicInfo.language,
                    currency: basicInfo.currency,
                    description: normalizedDescription,
                    operationSchedule: schedulePayload,
                    timestamp: updateTimestamp,
                    policy: nextPolicy,
                };

                if (shouldUpdateLogo) {
                    nextBusiness.logoUrl = logoPreview;
                }

                return nextBusiness;
            });

            toast.success(t("businessDetailsSaveSuccess"));
            await refreshBusiness();
        } catch (error) {
            console.error("Failed to save business details", error);
            toast.error(t("businessDetailsSaveError"));
        } finally {
            setIsSaving(false);
        }
    };

    return {
        currentBusiness,
        basicInfo,
        setBasicInfo,
        ownerInfo,
        setOwnerInfo,
        policyForm,
        setPolicyForm,
        scheduleForm,
        setScheduleForm,
        logoPreview,
        logoFileName,
        setLogoPreview,
        setLogoFileName,
        isSaving,
        workingHoursSummary,
        categoriesPreview,
        handleReset,
        handleSubmit,
    };
}

type EditDetailsFormContextType = ReturnType<typeof useEditDetailsForm>;

const EditDetailsFormContext = createContext<EditDetailsFormContextType | null>(null);

export function useEditDetailsFormContext() {
    const context = useContext(EditDetailsFormContext);
    if (!context) {
        throw new Error("useEditDetailsFormContext must be used within EditDetailsFormProvider");
    }
    return context;
}

export function EditDetailsFormProvider({ children }: { children: React.ReactNode }) {
    const formData = useEditDetailsForm();
    return <EditDetailsFormContext.Provider value={formData}>{children}</EditDetailsFormContext.Provider>;
}

export function useLogoUpload() {
    const { setLogoPreview, setLogoFileName } = useEditDetailsFormContext();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleLogoClick = () => fileInputRef.current?.click();

    const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setLogoFileName(file.name);
    };

    return {
        fileInputRef,
        handleLogoClick,
        handleLogoChange,
    };
}

export function useScheduleForm() {
    const { scheduleForm, setScheduleForm } = useEditDetailsFormContext();
    
    const updateDayState = (day: Weekday, updater: (dayState: ScheduleDayFormState) => ScheduleDayFormState) => {
        setScheduleForm((prev) => prev.map((entry) => (entry.day === day ? updater(entry) : entry)));
    };

    const handleToggleDay = (day: Weekday, checked: boolean) => {
        updateDayState(day, (entry) => ({
            ...entry,
            isOpen: checked,
            intervals: checked && entry.intervals.length === 0 ? [createDefaultInterval()] : entry.intervals,
        }));
    };

    const handleIntervalChange = (day: Weekday, intervalIndex: number, field: "start" | "end", value: string) => {
        updateDayState(day, (entry) => ({
            ...entry,
            intervals: entry.intervals.map((interval, idx) =>
                idx === intervalIndex ? { ...interval, [field]: value } : interval
            ),
        }));
    };

    const handleAddInterval = (day: Weekday) => {
        updateDayState(day, (entry) => {
            if (entry.intervals.length >= MAX_INTERVALS_PER_DAY) {
                return entry;
            }
            return {
                ...entry,
                intervals: [...entry.intervals, createDefaultInterval()],
            };
        });
    };

    const handleRemoveInterval = (day: Weekday, intervalIndex: number) => {
        updateDayState(day, (entry) => {
            const nextIntervals = entry.intervals.filter((_, idx) => idx !== intervalIndex);
            return {
                ...entry,
                intervals: nextIntervals,
            };
        });
    };

    return {
        scheduleForm,
        handleToggleDay,
        handleIntervalChange,
        handleAddInterval,
        handleRemoveInterval,
    };
}

