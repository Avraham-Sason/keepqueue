import { jsonFailed, jsonOK } from "../helpers";
import { cacheManager, logger } from "../managers";
import { RouterService, Business, BusinessWithRelations, StringObject, CalendarEventWithRelations, Customer, CalendarEvent, Review, StaffMember, WaitItem, User, Service } from "../types";
import {
    GetAvailabilityByServiceIdModel, GetBusinessCustomersModel, GetBusinessModel,
    GetMyAppointmentsModel, GetUserByIdModel, GetBusinessStaffModel, GetBusinessWaitlistModel,
    GetBusinessReviewsModel, GetBusinessRatingsModel, GetBusinessAppointmentsModel,
    GetBusinessAnalyticsModel, SearchBusinessesModel,
} from "./schemes";
import {
    computeBusinessAvailability,
    eligibleStaffForService,
    mergeSlots,
    scheduleForStaff,
} from "../actions/businesses/appointments/helpers";
import { AuthenticatedRequest } from "../middlewares/authGuard";

/**
 * A review is public, the reviewer's account is not. Everything a stranger may see about the
 * person who wrote it is their first name; email, phone and business links stay behind.
 */
const publicReviewer = (user: User | undefined) =>
    user ? ({ id: user.id, firstName: user.firstName, photoURL: user.photoURL } as User) : undefined;

/**
 * The appointments of whoever is asking. Replaces a general "query any collection" endpoint
 * that took the filter from the request body: the scope here comes from the verified token and
 * cannot be widened by the caller. Business and service names are resolved server-side because
 * a customer has no way to read either collection.
 */
export const S_getMyAppointments: RouterService = async (req, res, next) => {
    try {
        const uid = (req as AuthenticatedRequest).user?.uid;
        if (!uid) {
            res.status(401).json(jsonFailed("Authentication required"));
            return;
        }
        const { businessId } = req.body as GetMyAppointmentsModel;

        const calendar = cacheManager.get("calendar", []) as CalendarEvent[];
        const businessesMap = cacheManager.get("businessesMap", new Map());
        const servicesMap = cacheManager.get("servicesMap", new Map());

        const mine = calendar
            .filter((e) => e.userId === uid && (!businessId || e.businessId === businessId))
            .map((e) => ({
                ...e,
                businessName: businessesMap.get(e.businessId)?.name ?? null,
                serviceName: e.serviceId ? servicesMap.get(e.serviceId)?.name ?? null : null,
            }));

        res.json(jsonOK(mine));
    } catch (error) {
        next(error);
    }
};

