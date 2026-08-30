import type { BusinessWithRelations, Language, OperationSchedule, Policy, User, Weekday } from "@/lib/types";
import { convertMinutesToTime, convertTimeToMinutes } from "@/lib/helpers/schedule";

export const currencyOptions = ["ILS", "USD"] as const;
export const fallbackLogo = "/placeholder.svg";
export const MAX_INTERVALS_PER_DAY = 3;

export type BasicInfoFormState = {
    name: string;
    phone: string;
    address: string;
    categories: string;
    language: Language;
    currency: string;
    description: string;
};

export type OwnerInfoFormState = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
};

export type PolicyFormState = {
    cancellationWindowMin: string;
    lateThresholdMin: string;
    noShowAutoBlock: boolean;
    noShowLimit: string;
};

export type ScheduleIntervalFormState = {
    start: string;
    end: string;
};

export type ScheduleDayFormState = {
    day: Weekday;
    isOpen: boolean;
    intervals: ScheduleIntervalFormState[];
};

export type OperationScheduleFormState = ScheduleDayFormState[];

const defaultScheduleInterval: ScheduleIntervalFormState = {
    start: "09:00",
    end: "17:00",
};

export function createInitialBasicInfo(business: BusinessWithRelations | null, owner: User | null): BasicInfoFormState {
    return {
        name: business?.name ?? "",
        phone: business?.phone ?? owner?.phone ?? "",
        address: business?.address ?? "",
        categories: business?.categories?.join(", ") ?? "",
        language: business?.lang ?? "he",
        currency: business?.currency ?? currencyOptions[0],
        description: business?.description ?? "",
    };
}

export function createInitialOwnerInfo(owner: User | null): OwnerInfoFormState {
    return {
        firstName: owner?.firstName ?? "",
        lastName: owner?.lastName ?? "",
        email: owner?.email ?? "",
        phone: owner?.phone ?? "",
    };
}

export function createInitialPolicyForm(business: BusinessWithRelations | null): PolicyFormState {
    return {
        cancellationWindowMin: business?.policy?.cancellationWindowMin?.toString() ?? "120",
        lateThresholdMin: business?.policy?.lateThresholdMin?.toString() ?? "10",
        noShowAutoBlock: business?.policy?.noShowAutoBlock ?? false,
        noShowLimit: business?.policy?.noShowLimit?.toString() ?? "",
    };
}

export function createInitialScheduleForm(schedule: OperationSchedule[] | null | undefined): OperationScheduleFormState {
    return Array.from({ length: 7 }, (_, index) => {
        const day = index as Weekday;
        const existing = schedule?.find((entry) => Number(entry.day) === day);
        if (!existing || !existing.intervals || existing.intervals.length === 0) {
            return {
                day,
                isOpen: false,
                intervals: [createDefaultInterval()],
            };
        }

        return {
            day,
            isOpen: true,
            intervals: existing.intervals.map((interval) => ({
                start: convertMinutesToTime(interval.startMin),
                end: convertMinutesToTime(interval.endMin),
            })),
        };
    });
}

export function createDefaultInterval(): ScheduleIntervalFormState {
    return { ...defaultScheduleInterval };
}

export function scheduleFormToOperationSchedule(form: OperationScheduleFormState): OperationSchedule[] {
    return form
        .map((day) => {
            if (!day.isOpen) {
                return { day: day.day, intervals: [] };
            }
            const intervals = day.intervals
                .map((interval) => {
                    const startMin = convertTimeToMinutes(interval.start);
                    const endMin = convertTimeToMinutes(interval.end);
                    if (startMin === null || endMin === null || startMin >= endMin) {
                        return null;
                    }
                    return { startMin, endMin };
                })
                .filter((interval): interval is { startMin: number; endMin: number } => Boolean(interval));
            return {
                day: day.day,
                intervals,
            };
        })
        .filter((entry) => entry.intervals.length > 0);
}

export function parseNonNegativeInteger(value: string, fallback: number) {
    if (value.length === 0) {
        return fallback;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return fallback;
    }
    return Math.round(parsed);
}

export function sanitizeString(value: string): string {
    return value.trim();
}
