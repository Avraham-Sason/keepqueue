import type { OperationSchedule } from "@/lib/types";

type TranslateFn = (key: string) => string;

export function formatWorkingHoursFromSchedule(
    schedule: OperationSchedule[] | null | undefined,
    translate: TranslateFn
) {
    if (!schedule || schedule.length === 0) {
        return "";
    }

    return [...schedule]
        .sort((a, b) => Number(a.day) - Number(b.day))
        .map((entry) => {
            const dayKey = `weekday${entry.day}`;
            const dayLabel = translate(dayKey) ?? dayKey;
            if (!entry.intervals || entry.intervals.length === 0) {
                return `${dayLabel}: —`;
            }
            const intervals = entry.intervals
                .map((interval) => `${convertMinutesToTime(interval.startMin)} - ${convertMinutesToTime(interval.endMin)}`)
                .join(", ");
            return `${dayLabel}: ${intervals}`;
        })
        .join("\n");
}

export function convertMinutesToTime(value?: number) {
    if (value === undefined || value === null) {
        return "--:--";
    }
    const hours = Math.floor(value / 60)
        .toString()
        .padStart(2, "0");
    const minutes = (value % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}`;
}

export function convertTimeToMinutes(value: string) {
    if (!value) {
        return null;
    }
    const [hoursPart, minutesPart] = value.split(":");
    const hours = Number(hoursPart);
    const minutes = Number(minutesPart);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || minutes < 0 || minutes >= 60) {
        return null;
    }
    return hours * 60 + minutes;
}


