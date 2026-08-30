import Image from "next/image";
import Link from "next/link";
import { use } from "react";
import { Calendar, Clock, MessageSquare, Users, Star, BarChart3, Building, User, Smartphone, LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getServerTranslation, TranslationsKey } from "@translations/server";
import CountUp from "@/components/CountUp";
import DecryptedText from "@/components/DecryptedText";
import TextType from "@/components/TextType";

// Shared static types
export interface FeatureStatic {
    icon: LucideIcon;
    titleKey: TranslationsKey;
    descriptionKey: TranslationsKey;
    color: string;
}

export interface TestimonialStatic {
    nameKey: TranslationsKey;
    businessKey: TranslationsKey;
    image: string;
    rating: number;
    textKey: TranslationsKey;
}

//   STATIC DATA (SEO-friendly)
export const FEATURES: FeatureStatic[] = [
    {
        icon: Calendar,
        titleKey: "featureAvailabilityTitle",
        descriptionKey: "featureAvailabilityDescription",
        color: "bg-blue-500/10 text-blue-600",
    },
    {
        icon: MessageSquare,
        titleKey: "featureSmsRemindersTitle",
        descriptionKey: "featureSmsRemindersDescription",
        color: "bg-green-500/10 text-green-600",
    },
    {
        icon: Clock,
        titleKey: "featureSmartWaitlistTitle",
        descriptionKey: "featureSmartWaitlistDescription",
        color: "bg-purple-500/10 text-purple-600",
    },
    {
        icon: BarChart3,
        titleKey: "featureRealtimeReportsTitle",
        descriptionKey: "featureRealtimeReportsDescription",
        color: "bg-orange-500/10 text-orange-600",
    },
    {
        icon: Users,
        titleKey: "featureCustomerManagementTitle",
        descriptionKey: "featureCustomerManagementDescription",
        color: "bg-pink-500/10 text-pink-600",
    },
    {
        icon: Star,
        titleKey: "featureReviewsRatingsTitle",
        descriptionKey: "featureReviewsRatingsDescription",
        color: "bg-yellow-500/10 text-yellow-600",
    },
];

export const TESTIMONIALS: TestimonialStatic[] = [
    {
        nameKey: "testimonial1Name",
        businessKey: "testimonial1Business",
        image: "/placeholder.svg?height=60&width=60",
        rating: 5,
        textKey: "testimonial1Text",
    },
    {
        nameKey: "testimonial2Name",
        businessKey: "testimonial2Business",
        image: "/placeholder.svg?height=60&width=60",
        rating: 5,
        textKey: "testimonial2Text",
    },
    {
        nameKey: "testimonial3Name",
        businessKey: "testimonial3Business",
        image: "/placeholder.svg?height=60&width=60",
        rating: 5,
        textKey: "testimonial3Text",
    },
];

export interface StatItem {
    number: number | string;
    label: TranslationsKey;
    from?: number;
    delay?: number;
}

export const STATS: StatItem[] = [
    { number: "98%", label: "statSatisfaction" },
    { number: 500000, label: "statMonthlyAppointments", from: 200000 },
    { number: "24/7", label: "statSupport" },
    { number: 10000, label: "statBusinessesActive", from: 5000 },
];

///  SigninForms – two main CTA cards
export function SigninForms() {
    const t = use(getServerTranslation());
    return (
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                {/* Card – Business owners */}
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
                    <Building className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-bold mb-2">{t("forBusinessOwners")}</h3>
                    <p className="text-muted-foreground mb-4">{t("manageYourBusinessEasily")}</p>
                    <Button size="lg" className="w-full" asChild>
                        <Link href="/auth/signin/business">{t("businessLogin")}</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent" asChild>
                        {/* <Link href="/business/auth/signup">{t("registerNewBusiness")}</Link> */}
                        <div>{t("registerNewBusiness")}</div>
                    </Button>
                </Card>

                {/* Card – Customers */}
                <Card className="p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
                    <User className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-bold mb-2">{t("customersPlural")}</h3>
                    <p className="text-muted-foreground mb-4">{t("findAndBookEasily")}</p>
                    <Button size="lg" className="w-full" asChild>
                        <Link href="/auth/signin/customer">{t("customerLogin")}</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full bg-transparent mt-2 " asChild>
                        {/* <Link href="/customer/marketplace">{t("searchBusinesses")}</Link> */}
                        <div>{t("searchBusinesses")}</div>
                    </Button>
                </Card>
            </div>
        </div>
    );
}

