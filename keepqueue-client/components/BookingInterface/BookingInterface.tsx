"use client";

import { useEffect, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, Star, Phone, User, CheckCircle, ArrowRight, ArrowLeft, Loader2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/hooks";
import moment from "moment-timezone";
import { useBookingState, type BusinessDisplay } from "./hooks";
import type { CalendarEvent, Service } from "@/lib/types";
import Image from "next/image";
import { CustomerHeader } from "@/app/customer/dashboard/customer-header";
import { useAuthStore, useSettingsStore } from "@/lib/store";
import { SignInForm } from "@/components/signin-form";
import { timestampToMillis, timestampToString } from "@/lib/helpers";

interface BookingInterfaceProps {
    businessId: string;
}

interface GoogleCalendarPayload {
    title: string;
    details?: string;
    location?: string;
    startMs: number;
    endMs: number;
}

const buildGoogleCalendarUrl = ({ title, details, location, startMs, endMs }: GoogleCalendarPayload) => {
    const startUtc = moment.utc(startMs).format("YYYYMMDDTHHmmss[Z]");
    const endUtc = moment.utc(endMs).format("YYYYMMDDTHHmmss[Z]");
    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: title,
        dates: `${startUtc}/${endUtc}`,
    });

    if (details) {
        params.set("details", details);
    }

    if (location) {
        params.set("location", location);
    }

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export function BookingInterface({ businessId }: BookingInterfaceProps) {
    const {
        business,
        services,
        selectedService,
        setSelectedService,
        selectedServiceData,
        availableDates,
        availableTimes,
        totalPrice,
        selectedDate,
        setSelectedDate,
        selectedTime,
        setSelectedTime,
        step,
        handleNext,
        handleBack,
        handleBooking,
        isBooking,
        bookingError,
        cancelError,
        customerInfo,
        setCustomerInfo,
        customerAppointments,
        isLoadingAvailability,
        isCancellingAppointment,
        cancellingAppointmentId,
        handleCancelAppointment,
    } = useBookingState(businessId);

    return (
        <div className="size-full p-4">
            <div className="max-w-4xl mx-auto space-y-6">
                <CustomerHeader />

                <BusinessHeader business={business} />

                {customerAppointments.length > 0 && (
                    <ExistingAppointments
                        appointments={customerAppointments}
                        services={services}
                        business={business}
                        cancelError={cancelError}
                        isCancellingAppointment={isCancellingAppointment}
                        cancellingAppointmentId={cancellingAppointmentId}
                        onCancel={handleCancelAppointment}
                    />
                )}

                <ProgressSteps step={step} />

                {step === 1 && (
                    <ServicesStep services={services} selectedService={selectedService} setSelectedService={setSelectedService} onNext={handleNext} />
                )}

                {step === 2 && (
                    <DateTimeStep
                        availableDates={availableDates}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        availableTimes={availableTimes}
                        selectedTime={selectedTime}
                        setSelectedTime={setSelectedTime}
                        isLoadingAvailability={isLoadingAvailability}
                        onBack={handleBack}
                        onNext={handleNext}
                    />
                )}

                {step === 3 && (
                    <CustomerDetailsStep
                        customerInfo={customerInfo}
                        setCustomerInfo={setCustomerInfo}
                        business={business}
                        selectedServiceName={selectedServiceData?.name}
                        selectedServiceDurationMin={selectedServiceData?.durationMin}
                        availableDates={availableDates}
                        selectedDate={selectedDate}
                        selectedTime={selectedTime}
                        totalPrice={totalPrice}
                        isBooking={isBooking}
                        bookingError={bookingError}
                        onBack={handleBack}
                        onConfirm={handleBooking}
                    />
                )}

                {step === 4 && (
                    <ConfirmationStep
                        businessName={business.name}
                        businessAddress={business.address}
                        businessPhone={business.phone}
                        selectedServiceName={selectedServiceData?.name}
                        selectedServiceDurationMin={selectedServiceData?.durationMin}
                        availableDates={availableDates}
                        selectedDate={selectedDate}
                        selectedTime={selectedTime}
                    />
                )}
            </div>
        </div>
    );
}

// BusinessDisplay type is imported from hooks

