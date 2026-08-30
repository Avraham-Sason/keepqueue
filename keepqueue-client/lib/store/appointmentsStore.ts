import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSelectors } from "./utils";
import type { CalendarEventStatus } from "../types";

interface AppointmentsState {
    statusFilter: CalendarEventStatus | "ALL";
    serviceFilter: string;
    searchQuery: string;
    setStatusFilter: (filter: CalendarEventStatus | "ALL") => void;
    setServiceFilter: (filter: string) => void;
    setSearchQuery: (query: string) => void;
    resetFilters: () => void;
}

export const useAppointmentsStoreBase = create<AppointmentsState>()(
    persist(
        (set) => ({
            statusFilter: "ALL",
            serviceFilter: "ALL",
            searchQuery: "",
            setStatusFilter: (filter) => set({ statusFilter: filter }),
            setServiceFilter: (filter) => set({ serviceFilter: filter }),
            setSearchQuery: (query) => set({ searchQuery: query }),
            resetFilters: () => set({ statusFilter: "ALL", serviceFilter: "ALL", searchQuery: "" }),
        }),
        {
            name: "AppointmentsStore",
            partialize: (state) => ({ statusFilter: state.statusFilter, serviceFilter: state.serviceFilter }),
        }
    )
);

export const useAppointmentsStore = createSelectors<AppointmentsState>(useAppointmentsStoreBase);