export const S_getBusiness: RouterService = async (req, res, next) => {
    const { businessId, ownerId } = req.body as GetBusinessModel;
    if (!businessId && !ownerId) {
        res.status(400).json(jsonFailed("Business ID or owner ID is required"));
        return;
    }

    const [users, usersMap, businesses, businessesMap, services, servicesMap, calendar, waitlist, messageTemplates, reviews, staff] = [
        cacheManager.get("users", []),
        cacheManager.get("usersMap", new Map()),
        cacheManager.get("businesses", []),
        cacheManager.get("businessesMap", new Map()),
        cacheManager.get("services", []),
        cacheManager.get("servicesMap", new Map()),
        cacheManager.get("calendar", []),
        cacheManager.get("waitlist", []),
        cacheManager.get("messageTemplates", []),
        cacheManager.get("reviews", []),
        cacheManager.get("staff", []) as StaffMember[],
    ];

    const getUserById = (id: string) => usersMap.get(id) || users.find((u) => u.id === id)!;
    const getServiceById = (id: string) => servicesMap.get(id) || services.find((s) => s.id === id)!;

    try {
        let business = null;
        if (businessId) {
            business = businessesMap.get(businessId) || businesses.find((b) => b.id === businessId);
        } else {
            business = businesses.find((b) => b.ownerId === ownerId);
        }
        if (!business) {
            res.json(jsonFailed("Business not found"));
            return;
        }

        const businessServices = services.filter((s) => s.businessId === business.id);

        const businessMessageTemplates = messageTemplates.filter((m) => m.businessId === business.id);

        const businessCalendar = calendar
            .filter((e) => e.businessId === business.id)
            .map((e) => {
                const data: CalendarEventWithRelations = {
                    ...e,
                    user: getUserById(e.userId),
                };
                if (e.serviceId) {
                    data.service = getServiceById(e.serviceId);
                }
                return data;
            });

        const businessWaitlist = waitlist
            .filter((w) => w.businessId === business.id)
            .map((w) => ({
                ...w,
                user: getUserById(w.userId),
                service: getServiceById(w.serviceId),
            }));

        const businessReviews = reviews
            .filter((r) => r.businessId === business.id)
            .map((r) => ({
                ...r,
                user: getUserById(r.userId),
            }));

        const businessCustomers = users.filter((c) => "businessIds" in c && c.businessIds.includes(business.id!)) as Customer[];

        const businessStaff = staff.filter((s) => s.businessId === business.id);

        const availability = computeBusinessAvailability(business, business.operationSchedule);

        // This route has to stay reachable by anonymous visitors — it is what the public booking
        // page runs on — so the caller is identified rather than rejected, and everything that
        // names another person is withheld unless the caller owns the business.
        const requester = (req as AuthenticatedRequest).user;
        const isOwner = !!requester && (business.ownerId === requester.uid || requester.isAdmin === true);

        if (isOwner) {
            const result: BusinessWithRelations = {
                ...business,
                services: businessServices,
                calendar: businessCalendar,
                waitlist: businessWaitlist,
                messageTemplates: businessMessageTemplates,
                reviews: businessReviews,
                availability,
                customers: businessCustomers,
                staff: businessStaff,
            };
            res.json(jsonOK(result));
            return;
        }

        // A business the operator switched off should not be bookable by the public.
        if (business.isActive === false) {
            res.status(404).json(jsonFailed("Business not found"));
            return;
        }

        // ownerId identifies a person and a visitor has no use for it.
        const { ownerId: _ownerId, ...publicBusiness } = business;

        const publicResult: BusinessWithRelations = {
            ...publicBusiness,
            ownerId: "",
            services: businessServices.filter((s) => s.active !== false),
            // Only the caller's own appointments, and without the joined user record. Slot
            // blocking comes from `availability`, which the server computed over every event.
            calendar: requester ? businessCalendar.filter((e) => e.userId === requester.uid).map(({ user, ...rest }) => rest) : [],
            reviews: businessReviews.filter((r) => !r.flagged).map(({ user, ...rest }) => ({ ...rest, user: publicReviewer(user) })),
            availability,
            waitlist: [],
            messageTemplates: [],
            customers: [],
            // Enough to let a customer choose who they book with, and nothing that belongs to
            // the employment relationship — no email, phone or notes.
            staff: businessStaff
                .filter((member) => member.isActive !== false)
                .map((member) => ({
                    id: member.id,
                    businessId: member.businessId,
                    firstName: member.firstName,
                    lastName: member.lastName,
                    role: member.role,
                    isActive: member.isActive,
                    operationSchedule: [],
                    serviceIds: member.serviceIds ?? [],
                    photoURL: member.photoURL,
                    color: member.color,
                    created: member.created,
                    timestamp: member.timestamp,
                })),
        };

        res.json(jsonOK(publicResult));
    } catch (error) {
        next(error);
    }
};

