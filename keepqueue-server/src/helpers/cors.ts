/**
 * Origin rules for CORS, kept free of any Firebase or Express import so they can be checked
 * without credentials. See scripts/cors.check.ts.
 */
const DEFAULT_ORIGINS = ["https://keepqueue.com", "https://www.keepqueue.com", "http://localhost:3000", "http://localhost:3001"];

/**
 * Vercel preview URLs carry a per-deployment hash, so they cannot be listed one by one. The
 * previous pattern accepted any project whose name merely began with "keepqueue", which anyone
 * can create on Vercel. Pinning the team scope — the trailing segment Vercel appends, which
 * belongs to this account — makes the pattern match only our own previews.
 *
 * Set `vercel_preview_scope` to that slug to allow previews. Unset, previews are refused:
 * a wildcard nobody configured is not a safe default.
 */
export const vercelPreviewPattern = (scope?: string): RegExp | null =>
    scope ? new RegExp("^https://[a-z0-9-]+-" + scope.replace(/[^a-z0-9-]/gi, "") + "\\.vercel\\.app$") : null;

export const allowedOrigins = (configured?: string): string[] =>
    configured
        ? configured.split(",").map((origin) => origin.trim()).filter(Boolean)
        : DEFAULT_ORIGINS;

export const isAllowedOrigin = (origin: string | undefined, allowed: string[], previewScope?: string): boolean => {
    if (!origin) return true;
    if (allowed.includes(origin)) return true;
    const preview = vercelPreviewPattern(previewScope);
    return !!preview && preview.test(origin);
};

export const corsOriginCheck =
    (allowed: string[], previewScope?: string) =>
    (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) =>
        // callback(null, false) denies cleanly. Passing an Error instead made the cors
        // middleware hand it to the global error handler, answering a disallowed origin with
        // HTTP 500 rather than a plain CORS refusal.
        callback(null, isAllowedOrigin(origin, allowed, previewScope));
