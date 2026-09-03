export * from "./appError";
export * from "./cors";
import helmet from "helmet";
import express, { Express } from "express";
import cors from "cors";
import { logger } from "../managers";
import { errorHandler, trimBodyMiddleware, rateLimiter } from "../middlewares";
import { MainRouter, StringObject } from "../types";
import { allowedOrigins, corsOriginCheck } from "./cors";
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

const DRAIN_TIMEOUT_MS = 15_000;

export const startServer = async (mainRouter: MainRouter, port?: number): Promise<Express> => {
    const app: Express = express();
    app.set("trust proxy", 1);
    const { version, name } = packageJson;
    let envData = initEnvVariables();
    const resolvedPort = Number(port || process.env.PORT || envData.port);
    port = Number.isFinite(resolvedPort) && resolvedPort > 0 ? resolvedPort : 9000;
    app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
    // The API authenticates with a Bearer token, never a cookie, so credentialed CORS buys
    // nothing and only widens what a foreign origin may attempt.
    app.use(cors({ origin: corsOriginCheck(allowedOrigins(envData.allowed_origins), envData.vercel_preview_scope) }));
    app.use(express.json({ limit: "1mb" }));
    app.use(trimBodyMiddleware());
    app.use(rateLimiter(60 * 1000, 100));
    mainRouter(app);
    app.use(errorHandler);

    return new Promise<Express>((resolve, reject) => {
        const server = app.listen(port, () => {
            logger.log(`Server is running at http://localhost:${port}`);
            logger.log("project status", { name, version });
            resolve(app);
        });
        // Without a listener, EADDRINUSE is an unhandled 'error' event: the process dies with no
        // diagnostic while the instance already holding the port keeps serving the old build.
        server.on("error", reject);

        const shutdown = (signal: string) => {
            logger.log(`${signal} received, draining in-flight requests`);
            // ponytail: middlewares/rateLimiter.ts starts a cleanup setInterval at module scope
            // and never clears it, so the event loop never empties on its own — this timer is
            // what actually ends the process, not just a safety net for a slow request.
            const forceExit = setTimeout(() => {
                logger.error(`drain did not finish within ${DRAIN_TIMEOUT_MS}ms, exiting anyway`);
                process.exit(1);
            }, DRAIN_TIMEOUT_MS);
            server.close(() => {
                clearTimeout(forceExit);
                process.exit(0);
            });
            // close() waits for every open socket, and keep-alive sockets sit idle between
            // requests; without this a healthy deploy always pays the full drain timeout.
            server.closeIdleConnections();
        };
        process.once("SIGTERM", () => shutdown("SIGTERM"));
        process.once("SIGINT", () => shutdown("SIGINT"));
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