export const S_getAvailabilityByServiceId: RouterService = async (req, res, next) => {
    const { serviceId, staffId } = req.body as GetAvailabilityByServiceIdModel;
    try {
        const servicesMap = cacheManager.get("servicesMap", new Map());
        const businessesMap = cacheManager.get("businessesMap", new Map());
        const service = servicesMap.get(serviceId);
        if (!service) {
            const mgs = `Service not found for service ${serviceId}`;
            logger.error(mgs);
            res.json(jsonFailed(mgs));
            return;
        }
        const business = businessesMap.get(service.businessId);
        if (!business) {
            const mgs = `Business not found for service ${serviceId}`;
            logger.error(mgs);
            res.json(jsonFailed(mgs));
            return;
        }

        // Use service operation schedule if available, otherwise use business schedule
        const operationSchedule =
            service.operationSchedule && service.operationSchedule.length > 0 ? service.operationSchedule : business.operationSchedule;

        // With staff on the books the business is several parallel resources: a slot should be
        // offered while anyone who can perform the service is free, not only while everyone is.
        // Asking for a particular person narrows it to their own calendar.
        const staff = eligibleStaffForService(business.id!, serviceId);
        const pool = staffId ? staff.filter((member) => member.id === staffId) : staff;
        const availability = pool.length
            ? mergeSlots(pool.flatMap((member) => computeBusinessAvailability(business, scheduleForStaff(business, member), undefined, undefined, member.id)))
            : computeBusinessAvailability(business, operationSchedule);

        // Filter availability slots to only include those that can accommodate the service duration
        const serviceDurationMin = service.durationMin || 30;
        const paddingBefore = service.paddingBefore || 0;
        const paddingAfter = service.paddingAfter || 0;
        const totalDurationMin = serviceDurationMin + paddingBefore + paddingAfter;
        const totalDurationMs = totalDurationMin * 60 * 1000;

        const filteredAvailability = availability.filter((slot) => {
            const slotDurationMs = slot.end.toMillis() - slot.start.toMillis();
            return slotDurationMs >= totalDurationMs;
        });

        res.json(jsonOK(filteredAvailability));
    } catch (error) {
        next(error);
    }
};

export const S_getBusinessCustomers: RouterService = async (req, res, next) => {
    const { businessId } = req.body as GetBusinessCustomersModel;
    try {
        const allUsers = cacheManager.get("users", []);
        const customers = allUsers.filter((u) => "businessIds" in u && (u as Customer).businessIds.includes(businessId)) as Customer[];
        res.json(jsonOK(customers));
    } catch (error) {
        next(error);
    }
};

/**
 * Self, or one of the caller's own customers. Previously any signed-in account could fetch any
 * user record by id, which made the authGuard on /data/getBusinessCustomers pointless — the
 * same data was one request away. The projection drops everything a business does not need to
 * see about a person: their other business links, notification preferences and audit stamps.
 */
export const S_getUserById: RouterService = async (req, res, next) => {
    const { userId } = req.body as GetUserByIdModel;
    try {
        const requester = (req as AuthenticatedRequest).user;
        if (!requester) {
            res.status(401).json(jsonFailed("Authentication required"));
            return;
        }

        const allUsers = cacheManager.get("usersMap", new Map());
        const user = allUsers.get(userId) as User | undefined;
        if (!user) {
            res.status(404).json(jsonFailed("User not found"));
            return;
        }

        if (userId === requester.uid || requester.isAdmin) {
            res.json(jsonOK(user));
            return;
        }

        const businesses = cacheManager.get("businesses", []) as any[];
        const callerBusinessIds = businesses.filter((b) => b.ownerId === requester.uid).map((b) => b.id);
        const isMyCustomer = "businessIds" in user && (user.businessIds ?? []).some((id) => callerBusinessIds.includes(id));

        if (!isMyCustomer) {
            res.status(403).json(jsonFailed("You do not have access to this user"));
            return;
        }

        res.json(
            jsonOK({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                photoURL: user.photoURL,
                isActive: user.isActive,
                notes: user.notes,
                blockedByBusinessIds: "blockedByBusinessIds" in user ? user.blockedByBusinessIds ?? [] : [],
            })
        );
    } catch (error) {
        next(error);
    }
};

export const S_getBusinessStaff: RouterService = async (req, res, next) => {
    try {
        const { businessId } = req.body as GetBusinessStaffModel;
        const allStaff = cacheManager.get("staff", []) as StaffMember[];
        const staff = allStaff.filter((s) => s.businessId === businessId);
        res.json(jsonOK(staff));
    } catch (error) {
        next(error);
    }
};

export const S_getBusinessWaitlist: RouterService = async (req, res, next) => {
    try {
        const { businessId } = req.body as GetBusinessWaitlistModel;
        const allWaitlist = cacheManager.get("waitlist", []) as WaitItem[];
        const usersMap = cacheManager.get("usersMap", new Map());
        const servicesMap = cacheManager.get("servicesMap", new Map());

        const items = allWaitlist
            .filter((w) => w.businessId === businessId)
            .map((w) => ({
                ...w,
                user: usersMap.get(w.userId),
                service: servicesMap.get(w.serviceId),
            }));

        res.json(jsonOK(items));
    } catch (error) {
        next(error);
    }
};

