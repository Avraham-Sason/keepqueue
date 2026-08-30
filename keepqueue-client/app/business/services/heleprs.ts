export const formatDuration = (minutes: number, t: (key: string) => string) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
        return `${hours} ${t("hours")} ${mins} ${t("minutes")}`;
    } else if (hours > 0) {
        return `${hours} ${t("hours")}`;
    }
    return `${mins} ${t("minutes")}`;
};

export const formatPrice = (price: number, currency: string) => {
    return `${price} ${currency}`;
};