import { Business, CalendarEvent, Customer, MessageTemplate, Review, Service, StaffMember, TS, User, WaitItem } from "./global";

// `user` is optional on purpose. The public shape of /data/getBusiness omits it so a visitor
// never receives another customer's account, and a record whose user was deleted has none
// either — the previous non-optional declaration made both cases a lie the compiler enforced
// on consumers instead of on the producer.
interface ReviewWithUser extends Review {
    user?: User;
}

export interface CalendarEventWithRelations extends CalendarEvent {
    user?: User;
    service?: Service;
}

interface WaitItemWithRelations extends WaitItem {
    user?: User;
    service?: Service;
}

export interface BusinessWithRelations extends Business {
    services: Service[];
    calendar: CalendarEventWithRelations[];
    waitlist: WaitItemWithRelations[];
    messageTemplates: MessageTemplate[];
    reviews: ReviewWithUser[];
    availability: AvailabilitySlot[];
    customers: Customer[];
    staff: StaffMember[];
}

export interface AvailabilitySlot {
    start: TS;
    end: TS;
}
