import { Audit, Business, CalendarEvent, MessageTemplate, NotificationLog, Review, Service, StaffMember, StringObject, User, WaitItem } from "../types";

interface SetOptions {
    merge?: boolean;
    replacePrevValues?: boolean;
}

export class CacheManager {
    private static instance: CacheManager;
    private data: CacheStore;

    private constructor() {
        this.data = {} as CacheStore;
    }
    /// singleton instance
    public static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance as CacheManager;
    }

    /// set
    public set<K extends keyof CacheStore>(key: K, value: any | any[], options?: SetOptions): void;
    public set<K extends string>(key: K extends keyof CacheStore ? never : K, value: any, options?: SetOptions): void;
    public set(key: string, value: any, options?: SetOptions): void {
        if (options?.merge) {
            const existingValue = (this.data as any)[key];
            (this.data as any)[key] = this.mergeValues(existingValue, value, options?.replacePrevValues);
        } else {
            (this.data as any)[key] = value;
        }
    }

    /// get
    public get<K extends keyof CacheStore>(key: K): CacheStore[K];
    public get<K extends string = string, V = any>(key: K extends keyof CacheStore ? never : K, default_value?: V): typeof default_value;
    public get<K extends keyof CacheStore>(key: K, default_value: CacheStore[K]): CacheStore[K];
    public get(key: string, default_value?: any): any {
        const val = (this.data as any)[key];
        return val === undefined ? default_value : val;
    }

    public delete<K extends keyof CacheStore>(key: K, id?: any): void {
        let currentData = this.data[key];
        if (!currentData) {
            return;
        }
        if (!id) {
            delete this.data[key];
            return;
        }
        if (currentData instanceof Map) {
            currentData.delete(id);
        } else if (Array.isArray(currentData)) {
            currentData = currentData.filter((item: any) => item.id !== id) as CacheStore[K];
        } else if (this.isPlainObject(currentData)) {
            delete currentData[id];
        }
        this.data[key] = currentData as CacheStore[K];
    }

    private mergeValues(existingValue: any, newValue: any, replacePrevValues?: boolean): any {
        if (existingValue === undefined || existingValue === null) {
            return newValue;
        }
        if (Array.isArray(existingValue) && Array.isArray(newValue)) {
            if (replacePrevValues) {
                const data = existingValue.map((item: any) => {
                    const newItem = newValue.find((newItem: any) => newItem.id === item.id);
                    return newItem || item;
                });
                const newData = newValue.filter((item) => !data.some((dataItem: any) => dataItem.id === item.id));
                return [...data, ...newData];
            }
            return [...existingValue, ...newValue];
        }
        if (existingValue instanceof Map && Array.isArray(newValue)) {
            if (replacePrevValues) {
                const updated = new Map(existingValue);
                newValue.forEach((item: any) => updated.set(item.id, item));
                return updated;
            }
            return new Map([...existingValue, ...newValue.map((item: any) => [item.id, item] as const)]);
        }
        if (existingValue instanceof Map && newValue instanceof Map) {
            if (replacePrevValues) {
                const updated = new Map(existingValue);
                for (const [id, val] of newValue) {
                    updated.set(id, val);
                }
                return updated;
            }
            return new Map([...existingValue, ...newValue]);
        }
        if (this.isPlainObject(existingValue) && this.isPlainObject(newValue)) {
            return { ...existingValue, ...newValue };
        }
        return newValue;
    }

    private isPlainObject(value: any): boolean {
        return Object.prototype.toString.call(value) === "[object Object]";
    }
}

export const cacheManager = CacheManager.getInstance();

export interface CacheStore {
    calendar: CalendarEvent[];
    calendarMap: Map<string, CalendarEvent>;
    businesses: Business[];
    businessesMap: Map<string, Business>;
    services: Service[];
    servicesMap: Map<string, Service>;
    users: User[];
    usersMap: Map<string, User>;
    waitlist: WaitItem[];
    waitlistMap: Map<string, WaitItem>;
    reviews: Review[];
    reviewsMap: Map<string, Review>;
    messageTemplates: MessageTemplate[];
    messageTemplatesMap: Map<string, MessageTemplate>;
    notificationLogs: NotificationLog[];
    notificationLogsMap: Map<string, NotificationLog>;
    audits: Audit[];
    auditsMap: Map<string, Audit>;
    staff: StaffMember[];
    staffMap: Map<string, StaffMember>;
}
