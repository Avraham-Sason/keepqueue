"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ALL_CATEGORIES, searchBusinesses } from "./helpers";

const DEBOUNCE_MS = 300;

export function useMarketplaceSearch() {
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState(ALL_CATEGORIES);
    const [debouncedQuery, setDebouncedQuery] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [query]);

    const result = useQuery({
        queryKey: ["marketplace", debouncedQuery, category],
        queryFn: (context) => searchBusinesses(debouncedQuery, category, context.signal),
        placeholderData: (previous) => previous,
        refetchOnWindowFocus: false,
        retry: 1,
    });

    const hasFilters = query.trim().length > 0 || category !== ALL_CATEGORIES;

    const clearFilters = () => {
        setQuery("");
        setCategory(ALL_CATEGORIES);
    };

    return { query, setQuery, category, setCategory, hasFilters, clearFilters, ...result };
}
