import helmet from "helmet";
import express, { Express } from "express";
import cors from "cors";
import { logger } from "../managers";
import { errorHandler, trimBodyMiddleware, rateLimiter } from "../middlewares";
import { MainRouter, StringObject } from "../types";
import { readFileSync } from "fs";
import packageJson from "../../package.json";

export const jsonOK = <T = any>(data?: T) => {
    return { success: true, data };
};
export const jsonFailed = <T = any>(error?: T) => {
    return { success: false, error };
};

export const initEnvVariables = (requiredVars: string[] = []) => {
    requiredVars.forEach((varName) => {
        const envVal = process.env[varName];
        if (!envVal) {
            logger.error(`--- Error: Missing mandatory environment variable: ${varName}. ---`);
            process.exit(1);
        }
    });
    const envVars: StringObject<string> = {};
    Object.keys(process.env).forEach((varName) => {
        const envVal = <string>process.env[varName];
        envVars[varName] = envVal;
    });
    return envVars;
};

const DEFAULT_ORIGINS = ["https://keepqueue.com", "https://www.keepqueue.com", "http://localhost:3000", "http://localhost:3001"];

const VERCEL_PREVIEW = /^https:\/\/keepqueue-[a-z0-9-]+\.vercel\.app$/;

export const allowedOrigins = (configured?: string): string[] =>
    configured
        ? configured.split(",").map((origin) => origin.trim()).filter(Boolean)
        : DEFAULT_ORIGINS;

export const isAllowedOrigin = (origin: string | undefined, allowed: string[]): boolean =>
    !origin || allowed.includes(origin) || VERCEL_PREVIEW.test(origin);

export const corsOriginCheck =
    (allowed: string[]) =>
    (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) =>
        isAllowedOrigin(origin, allowed) ? callback(null, true) : callback(new Error("Origin not allowed"));

export const startServer = async (mainRouter: MainRouter, port?: number): Promise<Express> => {
    const app: Express = express();
    app.set("trust proxy", 1);
    const { version, name } = packageJson;
    let envData = initEnvVariables(["port"]);
    const resolvedPort = Number(port || process.env.PORT || envData.port);
    port = Number.isFinite(resolvedPort) && resolvedPort > 0 ? resolvedPort : 9000;
    app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
    app.use(cors({ origin: corsOriginCheck(allowedOrigins(envData.allowed_origins)), credentials: true }));
    app.use(express.json({ limit: "1mb" }));
    app.use(trimBodyMiddleware());
    app.use(rateLimiter(60 * 1000, 100));
    mainRouter(app);
    app.use(errorHandler);

    return new Promise<Express>((resolve, reject) => {
        app.listen(port, () => {
            logger.log(`Server is running at http://localhost:${port}`);
            logger.log("project status", { name, version });
            resolve(app);
        });
    });
};

export const trimStrings = <T>(input: any): any => {
    if (typeof input === "string") {
        return input.trim();
    }

    if (Array.isArray(input)) {
        return input.map(trimStrings);
    }

    if (input instanceof Date || input instanceof RegExp || input instanceof Map || input instanceof Set) {
        return input;
    }

    if (input !== null && typeof input === "object") {
        const trimmedObject: Record<string, any> = {};
        for (const key of Object.getOwnPropertyNames(input)) {
            if (Object.prototype.hasOwnProperty.call(input, key)) {
                trimmedObject[key] = trimStrings(input[key]);
            }
        }
        return trimmedObject;
    }

    return input;
};

export { parseError, safeStringify } from "../utils";

export const getVersion = (packageJsonPath: string): string => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    return packageJson.version;
};
