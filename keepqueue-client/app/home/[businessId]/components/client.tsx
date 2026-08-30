"use client";
import { useBusiness } from "@/app/business/hooks";
import { useBusinessesStore } from "@/lib/store";
import { useEffect } from "react";

export function Config({ businessId }: { businessId: string }) {
    useBusiness(businessId);
    const currentBusiness = useBusinessesStore.currentBusiness();
    useEffect(() => {
        console.log("currentBusiness", currentBusiness);
    }, [currentBusiness]);
    return null;
}

