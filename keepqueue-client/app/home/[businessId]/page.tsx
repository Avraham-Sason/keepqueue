import React from "react";
import { Config } from "./components/client";
import { BookingInterface } from "@/components/BookingInterface";

interface BusinessHomePageProps {
    params: Promise<{
        businessId: string;
    }>;
}
export default async function BusinessHomePage({ params }: BusinessHomePageProps) {
    const { businessId } = await params;
    return (
        <div>
            <Config businessId={businessId} />
            <BookingInterface businessId={businessId} />
        </div>
    );
}
