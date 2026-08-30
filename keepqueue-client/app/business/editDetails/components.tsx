"use client";

import type { FocusEvent } from "react";

import Image from "next/image";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/hooks";
import type { Language, Weekday } from "@/lib/types";
import {
    type BasicInfoFormState,
    type OperationScheduleFormState,
    type OwnerInfoFormState,
    type PolicyFormState,
    type ScheduleDayFormState,
    type ScheduleIntervalFormState,
    currencyOptions,
    fallbackLogo,
    MAX_INTERVALS_PER_DAY,
} from "./helpers";
import { useEditDetailsFormContext, useLogoUpload, useScheduleForm } from "./hooks";

const languageOptions: { label: string; value: Language }[] = [
    { value: "he", label: "עברית" },
    { value: "en", label: "English" },
];

const timeInputPattern = "^([01]?\\d|2[0-3]):([0-5]\\d)$";
const timeInputRegExp = new RegExp(timeInputPattern);
const timeInputPlaceholder = "HH:MM";

function normalizeTimeValue(value: string) {
    const match = value.match(timeInputRegExp);
    if (!match) {
        return value;
    }
    const [, hours, minutes] = match;
    return `${hours.padStart(2, "0")}:${minutes}`;
}

export function LogoUploadCard() {
    const { t } = useLanguage();
    const { logoPreview, logoFileName } = useEditDetailsFormContext();
    const { fileInputRef, handleLogoClick, handleLogoChange } = useLogoUpload();

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>{t("businessBranding")}</CardTitle>
                <CardDescription>{t("logoUploadHelper")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative h-32 w-32 overflow-hidden rounded-2xl border border-dashed border-muted-foreground/30 bg-muted">
                        <Image
                            src={logoPreview || fallbackLogo}
                            alt={t("businessLogo")}
                            width={128}
                            height={128}
                            unoptimized
                            className="h-full w-full object-fill"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">{t("businessLogo")}</Label>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Button type="button" variant="secondary" onClick={handleLogoClick}>
                                {t("uploadNewLogo")}
                            </Button>
                            {logoFileName && (
                                <span className="text-xs text-muted-foreground truncate">{logoFileName}</span>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={handleLogoChange}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function BasicInformationCard() {
    const { t } = useLanguage();
    const { basicInfo, setBasicInfo, categoriesPreview } = useEditDetailsFormContext();

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>{t("basicInformation")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="business-name">{t("businessName")}</Label>
                        <Input
                            id="business-name"
                            value={basicInfo.name}
                            onChange={(event) => setBasicInfo((prev) => ({ ...prev, name: event.target.value }))}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="business-phone">{t("businessPhone")}</Label>
                        <Input
                            id="business-phone"
                            value={basicInfo.phone}
                            onChange={(event) => setBasicInfo((prev) => ({ ...prev, phone: event.target.value }))}
                        />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="business-address">{t("address")}</Label>
                        <Input
                            id="business-address"
                            value={basicInfo.address}
                            onChange={(event) => setBasicInfo((prev) => ({ ...prev, address: event.target.value }))}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="business-language">{t("languageLabel")}</Label>
                        <Select
                            value={basicInfo.language}
                            onValueChange={(value) =>
                                setBasicInfo((prev) => ({ ...prev, language: value as Language }))
                            }
                        >
                            <SelectTrigger id="business-language">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {languageOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="business-currency">{t("currencyLabel")}</Label>
                        <Select
                            value={basicInfo.currency}
                            onValueChange={(value) => setBasicInfo((prev) => ({ ...prev, currency: value }))}
                        >
                            <SelectTrigger id="business-currency">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {currencyOptions.map((currency) => (
                                    <SelectItem key={currency} value={currency}>
                                        {currency}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="business-categories">{t("categoriesLabel")}</Label>
                        <Input
                            id="business-categories"
                            value={basicInfo.categories}
                            onChange={(event) => setBasicInfo((prev) => ({ ...prev, categories: event.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">{t("categoriesHelper")}</p>
                        {categoriesPreview.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {categoriesPreview.map((category) => (
                                    <Badge key={category} variant="secondary">
                                        {category}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="business-description">{t("businessDescription")}</Label>
                    <Textarea
                        id="business-description"
                        value={basicInfo.description}
                        onChange={(event) => setBasicInfo((prev) => ({ ...prev, description: event.target.value }))}
                        rows={4}
                        placeholder={t("businessDescriptionPlaceholder")}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

export function OwnerInformationCard() {
    const { t } = useLanguage();
    const { ownerInfo, setOwnerInfo } = useEditDetailsFormContext();

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>{t("ownerInformation")}</CardTitle>
                <CardDescription>{t("ownerInformationDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="owner-first-name">{t("firstName")}</Label>
                        <Input
                            id="owner-first-name"
                            value={ownerInfo.firstName}
                            onChange={(event) =>
                                setOwnerInfo((prev) => ({ ...prev, firstName: event.target.value }))
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="owner-last-name">{t("lastName")}</Label>
                        <Input
                            id="owner-last-name"
                            value={ownerInfo.lastName}
                            onChange={(event) =>
                                setOwnerInfo((prev) => ({ ...prev, lastName: event.target.value }))
                            }
                        />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="owner-email">{t("businessEmail")}</Label>
                        <Input
                            id="owner-email"
                            type="email"
                            value={ownerInfo.email}
                            onChange={(event) => setOwnerInfo((prev) => ({ ...prev, email: event.target.value }))}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="owner-phone">{t("businessPhone")}</Label>
                        <Input
                            id="owner-phone"
                            value={ownerInfo.phone}
                            onChange={(event) => setOwnerInfo((prev) => ({ ...prev, phone: event.target.value }))}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function PolicySettingsCard() {
    const { t } = useLanguage();
    const { policyForm, setPolicyForm } = useEditDetailsFormContext();

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>{t("policySettings")}</CardTitle>
                <CardDescription>{t("policySettingsDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="cancellation-window">{t("cancellationWindowLabel")}</Label>
                        <Input
                            id="cancellation-window"
                            type="number"
                            min={0}
                            value={policyForm.cancellationWindowMin}
                            onChange={(event) =>
                                setPolicyForm((prev) => ({ ...prev, cancellationWindowMin: event.target.value }))
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="late-threshold">{t("lateArrivalLabel")}</Label>
                        <Input
                            id="late-threshold"
                            type="number"
                            min={0}
                            value={policyForm.lateThresholdMin}
                            onChange={(event) =>
                                setPolicyForm((prev) => ({ ...prev, lateThresholdMin: event.target.value }))
                            }
                        />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="no-show-limit">{t("noShowLimitLabel")}</Label>
                        <Input
                            id="no-show-limit"
                            type="number"
                            min={0}
                            value={policyForm.noShowLimit}
                            onChange={(event) =>
                                setPolicyForm((prev) => ({ ...prev, noShowLimit: event.target.value }))
                            }
                        />
                        <p className="text-xs text-muted-foreground">{t("noShowLimitHelper")}</p>
                    </div>
                    <div className="flex items-center gap-3 rounded-md border border-input px-3 py-2">
                        <Checkbox
                            id="no-show-block"
                            checked={policyForm.noShowAutoBlock}
                            onCheckedChange={(checked) =>
                                setPolicyForm((prev) => ({
                                    ...prev,
                                    noShowAutoBlock: checked === true,
                                }))
                            }
                        />
                        <Label htmlFor="no-show-block" className="text-sm font-medium">
                            {t("noShowAutoBlockLabel")}
                        </Label>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function WorkingHoursCard() {
    const { t } = useLanguage();
    const { workingHoursSummary } = useEditDetailsFormContext();
    const { scheduleForm, handleToggleDay, handleIntervalChange, handleAddInterval, handleRemoveInterval } = useScheduleForm();

    const handleTimeBlur =
        (dayValue: Weekday, intervalIndex: number, field: keyof ScheduleIntervalFormState) =>
        (event: FocusEvent<HTMLInputElement>) => {
            const normalizedValue = normalizeTimeValue(event.target.value);
            if (normalizedValue !== event.target.value) {
                handleIntervalChange(dayValue, intervalIndex, field, normalizedValue);
            }
        };

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>{t("workingHoursLabel")}</CardTitle>
                <CardDescription>{t("workingHoursHelper")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    <div>
                        <Label>{t("workingHoursLabel")}</Label>
                        <p className="text-xs text-muted-foreground">{t("workingHoursHelper")}</p>
                    </div>
                    <div className="space-y-3">
                        {scheduleForm.map((day: ScheduleDayFormState) => {
                            const dayLabelKey = `weekday${day.day}`;
                            const isDayOpen = day.isOpen && day.intervals.length > 0;
                            return (
                                <div key={day.day} className="rounded-xl border bg-background p-4 space-y-3">
                                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id={`schedule-day-${day.day}`}
                                                checked={day.isOpen}
                                                onCheckedChange={(checked) =>
                                                    handleToggleDay(day.day, checked === true)
                                                }
                                            />
                                            <Label htmlFor={`schedule-day-${day.day}`} className="font-medium">
                                                {t(dayLabelKey as any)}
                                            </Label>
                                            {!isDayOpen && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {t("workingHoursClosedLabel")}
                                                </Badge>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="self-start md:self-auto"
                                            onClick={() => handleAddInterval(day.day)}
                                            disabled={!day.isOpen || day.intervals.length >= MAX_INTERVALS_PER_DAY}
                                        >
                                            <Plus className="mr-1 h-4 w-4" />
                                            {t("workingHoursAddInterval")}
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {day.intervals.map((interval: ScheduleIntervalFormState, intervalIndex: number) => (
                                            <div
                                                key={`${day.day}-${intervalIndex}`}
                                                className="flex flex-col gap-2 md:flex-row md:items-center"
                                            >
                                                <div className="flex w-full flex-1 flex-col gap-1">
                                                    <Label className="text-xs font-medium">
                                                        {t("workingHoursStartLabel")}
                                                    </Label>
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern={timeInputPattern}
                                                        placeholder={timeInputPlaceholder}
                                                        value={interval.start}
                                                        onChange={(event) =>
                                                            handleIntervalChange(
                                                                day.day,
                                                                intervalIndex,
                                                                "start",
                                                                event.target.value
                                                            )
                                                        }
                                                        onBlur={handleTimeBlur(day.day, intervalIndex, "start")}
                                                        disabled={!day.isOpen}
                                                        className={!day.isOpen ? "opacity-60" : undefined}
                                                    />
                                                </div>
                                                <div className="flex w-full flex-1 flex-col gap-1">
                                                    <Label className="text-xs font-medium">
                                                        {t("workingHoursEndLabel")}
                                                    </Label>
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern={timeInputPattern}
                                                        placeholder={timeInputPlaceholder}
                                                        value={interval.end}
                                                        onChange={(event) =>
                                                            handleIntervalChange(
                                                                day.day,
                                                                intervalIndex,
                                                                "end",
                                                                event.target.value
                                                            )
                                                        }
                                                        onBlur={handleTimeBlur(day.day, intervalIndex, "end")}
                                                        disabled={!day.isOpen}
                                                        className={!day.isOpen ? "opacity-60" : undefined}
                                                    />
                                                </div>
                                                {day.intervals.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveInterval(day.day, intervalIndex)}
                                                        disabled={!day.isOpen}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="space-y-1">
                        <Label className="text-sm font-medium">{t("workingHoursSummaryLabel")}</Label>
                        <p className="text-xs text-muted-foreground">{t("workingHoursSummaryHelper")}</p>
                        <div className="rounded-lg border bg-muted/40 p-3 text-sm whitespace-pre-line">
                            {workingHoursSummary || t("workingHoursClosedAll")}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function NoBusinessCard() {
    const { t } = useLanguage();

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>{t("businessDetails")}</CardTitle>
                <CardDescription>{t("selectBusinessPrompt")}</CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="outline" asChild>
                    <Link href="/business/dashboard">{t("dashboard")}</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

