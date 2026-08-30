export type SetState<T = any> = (updater: ((prev: T) => T) | T) => void;

export const setState = <T>(updater: T | ((state: T) => T), set: (fn: (state: any) => any) => void, stateName: string) => {
    return set((state: any) => ({
        [stateName]: typeof updater === "function" ? (updater as (state: T) => T)(state[stateName]) : updater,
    }));
};

export const createSelectors = <T extends object>(store: any) => {
    const selectors: { [K in keyof T]: () => T[K] } = {} as any;
    for (const k of Object.keys(store.getState()) as Array<keyof T>) {
        selectors[k] = () => store((s: T) => s[k]);
    }
    return selectors;
};
