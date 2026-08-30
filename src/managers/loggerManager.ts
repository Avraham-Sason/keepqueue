import moment_timezone from "moment-timezone";
import axios from "axios";
import { isObject } from "lodash";
import { parseError, safeStringify } from "../utils";
import { StringObject } from "../types";

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
            return;
        }
        const parsed = parseError(data);
        console.error(`${this.getDate()} - ${msg}`, data === undefined ? "" : `: ${safeStringify(parsed)}`);
    }
    public warn(msg: string, data?: any) {
        console.warn(`${this.getDate()} - ${msg}`, data === undefined ? "" : `: ${safeStringify(data)}`);
    }
}

export const logger = LoggerManager.getInstance();