function BusinessHeader({ business }: { business: BusinessDisplay }) {
    const { t } = useLanguage();
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Card className="">
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="space-y-3 ">
                            <div>
                                <h1 className="text-2xl font-bold">{business.name}</h1>
                                <p className="text-muted-foreground">{business.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">{business.rating}</span>
                                </div>
                                <span className="text-muted-foreground">
                                    ({business.reviews} {t("reviews")})
                                </span>
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    {t("openNow")}
                                </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{business.address}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{business.phone}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{business.workingHours}</span>
                                </div>
                            </div>
                        </div>
                        {business.image && (
                            <div className="w-full md:w-auto md:flex-shrink-0 md:min-w-[280px] md:max-w-[350px]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={business.image} 
                                    alt={business.name} 
                                    className="w-full h-40 md:h-[250px] object-cover rounded-lg" 
                                />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function ProgressSteps({ step }: { step: number }) {
    const { t } = useLanguage();
    const steps = [
        { number: 1, title: t("selectService") },
        { number: 2, title: t("selectDateTime") },
        { number: 3, title: t("personalDetails") },
        { number: 4, title: t("confirm") },
    ];
    return (
        <div className="flex items-center justify-center w-full overflow-x-auto px-2 mb-4 space-x-2 sm:space-x-4">
            {steps.map((stepInfo, index) => (
                <div key={stepInfo.number} className="flex items-center shrink-0">
                    <div className="flex flex-col items-center">
                        <div
                            className={`xl:w-10 xl:h-10 lg:w-8 lg:h-8 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                                step >= stepInfo.number ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}
                        >
                            {step > stepInfo.number ? <CheckCircle className="h-5 w-5" /> : stepInfo.number}
                        </div>
                        <span className="hidden sm:block text-xs mt-1 text-center">{stepInfo.title}</span>
                    </div>
                    {index < 3 && (
                        <div className={`w-6 sm:w-12 md:w-16 lg:w-24 h-0.5 mx-1 sm:mx-2 ${step > stepInfo.number ? "bg-primary" : "bg-muted"}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

interface ExistingAppointmentsProps {
    appointments: Array<CalendarEvent & { id: string }>;
    services: Service[];
    business: BusinessDisplay;
    cancelError: string | null;
    isCancellingAppointment: boolean;
    cancellingAppointmentId: string | null;
    onCancel: (calendarEventId: string) => void;
}

function ExistingAppointments({
    appointments,
    services,
    business,
    cancelError,
    isCancellingAppointment,
    cancellingAppointmentId,
    onCancel,
}: ExistingAppointmentsProps) {
    const { t } = useLanguage();
    const userTimeZone = useSettingsStore.userTimeZone();
    const serviceNameById = useMemo(() => {
        const map = new Map<string, string>();
        for (const service of services) {
            if (service.id) {
                map.set(service.id, service.name);
            }
        }
        return map;
    }, [services]);

    if (appointments.length === 0) {
        return null;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
                <CardHeader>
                    <CardTitle>{t("appointments")}</CardTitle>
                    <CardDescription>{t("yourUpcomingAppointments")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {appointments.map((appointment) => {
                        const serviceName =
                            (appointment.serviceId ? serviceNameById.get(appointment.serviceId) : "") ||
                            appointment.title ||
                            t("appointment");
                        const dateLabel = timestampToString(appointment.start, { format: "DD/MM/YY", tz: userTimeZone });
                        const timeLabel = timestampToString(appointment.start, { format: "HH:mm", tz: userTimeZone });
                        const isCancellingCurrent = isCancellingAppointment && cancellingAppointmentId === appointment.id;
                        const startMs = timestampToMillis(appointment.start);
                        const endMs = timestampToMillis(appointment.end);
                        const details = [
                            `${t("businessLabel")}: ${business.name}`,
                            `${t("serviceLabel")}: ${serviceName}`,
                            business.phone ? `${t("phone")}: ${business.phone}` : "",
                            appointment.notes ? appointment.notes : "",
                        ]
                            .filter(Boolean)
                            .join("\n");
                        const googleCalendarUrl = buildGoogleCalendarUrl({
                            title: `${business.name} - ${serviceName}`,
                            details,
                            location: business.address,
                            startMs,
                            endMs,
                        });

                        return (
                            <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border rounded-lg p-3">
                                <div className="space-y-1">
                                    <p className="font-medium">{serviceName}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>{dateLabel}</span>
                                        <Clock className="h-4 w-4" />
                                        <span>{timeLabel}</span>
                                    </div>
                                    {appointment.notes && <p className="text-xs text-muted-foreground italic">"{appointment.notes}"</p>}
                                </div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                    <Button asChild variant="secondary" size="sm">
                                        <a href={googleCalendarUrl} target="_blank" rel="noreferrer">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            {t("addToGoogleCalendar")}
                                        </a>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive border-destructive/50 hover:bg-destructive/10"
                                        disabled={isCancellingCurrent}
                                        onClick={() => onCancel(appointment.id)}
                                    >
                                        {isCancellingCurrent ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <XCircle className="h-4 w-4 mr-2" />
                                        )}
                                        {t("cancel")}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                    {cancelError && (
                        <div role="alert" aria-live="polite" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                            {cancelError}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

interface ServicesStepProps {
    services: Service[];
    selectedService: string | null;
    setSelectedService: (id: string | null) => void;
    onNext: () => void;
}

// ========================= Services Step 1 =========================
function ServicesStep({ services, selectedService, setSelectedService, onNext }: ServicesStepProps) {
    const { t } = useLanguage();
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <Card>
                <CardHeader>
                    <CardTitle>{t("selectService")}</CardTitle>
                    <CardDescription>{t("selectAService")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {services.map((service) => (
                        <div
                            key={service.id ?? service.name}
                            className={`relative p-3 sm:p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                                selectedService === service.id ? "border-primary bg-primary/5 shadow-md" : "hover:bg-muted/50"
                            }`}
                            onClick={() => setSelectedService(service.id ?? null)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <h3 className="font-medium text-base sm:text-lg">{service.name}</h3>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {service.durationMin} {t("minutes")}
                                        </span>
                                        <span className="font-medium text-base sm:text-lg">₪{service.price}</span>
                                    </div>
                                </div>
                                {selectedService === service.id && (
                                    <div className="flex-shrink-0">
                                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                            <CheckCircle className="h-4 w-4 text-primary-foreground" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <Button className="w-full" size="lg" disabled={!selectedService} onClick={onNext}>
                        {t("goToSelectDateTime")}
                        <ArrowLeft className="h-4 w-4 mr-2" />
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}

interface DateOption {
    date: string;
    day: string;
    available: boolean;
}
interface TimeOption {
    time: string;
    available: boolean;
}
interface DateTimeStepProps {
    availableDates: DateOption[];
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    availableTimes: TimeOption[];
    selectedTime: string;
    setSelectedTime: (time: string) => void;
    isLoadingAvailability: boolean;
    onBack: () => void;
    onNext: () => void;
}

// ========================= DateTime Step 2 =========================
function DateTimeStep({
    availableDates,
    selectedDate,
    setSelectedDate,
    availableTimes,
    selectedTime,
    setSelectedTime,
    isLoadingAvailability,
    onBack,
    onNext,
}: DateTimeStepProps) {
    const { t } = useLanguage();
    const onDateClick = (dateOption: DateOption) => {
        if (!dateOption.available) {
            return;
        }
        setSelectedDate(dateOption.date);
        setTimeout(() => {
            const scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
            window.scrollTo({ top: scrollHeight, behavior: "smooth" });
        }, 100);
    };
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <Card>
                <CardHeader>
                    <CardTitle>{t("selectDateTime")}</CardTitle>
                    <CardDescription>{/* Selected service summary handled in parent header if needed */}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 ">
                    <div className="space-y-3 ">
                        <Label className="text-base font-medium">{t("selectDate")}</Label>
                        {isLoadingAvailability ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-muted-foreground">{t("loadingAvailability") }</span>
                            </div>
                        ) : availableDates.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {t("noAvailableDates") }
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {availableDates.map((dateOption) => (
                                    <Button
                                        key={dateOption.date}
                                        variant={selectedDate === dateOption.date ? "default" : "outline"}
                                        className={`h-14 sm:h-16 flex flex-col ${!dateOption.available ? "opacity-50 cursor-not-allowed" : ""}`}
                                        disabled={!dateOption.available}
                                        onClick={() => onDateClick(dateOption)}
                                    >
                                        <span className="font-medium">{dateOption.day}</span>
                                        <span className="text-xs">{moment.utc(dateOption.date, "DD/MM/YY").format("DD/MM")}</span>
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedDate && (
                        <div className="space-y-3">
                            <Label className="text-base font-medium">{t("selectTime")}</Label>
                            {isLoadingAvailability ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    <span className="ml-2 text-muted-foreground">{t("loadingAvailability")}</span>
                                </div>
                            ) : availableTimes.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t("noAvailableTimes")}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {availableTimes.map((timeOption) => (
                                        <Button
                                            key={timeOption.time}
                                            variant={selectedTime === timeOption.time ? "default" : "outline"}
                                            size="sm"
                                            className={`${!timeOption.available ? "opacity-50 cursor-not-allowed" : ""} min-h-10 sm:min-h-0`}
                                            disabled={!timeOption.available}
                                            onClick={() => timeOption.available && setSelectedTime(timeOption.time)}
                                        >
                                            {timeOption.time}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button variant="outline" size="lg" onClick={onBack} className="bg-transparent w-full sm:w-auto">
                            <ArrowRight className="h-4 w-4 mr-2" />
                            {t("back")}
                        </Button>
                        <Button className="w-full sm:flex-1" size="lg" disabled={!selectedDate || !selectedTime} onClick={onNext}>
                            {t("goToPersonalDetails")}
                            <ArrowLeft className="h-4 w-4 mr-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

interface CustomerInfo {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    notes: string;
}

interface CustomerDetailsStepProps {
    customerInfo: CustomerInfo;
    setCustomerInfo: Dispatch<SetStateAction<CustomerInfo>>;
    business: BusinessDisplay;
    selectedServiceName?: string;
    selectedServiceDurationMin?: number;
    availableDates: DateOption[];
    selectedDate: string;
    selectedTime: string;
    totalPrice: number;
    onBack: () => void;
    isBooking: boolean;
    bookingError: string | null;
    onConfirm: () => Promise<void>;
}

// ========================= Customer Details Step 3 =========================
function CustomerDetailsStep({
    customerInfo,
    setCustomerInfo,
    business,
    selectedServiceName,
    selectedServiceDurationMin,
    availableDates,
    selectedDate,
    selectedTime,
    totalPrice,
    onBack,
    isBooking,
    bookingError,
    onConfirm,
}: CustomerDetailsStepProps) {
    const { t } = useLanguage();
    const user = useAuthStore.user();
    const isAuthenticated = Boolean(user);

    useEffect(() => {
        setCustomerInfo((prev) => {
            if (user) {
                return {
                    ...prev,
                    firstName: user.firstName ?? "",
                    lastName: user.lastName ?? "",
                    phone: user.phone ?? "",
                    email: user.email ?? "",
                };
            }

            if (!prev.firstName && !prev.lastName && !prev.phone && !prev.email) {
                return prev;
            }

            return {
                ...prev,
                firstName: "",
                lastName: "",
                phone: "",
                email: "",
            };
        });
    }, [user, setCustomerInfo]);
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <div className="grid gap-6 md:grid-cols-2">
                {isAuthenticated ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("personalDetails")}</CardTitle>
                            <CardDescription>{t("personalDetailsAutoFilled")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm text-muted-foreground">{t("firstName")} *</span>
                                    <p className="font-medium mt-1">{customerInfo.firstName}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">{t("lastName")} *</span>
                                    <p className="font-medium mt-1">{customerInfo.lastName}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">{t("phone")} *</span>
                                    <p className="font-medium mt-1">{customerInfo.phone}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">{t("emailAddress")} *</span>
                                    <p className="font-medium mt-1">{customerInfo.email}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label htmlFor="notes">{t("optionalNotes")}</Label>
                                <Textarea
                                    id="notes"
                                    placeholder={t("additionalNotesPlaceholder")}
                                    value={customerInfo.notes}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-4">
                        <SignInForm
                            type="customer"
                            disableRedirect
                            onSuccess={({ user: authenticatedUser }) =>
                                setCustomerInfo((prev) => ({
                                    ...prev,
                                    firstName: authenticatedUser.firstName ?? "",
                                    lastName: authenticatedUser.lastName ?? "",
                                    phone: authenticatedUser.phone ?? "",
                                    email: authenticatedUser.email ?? "",
                                }))
                            }
                        />
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>{t("bookingSummary")}</CardTitle>
                        <CardDescription>{t("yourAppointmentDetails")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("businessLabel")}:</span>
                                <span className="font-medium">{business.name}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("serviceLabel")}:</span>
                                <span className="font-medium">{selectedServiceName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("dateLabel")}:</span>
                                <span className="font-medium">
                                    {availableDates.find((d) => d.date === selectedDate)?.day} (
                                    {selectedDate ? moment.utc(selectedDate, "DD/MM/YY").format("DD/MM") : ""})
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("timeLabel")}:</span>
                                <span className="font-medium">{selectedTime}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("durationLabel")}:</span>
                                <span className="font-medium">
                                    {selectedServiceDurationMin} {t("minutes")}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-lg font-semibold">
                                <span>{t("totalLabel")}:</span>
                                <span>₪{totalPrice}</span>
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">{t("whatsNext")}</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>{t("whatsNextLine1")}</li>
                                <li>{t("whatsNextLine2")}</li>
                                <li>{t("whatsNextLine3")}</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {bookingError && (
                <div role="alert" aria-live="polite" className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {bookingError}
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-3">
                <Button variant="outline" size="lg" onClick={onBack} className="bg-transparent w-full sm:w-auto">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {t("back")}
                </Button>
                <Button
                    className="w-full sm:flex-1"
                    size="lg"
                    disabled={!isAuthenticated || !customerInfo.firstName || !customerInfo.lastName || !customerInfo.phone || !customerInfo.email || isBooking}
                    onClick={() => void onConfirm()}
                >
                    {isBooking ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t("bookingInProgress")}
                        </>
                    ) : (
                        <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {t("confirmBooking")}
                        </>
                    )}
                </Button>
            </div>
        </motion.div>
    );
}

interface ConfirmationStepProps {
    businessName: string;
    businessAddress: string;
    businessPhone: string;
    selectedServiceName?: string;
    selectedServiceDurationMin?: number;
    availableDates: DateOption[];
    selectedDate: string;
    selectedTime: string;
}

// ========================= Confirmation Step 4 =========================
function ConfirmationStep({
    businessName,
    businessAddress,
    businessPhone,
    selectedServiceName,
    selectedServiceDurationMin,
    availableDates,
    selectedDate,
    selectedTime,
}: ConfirmationStepProps) {
    const { t } = useLanguage();
    const userTimeZone = useSettingsStore.userTimeZone();
    const appointmentStart = moment.tz(`${selectedDate} ${selectedTime}`, "DD/MM/YY HH:mm", userTimeZone);
    const isValidAppointment = appointmentStart.isValid() && Boolean(selectedServiceDurationMin);
    const googleCalendarUrl = useMemo(() => {
        if (!isValidAppointment || !selectedServiceDurationMin) return "";
        const startMoment = moment.tz(`${selectedDate} ${selectedTime}`, "DD/MM/YY HH:mm", userTimeZone);
        if (!startMoment.isValid()) return "";
        const startMs = startMoment.utc().valueOf();
        const endMs = startMoment.clone().add(selectedServiceDurationMin, "minute").utc().valueOf();
        const details = [
            `${t("businessLabel")}: ${businessName}`,
            selectedServiceName ? `${t("serviceLabel")}: ${selectedServiceName}` : "",
            businessPhone ? `${t("phone")}: ${businessPhone}` : "",
        ]
            .filter(Boolean)
            .join("\n");
        return buildGoogleCalendarUrl({
            title: `${businessName} - ${selectedServiceName ?? t("appointment")}`,
            details,
            location: businessAddress,
            startMs,
            endMs,
        });
    }, [
        businessAddress,
        businessName,
        businessPhone,
        isValidAppointment,
        selectedDate,
        selectedServiceDurationMin,
        selectedServiceName,
        selectedTime,
        t,
        userTimeZone,
    ]);
    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <Card className="text-center">
                <CardContent className="pt-8 pb-8">
                    <div className="space-y-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-green-600 mb-2">{t("bookingSuccessTitle")}</h2>
                            <p className="text-muted-foreground">{t("bookingSuccessDescription")}</p>
                        </div>

                        <div className="bg-muted/50 p-6 rounded-lg text-right space-y-2">
                            <h3 className="font-semibold mb-4">{t("appointmentDetails")}:</h3>
                            <p>
                                <strong>{t("businessLabel")}:</strong> {businessName}
                            </p>
                            <p>
                                <strong>{t("serviceLabel")}:</strong> {selectedServiceName}
                            </p>
                            <p>
                                <strong>{t("dateLabel")}:</strong> {availableDates.find((d) => d.date === selectedDate)?.day} (
                                {selectedDate ? moment.utc(selectedDate, "DD/MM/YY").format("DD/MM") : ""})
                            </p>
                            <p>
                                <strong>{t("timeLabel")}:</strong> {selectedTime}
                            </p>
                            <p>
                                <strong>{t("businessAddress")}:</strong> {businessAddress}
                            </p>
                            <p>
                                <strong>{t("phone")}:</strong> {businessPhone}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            {googleCalendarUrl && (
                                <Button asChild variant="secondary">
                                    <a href={googleCalendarUrl} target="_blank" rel="noreferrer">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        {t("addToGoogleCalendar")}
                                    </a>
                                </Button>
                            )}
                        </div>

                        {/* <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button variant="outline" asChild>
                                <Link href="/marketplace">{t("bookingBackToSearch")}</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/my-appointments">{t("myAppointments")}</Link>
                            </Button>
                        </div> */}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
