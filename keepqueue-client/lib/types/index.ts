export * from "./global";
export * from "./business";

export type StringObject<T = any> = {
    [key: string]: T;
};