export const S_getBusinessReviews: RouterService = async (req, res, next) => {
    try {
        const { businessId } = req.body as GetBusinessReviewsModel;
        const allReviews = cacheManager.get("reviews", []) as Review[];
        const usersMap = cacheManager.get("usersMap", new Map());

        // Unauthenticated route: hidden reviews stay hidden, and the reviewer is reduced to a
        // display name. Returning the joined user record here leaked every reviewer's contact
        // details to anyone who knew a business id.
        const reviews = allReviews
            .filter((r) => r.businessId === businessId && !r.flagged)
            .map((r) => ({
                ...r,
                user: publicReviewer(usersMap.get(r.userId)),
            }));

        res.json(jsonOK(reviews));
    } catch (error) {
        next(error);
    }
};

export const S_getBusinessRatings: RouterService = async (req, res, next) => {
    try {
        const { businessId } = req.body as GetBusinessRatingsModel;
        const allReviews = cacheManager.get("reviews", []) as Review[];
        const businessReviews = allReviews.filter((r) => r.businessId === businessId && !r.flagged);

        if (businessReviews.length === 0) {
            res.json(jsonOK({ average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }));
            return;
        }

        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let sum = 0;
        for (const review of businessReviews) {
            distribution[review.rating] = (distribution[review.rating] || 0) + 1;
            sum += review.rating;
        }

        res.json(jsonOK({
            average: Math.round((sum / businessReviews.length) * 100) / 100,
            count: businessReviews.length,
            distribution,
        }));
    } catch (error) {
        next(error);
    }
};

export const S_getBusinessAppointments: RouterService = async (req, res, next) => {
    try {
        const { businessId, fromDate, toDate, status, serviceId } = req.body as GetBusinessAppointmentsModel;
        const allCalendar = cacheManager.get("calendar", []) as CalendarEvent[];
        const usersMap = cacheManager.get("usersMap", new Map());
        const servicesMap = cacheManager.get("servicesMap", new Map());

        let filtered = allCalendar.filter((e) => e.businessId === businessId);

        if (fromDate) {
            filtered = filtered.filter((e) => e.start.toMillis() >= fromDate);
        }
        if (toDate) {
            filtered = filtered.filter((e) => e.end.toMillis() <= toDate);
        }
        if (status) {
            filtered = filtered.filter((e) => e.status === status);
        }
        if (serviceId) {
            filtered = filtered.filter((e) => e.serviceId === serviceId);
        }

        const result = filtered.map((e) => ({
            ...e,
            user: usersMap.get(e.userId),
            service: e.serviceId ? servicesMap.get(e.serviceId) : undefined,
        }));

        res.json(jsonOK(result));
    } catch (error) {
        next(error);
    }
};

