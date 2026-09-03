import moment_timezone from "moment-timezone";
import axios from "axios";
import { isObject } from "lodash";
import { parseError, safeStringify } from "../utils";
import { StringObject } from "../types";


/**
 * Forwards an error to Sentry, if one is configured.
 *
 * Server errors have only ever gone to stdout, which journald rotates away, so a production
 * failure was gone before anyone thought to look for it. This posts to Sentry's store endpoint
 * directly rather than pulling in the SDK: a server holding Firebase admin credentials should
 * not gain a dependency tree to report an exception.
 *
 * Silent and non-blocking by design — a monitoring outage must never become an application
 * outage, and a failure to report is not worth reporting.
 */
const reportToSentry = (message: string, detail: unknown): void => {
    const dsn = process.env.sentry_dsn;
    if (!dsn) return;

    // https://<key>@<host>/<projectId>
    const match = /^https:\/\/([^@]+)@([^/]+)\/(.+)$/.exec(dsn);
    if (!match) return;
    const [, key, host, projectId] = match;

    const body = JSON.stringify({
        timestamp: new Date().toISOString(),
        platform: "node",
        level: "error",
        logger: "keepqueue-server",
        environment: process.env.node_env || "production",
        message: { formatted: `${message}: ${safeStringify(parseError(detail))}`.slice(0, 8000) },
    });

    void fetch(`https://${host}/api/${projectId}/store/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${key}, sentry_client=keepqueue/1.0`,
        },
        body,
    }).catch(() => undefined);
};

class LoggerManager {
    private static instance: LoggerManager;
    private constructor() {}
    public static getInstance(): LoggerManager {
        if (!LoggerManager.instance) {
            LoggerManager.instance = new LoggerManager();
        }
        return LoggerManager.instance;
    }
    private getDate(): string {
        return moment_timezone().tz("Asia/Jerusalem").format("DD/MM/YYYY HH:mm:ss.SS");
    }
    public log(msg: string, data?: StringObject | any[]): void {
        const is_table =
            !process.env.KUBERNETES_SERVICE_HOST &&
            Array.isArray(data) &&
            data.length > 1 &&
            data.every((val) => {
                if (typeof val === "object" && !Array.isArray(val)) {
                    return Object.values(val).every((v) => ["string", "number", "boolean"].includes(typeof v) || v === null);
                }
                return false;
            }) &&
            data.some((val) => Object.values(val).length > 1);
        if (is_table) {
            console.log(`${this.getDate()} - `, msg, ": ");
            console.table(data);
            return;
        }
        console.log(`${this.getDate()} - ${msg}`, data === undefined ? "" : `: ${isObject(data) || Array.isArray(data) ? safeStringify(data) : data}`);
    }
    public error(msg: string, data?: any) {
        if (axios.isAxiosError(data)) {
            const summary = {
                message: data.message,
                code: (data as any).code,
                status: data.response?.status,
                method: data.config?.method,
                url: data.config?.url,
                response_data: data.response?.data,
            };
            console.error(`${this.getDate()} - ${msg}, axios error: ${safeStringify(summary)}`);
            reportToSentry(msg, summary);
            return;
        }
        const parsed = parseError(data);
        console.error(`${this.getDate()} - ${msg}`, data === undefined ? "" : `: ${safeStringify(parsed)}`);
        reportToSentry(msg, data);
    }
    public warn(msg: string, data?: any) {
        console.warn(`${this.getDate()} - ${msg}`, data === undefined ? "" : `: ${safeStringify(data)}`);
    }
}

export const logger = LoggerManager.getInstance();
