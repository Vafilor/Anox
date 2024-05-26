import { ApiError, Stringable } from "./types";

export function isApiError(err: unknown): err is ApiError {
    return (err as ApiError).error?.message !== undefined;
}

export function filterToQuery(args?: Record<string, unknown>): string {
    if (!args) {
        return "";
    }

    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(args)) {
        const stringable = value as Stringable;
        if (stringable && stringable.toString) {
            params.set(key, stringable.toString());
        }
    }

    return params.toString();
}