export const S_getBusinessAnalytics: RouterService = async (req, res, next) => {
    try {
        const { businessId, periodDays = 30 } = req.body as GetBusinessAnalyticsModel;
        const allCalendar = cacheManager.get("calendar", []) as CalendarEvent[];
        const servicesMap = cacheManager.get("servicesMap", new Map());

        const now = Date.now();
        const periodStart = now - periodDays * 24 * 60 * 60 * 1000;

        const businessEvents = allCalendar.filter((e) => {
            if (e.businessId !== businessId || e.type !== "APPOINTMENT") return false;
            const startedAt = e.start.toMillis();
            return startedAt >= periodStart && startedAt <= now;
        });

        // Nothing transitions a past appointment automatically, and businesses do not reliably
        // mark every one by hand, so counting raw statuses reported almost no completions and a
        // no-show rate near zero. An appointment whose time has passed and which was never
        // cancelled or marked missed is treated as completed for reporting; the stored status is
        // left alone. This is a reporting convention, not a write.
        const effectiveStatus = (e: CalendarEvent): CalendarEvent["status"] =>
            (e.status === "BOOKED" || e.status === "CONFIRMED") && e.end.toMillis() < now ? "DONE" : e.status;

        const totalBookings = businessEvents.length;
        const noShows = businessEvents.filter((e) => e.status === "NO_SHOW").length;
        const cancellations = businessEvents.filter((e) => e.status === "CANCELLED").length;
        const completed = businessEvents.filter((e) => effectiveStatus(e) === "DONE").length;

        const noShowRate = totalBookings > 0 ? Math.round((noShows / totalBookings) * 100) : 0;
        const cancellationRate = totalBookings > 0 ? Math.round((cancellations / totalBookings) * 100) : 0;

        // Revenue by service
        const revenueByService: Record<string, { serviceName: string; bookings: number; revenue: number }> = {};
        for (const event of businessEvents) {
            // Revenue is money actually earned. Counting every non-cancelled appointment meant
            // no-shows and appointments that never happened were reported as income.
            if (event.serviceId && effectiveStatus(event) === "DONE") {
                const service = servicesMap.get(event.serviceId);
                if (service) {
                    if (!revenueByService[event.serviceId]) {
                        revenueByService[event.serviceId] = { serviceName: service.name, bookings: 0, revenue: 0 };
                    }
                    revenueByService[event.serviceId].bookings += 1;
                    revenueByService[event.serviceId].revenue += service.price || 0;
                }
            }
        }

        const totalRevenue = Object.values(revenueByService).reduce((sum, s) => sum + s.revenue, 0);

        const topServices = Object.entries(revenueByService)
            .map(([serviceId, data]) => ({ serviceId, ...data }))
            .sort((a, b) => b.bookings - a.bookings);

        res.json(jsonOK({
            periodDays,
            totalBookings,
            completed,
            noShows,
            cancellations,
            noShowRate,
            cancellationRate,
            totalRevenue,
            topServices,
        }));
    } catch (error) {
        next(error);
    }
};

/**
 * The public directory behind /marketplace.
 *
 * Unauthenticated by design — it is the customer-acquisition surface — so it returns only what
 * a listing card shows. Deactivated businesses and those with nothing bookable are left out:
 * a directory entry that cannot be booked wastes the visitor's click.
 */
export const S_searchBusinesses: RouterService = async (req, res, next) => {
    try {
        const { query, category, limit = 30 } = req.body as SearchBusinessesModel;
        const businesses = cacheManager.get("businesses", []) as Business[];
        const services = cacheManager.get("services", []) as Service[];

        const needle = query?.trim().toLowerCase();
        const wantedCategory = category?.trim().toLowerCase();

        const rows = businesses
            .filter((business) => business.isActive !== false)
            .map((business) => {
                const active = services.filter((s) => s.businessId === business.id && s.active !== false);
                return { business, active };
            })
            .filter(({ active }) => active.length > 0)
            .filter(({ business, active }) => {
                if (wantedCategory && !(business.categories ?? []).some((c: string) => c.toLowerCase() === wantedCategory)) return false;
                if (!needle) return true;
                const haystack = [business.name, business.address ?? "", business.description ?? "", ...(business.categories ?? []), ...active.map((s) => s.name)]
                    .join(" ")
                    .toLowerCase();
                return haystack.includes(needle);
            })
            .map(({ business, active }) => ({
                id: business.id,
                name: business.name,
                address: business.address ?? "",
                description: business.description ?? "",
                categories: business.categories ?? [],
                logoUrl: business.logoUrl ?? null,
                ratingAvg: business.ratingAvg ?? 0,
                ratingCount: business.ratingCount ?? 0,
                currency: business.currency ?? "ILS",
                serviceCount: active.length,
                priceFrom: active.reduce((min, s) => (s.price < min ? s.price : min), active[0].price),
            }))
            .sort((a, b) => b.ratingCount - a.ratingCount || a.name.localeCompare(b.name));

        const categories = [...new Set(businesses.filter((b) => b.isActive !== false).flatMap((b) => b.categories ?? []))].sort();

        res.json(jsonOK({ businesses: rows.slice(0, limit), total: rows.length, categories }));
    } catch (error) {
        next(error);
    }
};
