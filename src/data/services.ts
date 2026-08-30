import { jsonFailed, jsonOK } from "../helpers";
import { cacheManager, logger } from "../managers";
import { RouterService, BusinessWithRelations, StringObject, CalendarEventWithRelations, Customer, CalendarEvent, Review, StaffMember, WaitItem, User, Service } from "../types";
import { checkCondition } from "./helpers";
import {
    GetAvailabilityByServiceIdModel, GetBusinessCustomersModel, GetBusinessModel,
    GetCollectionModel, GetUserByIdModel, GetBusinessStaffModel, GetBusinessWaitlistModel,
    GetBusinessReviewsModel, GetBusinessRatingsModel, GetBusinessAppointmentsModel,
    GetBusinessAnalyticsModel,
} from "./schemes";
import { computeBusinessAvailability } from "../actions/businesses/appointments/helpers";

export const S_getCollection: RouterService = async (req, res, next) => {
    try {
        const { collectionName, conditions, conditionsType = "and" } = req.body as GetCollectionModel;
        let data = cacheManager.get(collectionName, []) as any[];
        if (conditions && conditions.length > 0) {
            data = data.filter((item) => {
                if (conditionsType === "and") {
                    return conditions.every((condition) => checkCondition(item, condition));
                } else {
                    return conditions.some((condition) => checkCondition(item, condition));
                }
            });
        }
        res.json(jsonOK(data));
    } catch (error) {
        next(error);
    }
};

export const S_getBusiness: RouterService = async (req, res, next) => {
    const { businessId, ownerId } = req.body as GetBusinessModel;
    if (!businessId && !ownerId) {
        res.json(jsonFailed("Business ID or owner ID is required"));
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

        const result: BusinessWithRelations = {
            ...business,
            services: businessServices,
            calendar: businessCalendar,
            waitlist: businessWaitlist,
            messageTemplates: businessMessageTemplates,
            reviews: businessReviews,
            availability: computeBusinessAvailability(business, business.operationSchedule),
            customers: businessCustomers,
            staff: businessStaff,
        };

        res.json(jsonOK(result));
    } catch (error) {
        next(error);
    }
};

export const S_getAvailabilityByServiceId: RouterService = async (req, res, next) => {
    const { serviceId } = req.body as GetAvailabilityByServiceIdModel;
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

        const availability = computeBusinessAvailability(business, operationSchedule);

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

export const S_getUserById: RouterService = async (req, res, next) => {
    const { userId } = req.body as GetUserByIdModel;
    try {
        const allUsers = cacheManager.get("usersMap", new Map());
        const user = allUsers.get(userId);
        if (!user) {
            const mgs = `User not found for user ${userId}`;
            logger.error(mgs);
            res.json(jsonFailed(mgs));
            return;
        }
        return res.json(jsonOK(user));
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

        const reviews = allReviews
            .filter((r) => r.businessId === businessId)
            .map((r) => ({
                ...r,
                user: usersMap.get(r.userId),
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

        const businessEvents = allCalendar.filter(
            (e) => e.businessId === businessId && e.type === "APPOINTMENT" && e.created.toMillis() >= periodStart
        );

        const totalBookings = businessEvents.length;
        const noShows = businessEvents.filter((e) => e.status === "NO_SHOW").length;
        const cancellations = businessEvents.filter((e) => e.status === "CANCELLED").length;
        const completed = businessEvents.filter((e) => e.status === "DONE").length;

        const noShowRate = totalBookings > 0 ? Math.round((noShows / totalBookings) * 100) : 0;
        const cancellationRate = totalBookings > 0 ? Math.round((cancellations / totalBookings) * 100) : 0;

        // Revenue by service
        const revenueByService: Record<string, { serviceName: string; bookings: number; revenue: number }> = {};
        for (const event of businessEvents) {
            if (event.serviceId && event.status !== "CANCELLED") {
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
