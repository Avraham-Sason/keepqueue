import axios from "axios";
import { auth, waitForFirebaseAuth } from "../firebase";
import { StringObject } from "../types";
import { isLocal } from "./utils";

export class ApiError extends Error {
    status?: number;
    details?: unknown;

    constructor(message: string, options?: { status?: number; details?: unknown }) {
        super(message);
        this.name = "ApiError";
        this.status = options?.status;
        this.details = options?.details;
    }
}

const extractErrorMessage = (input: unknown): string | undefined => {
    if (!input) return undefined;
    if (typeof input === "string") return input;
    if (typeof input === "object" && "message" in (input as Record<string, unknown>)) {
        const message = (input as Record<string, unknown>).message;
        if (typeof message === "string") return message;
    }
    return undefined;
};

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: unknown;
}

export const serverUrl = isLocal ? "http://localhost:9000" : "https://api.keepqueue.com";

type Method = "GET" | "POST" | "PUT" | "DELETE";

type MainEndpoints = "data" | "actions";

export const apiCall = async <T = any>(
    method: Method,
    endpoint: MainEndpoints,
    url: string,
    data?: StringObject,
    config?: { signal?: AbortSignal }
): Promise<T | null> => {
    const send = async (forceRefreshToken: boolean) => {
        const token = await auth.currentUser?.getIdToken(forceRefreshToken);
        return axios({
            headers: { authorization: token ? "bearer " + token : undefined },
            method,
            url: `${serverUrl}/${endpoint}/${url}`,
            data,
            signal: config?.signal,
        });
    };

    try {
        await waitForFirebaseAuth();
        let response;
        try {
            response = await send(false);
        } catch (requestError: any) {
            const isExpiredToken = axios.isAxiosError(requestError) && requestError.response?.status === 401 && !!auth.currentUser;
            if (!isExpiredToken) throw requestError;
            response = await send(true);
        }
        const payload = response.data as ApiResponse<T>;
        if (!payload?.success) {
            throw new ApiError(extractErrorMessage(payload?.error) ?? "Server responded with an error", {
                status: response.status,
                details: payload?.error,
            });
        }
        return (payload?.data ?? null) as T | null;
    } catch (error: any) {
        console.error(`Error calling API: ${JSON.stringify({ method, url })} `, error);
        if (error instanceof ApiError) {
            throw error;
        }
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const responseData = error.response?.data as ApiResponse<T> | undefined;
            const messageFromResponse = extractErrorMessage(responseData?.error ?? error.response?.data);
            throw new ApiError(messageFromResponse ?? error.message ?? "Request failed", {
                status,
                details: responseData?.error ?? error.response?.data,
            });
        }
        throw error instanceof Error ? error : new ApiError("Unknown error", { details: error });
    }
};
