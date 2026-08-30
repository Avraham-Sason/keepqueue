"use client";
import { useEffect } from "react";
import moment from "moment-timezone";
import { useSettingsStore } from "@/lib/store";

function GlobalConfig() {
    const setUserTimeZone = useSettingsStore.setUserTimeZone();
    useEffect(() => {
        const userTimeZone = moment.tz.guess();
        setUserTimeZone(userTimeZone);
    }, []);
    return null;
}

export default GlobalConfig;