//  FeatureCard – single feature tile
export function FeatureCard({ feature }: { feature: FeatureStatic }) {
    const t = use(getServerTranslation());
    const { icon: Icon, titleKey, descriptionKey, color } = feature;
    return (
        <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
                <div className={`h-12 w-12 rounded-lg ${color} flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{t(titleKey)}</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-base leading-relaxed">{t(descriptionKey)}</CardDescription>
            </CardContent>
        </Card>
    );
}

/*********************************
 * StatsGrid – animated counters *
 *********************************/
export function StatsGrid() {
    const t = use(getServerTranslation());
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            {STATS.map((stat, index) => (
                <div
                    key={stat.label}
                    className="text-center animate-in fade-in slide-in-from-bottom-3 duration-500"
                    style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                >
                    {typeof stat.number === "number" ? (
                        <CountUp
                            className="text-2xl md:text-3xl font-bold text-primary"
                            to={stat.number}
                            from={stat.from}
                            delay={stat.delay}
                            separator=","
                        />
                    ) : (
                        <div className="text-2xl md:text-3xl font-bold text-primary">{stat.number}</div>
                    )}
                    <div className="text-sm text-muted-foreground">{t(stat.label)}</div>
                </div>
            ))}
        </div>
    );
}

//  HeroSection – top of page
export function HeroSection() {
    const t = use(getServerTranslation());
    return (
        <section className="py-20 px-4 relative overflow-hidden">
            <div className="absolute inset-0 queue-pattern opacity-30" />
            <div className="container max-w-6xl mx-auto text-center relative ">
                <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 ">
                    <h1 className="text-4xl flex flex-col md:text-6xl font-bold tracking-tight mb-6">
                        <DecryptedText text={t("heroMain")} />
                        <DecryptedText text={t("heroSub")} className="text-primary" />
                    </h1>
                    <p className="text-xl text-muted-foreground  max-w-3xl mx-auto mb-4">{t("heroParagraph")}</p>
                    {/* <TextType typingSpeed={40} text={t("heroParagraph")} className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto" /> */}
                    <SigninForms />
                    <StatsGrid />
                </div>
            </div>
        </section>
    );
}

/****************************************
 * FeaturesSection – list of features   *
 ****************************************/
export function FeaturesSection() {
    const t = use(getServerTranslation());
    return (
        <section id="features" className="py-20 px-4 bg-muted/30">
            <div className="container max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("featuresHeading")}</h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t("featuresSubheading")}</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {FEATURES.map((feature, index) => (
                        <div
                            key={feature.titleKey}
                            className="animate-in fade-in slide-in-from-bottom-3 duration-500"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <FeatureCard feature={feature} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/*******************************************
 * TestimonialsSection – user reviews      *
 *******************************************/
export function TestimonialsSection() {
    const t = use(getServerTranslation());
    return (
        <section id="testimonials" className="py-20 px-4">
            <div className="container max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("navTestimonials")}</h2>
                    <p className="text-xl text-muted-foreground">{t("newsletterJoin")}</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {TESTIMONIALS.map((testimonial, index) => (
                        <div
                            key={testimonial.nameKey}
                            className="animate-in fade-in slide-in-from-bottom-3 duration-500"
                            style={{ animationDelay: `${index * 0.2}s` }}
                        >
                            <TestimonialCard testimonial={testimonial} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/*****************************************
 * TestimonialCard – customer feedback   *
 *****************************************/
export function TestimonialCard({ testimonial }: { testimonial: TestimonialStatic }) {
    const t = use(getServerTranslation());
    const { nameKey, businessKey, image, rating, textKey } = testimonial;
    return (
        <Card className="h-full">
            <CardContent className="pt-6">
                <div className="flex items-center mb-4 gap-2">
                    <Image src={image || "/placeholder.svg"} alt={t(nameKey)} width={60} height={60} className="h-12 w-12 rounded-full " />
                    <div>
                        <h4 className="font-semibold">{t(nameKey)}</h4>
                        <p className="text-sm text-muted-foreground">{t(businessKey)}</p>
                    </div>
                </div>
                <div className="flex mb-4">
                    {[...Array(rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                </div>
                <p className="text-muted-foreground italic">"{t(textKey)}"</p>
            </CardContent>
        </Card>
    );
}

/***************************
 * Footer Helper component *
 ***************************/
export interface FooterLinkStatic {
    href: string;
    label: TranslationsKey;
}

export function FooterColumn({ title, links }: { title: TranslationsKey; links: FooterLinkStatic[] }) {
    const t = use(getServerTranslation());
    return (
        <div>
            <h3 className="font-semibold mb-4">{t(title)}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
                {links.map(({ href, label }) => (
                    <li key={href}>
                        <Link href={href} className="hover:text-foreground transition-colors">
                            {t(label)}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function SiteFooter() {
    const t = use(getServerTranslation());
    return (
        <footer className="border-t py-12 px-4 bg-background">
            <div className="container max-w-6xl mx-auto">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center">
                                <Image src="/logo.png" alt="logo" width={32} height={32} />
                            </div>
                            <span className="text-xl font-bold">{t("brandName")}</span>
                        </div>
                        <p className="text-muted-foreground text-sm">{t("heroParagraph")}</p>
                    </div>
                    <FooterColumn
                        title="footerProduct"
                        links={[
                            { href: "#features", label: "footerFeatures" },
                            { href: "#pricing", label: "footerPricing" },
                            { href: "/marketplace", label: "footerMarketplace" },
                        ]}
                    />
                    <FooterColumn
                        title="footerSupport"
                        links={[
                            { href: "/help", label: "footerHelpCenter" },
                            { href: "/contact", label: "footerContact" },
                            { href: "/api", label: "footerAPI" },
                        ]}
                    />
                    <FooterColumn
                        title="footerCompany"
                        links={[
                            { href: "/about", label: "footerAbout" },
                            { href: "/careers", label: "footerCareers" },
                            { href: "/blog", label: "footerBlog" },
                        ]}
                    />
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t">
                    <div className="flex gap-2 text-sm text-muted-foreground mb-4 md:mb-0">
                        <Link href="/privacy" className="hover:text-foreground transition-colors">
                            {t("privacyPolicy")}
                        </Link>
                        <Link href="/terms" className="hover:text-foreground transition-colors">
                            {t("termsOfUse")}
                        </Link>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        © 2024 {t("brandName")}. {t("rightsReserved")}
                    </div>
                </div>
            </div>
        </footer>
    );
}
