export const parseError = (error: any) => {
    return error instanceof Error ? { name: error.name, message: error.message } : error;
};

export const safeStringify = (value: any): string => {
    const seen = new WeakSet<object>();
    try {
        return JSON.stringify(
            value,
            (key, val) => {
                if (typeof val === "object" && val !== null) {
                    if (seen.has(val)) {
                        return "[Circular]";
                    }
                    seen.add(val);
                }
                if (val instanceof Error) {
                    return { name: val.name, message: val.message, stack: val.stack };
                }
                return val;
            }
        );
    } catch {
        return String(value);
    }
};
