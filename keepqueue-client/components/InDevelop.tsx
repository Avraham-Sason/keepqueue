"use client";
import { usePathname } from "next/navigation";
import React from "react";

export const InDevelop = () => {
    const pathName = usePathname();
    const tab = pathName.split("/")[2];
    return <div className="size-full flex items-center justify-center text-2xl font-bold">{tab.charAt(0).toUpperCase() + tab.slice(1)} - InDevelop</div>;
};
