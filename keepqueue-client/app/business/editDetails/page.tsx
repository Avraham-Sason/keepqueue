"use client";

import { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks";
import { EditDetailsFormProvider, useEditDetailsFormContext } from "./hooks";
import {
    BasicInformationCard,
    LogoUploadCard,
    NoBusinessCard,
    OwnerInformationCard,
    PolicySettingsCard,
    WorkingHoursCard,
} from "./components";

function EditDetailsForm() {
    const { t, dir } = useLanguage();
    const { currentBusiness, isSaving, handleReset, handleSubmit } = useEditDetailsFormContext();

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await handleSubmit();
    };

    return (
        <form className="space-y-8" dir={dir} onSubmit={onSubmit} noValidate>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-semibold text-primary uppercase tracking-wide">{t("businessDetails")}</p>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("editBusinessDetails")}</h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl">{t("editBusinessDetailsDescription")}</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <Button type="button" variant="outline" onClick={handleReset} disabled={!currentBusiness || isSaving}>
                        {t("resetChanges")}
                    </Button>
                    <Button type="submit" disabled={!currentBusiness || isSaving}>
                        {isSaving ? t("saving") : t("saveChanges")}
                    </Button>
                </div>
            </div>

            {currentBusiness ? (
                <div className="grid gap-6 xl:grid-cols-3">
                    <div className="space-y-6">
                        <LogoUploadCard />
                    </div>

                    <div className="space-y-6 xl:col-span-2">
                        <BasicInformationCard />
                        <OwnerInformationCard />
                        <PolicySettingsCard />
                        <WorkingHoursCard />
                    </div>
                </div>
            ) : (
                <NoBusinessCard />
            )}
        </form>
    );
}

export default function EditDetailsPage() {
    return (
        <EditDetailsFormProvider>
            <EditDetailsForm />
        </EditDetailsFormProvider>
    );
}
