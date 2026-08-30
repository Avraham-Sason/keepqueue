import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BusinessWithRelations } from "../types";
import { createSelectors, type SetState, setState } from "./utils";

interface BusinessesState {
    currentBusiness: BusinessWithRelations | null;
    setCurrentBusiness: SetState<BusinessWithRelations | null>;
}

export const useBusinessesStoreBase = create<BusinessesState>()(
    persist(
        (set) => ({
            currentBusiness: null,
            setCurrentBusiness: (updater) => setState(updater, set, "currentBusiness"),
        }),
        {
            name: "BusinessesStore",
            partialize: (state) => ({ currentBusiness: state.currentBusiness }),
        }
    )
);

export const useBusinessesStore = createSelectors<BusinessesState>(useBusinessesStoreBase);
