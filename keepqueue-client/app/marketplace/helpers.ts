import { apiCall } from "@/lib/helpers";
import { Language } from "@/lib/types";

export type MarketplaceBusiness = {
    id: string;
    name: string;
    address: string;
    description: string;
    categories: string[];
    logoUrl: string | null;
    ratingAvg: number;
    ratingCount: number;
    currency: string;
    serviceCount: number;
    priceFrom: number;
};

export type MarketplaceResult = {
    businesses: MarketplaceBusiness[];
    total: number;
    categories: string[];
};

export const ALL_CATEGORIES = "__all__";

export const MAX_QUERY_LENGTH = 120;

const RESULT_LIMIT = 60;

export const searchBusinesses = (query: string, category: string, signal?: AbortSignal) =>
    apiCall<MarketplaceResult>(
        "POST",
        "data",
        "searchBusinesses",
        {
            query: query.trim() || undefined,
            category: category === ALL_CATEGORIES ? undefined : category,
            limit: RESULT_LIMIT,
        },
        { signal }
    );

export const businessInitial = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

export const formatPrice = (amount: number, currency: string, language: Language) => {
    // Businesses predating the currency-code field stored a symbol, which Intl rejects.
    try {
        return new Intl.NumberFormat(language === "he" ? "he-IL" : "en-US", {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch {
        return `${currency}${amount}`;
    }
};
