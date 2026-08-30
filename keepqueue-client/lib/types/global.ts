import type { Timestamp } from "firebase/firestore";

export type ID = string;

export type CalendarEventStatus = "BOOKED" | "CONFIRMED" | "CANCELLED" | "NO_SHOW" | "DONE";

export type CalendarEventType = "APPOINTMENT" | "VACATION" | "HOLIDAY" | "OTHER";

export type NotificationType = "sms" | "email";
export type NotificationStatus = "QUEUED" | "SENT" | "FAILED" | "DELIVERED";
export type UserType = "business" | "customer";
export type StaffRole = "owner" | "manager" | "employee";
export type CalendarEventSource = "web" | "admin" | "import";
export type TS = Timestamp;
export type Language = "he" | "en";

export interface DocBase {
    id?: ID;
    created: TS;
    timestamp: TS;
}

export interface UserBase extends DocBase {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    contacts: Record<NotificationType, boolean>;
    roles?: string[];
    notes?: string;
    photoURL?: string;
    lastLoginAt?: TS;
    lastEventAt?: TS;
}
// Collection: users
export interface BusinessOwner extends UserBase {
    ownedBusinessIds?: ID[];
    type: "business";
}

// Collection: users
export interface Customer extends UserBase {
    type: "customer";
    businessIds: ID[];
    blockedByBusinessIds?: ID[];
}
export type User = BusinessOwner | Customer;

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DailyTimeRange {
    startMin: number;
    endMin: number;
}

export interface OperationSchedule {
    day: Weekday;
    intervals: DailyTimeRange[];
}
export interface Business extends DocBase {
    name: string;
    ownerId: ID;
    phone?: string;
    address?: string;
    description?: string;
    geo?: { lat: number; lng: number };
    categories?: string[];
    ratingAvg?: number;
    ratingCount?: number;
    isActive: boolean;
    operationSchedule: OperationSchedule[];
    currency?: string;
    lang: Language;
    logoUrl?: string;
    policy?: Policy;
}

export interface Policy {
    cancellationWindowMin: number;
    lateThresholdMin: number;
    noShowAutoBlock: boolean;
    noShowLimit?: number;
}

// Collection: services
export interface Service extends DocBase {
    businessId: ID;
    name: string;
    durationMin: number;
    price: number;
    pricing?: Pricing;
    operationSchedule: OperationSchedule[];
    paddingBefore?: number;
    paddingAfter?: number;
    active: boolean;
    order?: number;
}
export interface Pricing {
    vatPercent?: number;
    coupons?: {
        code: string;
        discountType: "PERCENT" | "AMOUNT";
        amount: number;
        validFrom: TS;
        validTo: TS;
        active: boolean;
    }[];
}
// Collection: calendar
export interface CalendarEvent extends DocBase {
    businessId: ID;
    userId: ID;
    serviceId?: ID;
    type: CalendarEventType;
    status: CalendarEventStatus;
    title: string;
    start: TS;
    end: TS;
    source?: CalendarEventSource;
    notes?: string;
}

// Collection: waitlist
export interface WaitItem extends DocBase {
    businessId: ID;
    userId: ID;
    serviceId: ID;
    preferredWindow: { from: TS; to: TS };
    priority?: number;
    expiresAt: TS;
}

// Collection: reviews
export interface Review extends DocBase {
    businessId: ID;
    userId: ID;
    calendarEventId?: ID;
    rating: 1 | 2 | 3 | 4 | 5;
    text?: string;
    flagged: boolean;
}

// Collection: notification_logs
export interface NotificationLog extends DocBase {
    businessId: ID;
    type: NotificationType;
    to: string;
    messageTemplateId: ID;
    content: string;
    status: NotificationStatus;
    sentAt: TS;
    error?: string;
}

// Collection: message_templates
export interface MessageTemplate extends DocBase {
    businessId: ID;
    key: string;
    language: Language;
    content: string;
    name: string;
    description?: string;
}

// Collection: staff
export interface StaffMember extends DocBase {
    businessId: ID;
    firstName: string;
    lastName: string;
    role: StaffRole;
    isActive: boolean;
    operationSchedule: OperationSchedule[];
    serviceIds?: ID[];
    email?: string;
    phone?: string;
    photoURL?: string;
    color?: string;
    notes?: string;
}

// Collection: audits
export interface Audit extends DocBase {
    businessId: ID;
    userId: ID;
    entity: "services" | "businesses" | "calendar";
    action: "create" | "update" | "delete";
    subEntity: string;
}

export const firestoreCollections = [
    "users",
    "businesses",
    "services",
    "calendar",
    "waitlist",
    "reviews",
    "notification_logs",
    "message_templates",
    "audits",
    "staff",
] as const;
