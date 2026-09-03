"use client";

import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks";
import { ALL_CATEGORIES, businessInitial, formatPrice, MAX_QUERY_LENGTH, type MarketplaceBusiness } from "./helpers";
import { useMarketplaceSearch } from "./hooks";

function BusinessCard({ business }: { business: MarketplaceBusiness }) {
    const { t, language } = useLanguage();

    return (
        <Link
            href={`/home/${business.id}`}
            className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
            <Card className="flex h-full flex-col transition-shadow hover:shadow-lg">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={business.logoUrl ?? undefined} alt={business.name} />
                            <AvatarFallback>{businessInitial(business.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <h2 className="truncate text-lg font-semibold leading-tight">{business.name}</h2>
                            {business.address && (
                                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                    <span className="truncate">{business.address}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                    {business.description && <p className="line-clamp-2 text-sm text-muted-foreground">{business.description}</p>}

                    {business.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {business.categories.map((name) => (
                                <Badge key={name} variant="secondary">
                                    {name}
                                </Badge>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        {business.ratingCount > 0 ? (
                            <span className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                                <span className="font-medium">{business.ratingAvg.toFixed(1)}</span>
                                <span className="text-muted-foreground">({business.ratingCount})</span>
                            </span>
                        ) : (
                            <span className="text-muted-foreground">{t("noReviewsYet")}</span>
                        )}
                        <span className="text-muted-foreground">
                            {business.serviceCount} {t("services")}
                        </span>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="font-semibold">
                            {t("marketplaceFrom")} {formatPrice(business.priceFrom, business.currency, language)}
                        </span>
                        <span className="text-sm font-medium text-primary">{t("bookAppointment")}</span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

function CardsSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
                <Card key={index} className="h-full">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-4/5" />
                        <Skeleton className="h-6 w-1/3" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <p className="text-lg font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
                {action}
            </CardContent>
        </Card>
    );
}

export function Marketplace() {
    const { t } = useLanguage();
    const { query, setQuery, category, setCategory, hasFilters, clearFilters, data, error, isLoading, isFetching, refetch } = useMarketplaceSearch();

    const businesses = data?.businesses ?? [];
    const categories = data?.categories ?? [];
    const total = data?.total ?? 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                    <Label htmlFor="marketplace-search">{t("searchBusinesses")}</Label>
                    <Input
                        id="marketplace-search"
                        type="search"
                        value={query}
                        maxLength={MAX_QUERY_LENGTH}
                        placeholder={t("searchBusinessesPlaceholder")}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </div>
                <div className="space-y-2 sm:w-56">
                    <Label htmlFor="marketplace-category">{t("categories")}</Label>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="marketplace-category">
                            <SelectValue placeholder={t("marketplaceAllCategories")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_CATEGORIES}>{t("marketplaceAllCategories")}</SelectItem>
                            {categories.map((name) => (
                                <SelectItem key={name} value={name}>
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {error ? (
                <EmptyState
                    title={t("marketplaceLoadError")}
                    description={error instanceof Error ? error.message : t("errorGeneric")}
                    action={
                        <Button variant="outline" onClick={() => refetch()}>
                            {t("marketplaceRetry")}
                        </Button>
                    }
                />
            ) : isLoading ? (
                <CardsSkeleton />
            ) : businesses.length === 0 ? (
                hasFilters ? (
                    <EmptyState
                        title={t("notFoundBusinesses")}
                        description={t("tryChangeSearchTerms")}
                        action={
                            <Button variant="outline" onClick={clearFilters}>
                                {t("marketplaceClearFilters")}
                            </Button>
                        }
                    />
                ) : (
                    <EmptyState title={t("marketplaceEmptyTitle")} description={t("marketplaceEmptyDescription")} />
                )
            ) : (
                <>
                    <p role="status" className="text-sm text-muted-foreground">
                        {businesses.length < total ? `${businesses.length} / ${total}` : total} {t("marketplaceResults")}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy={isFetching}>
                        {businesses.map((business) => (
                            <BusinessCard key={business.id} business={business} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
