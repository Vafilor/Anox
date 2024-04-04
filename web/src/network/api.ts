import { BASE_API_URL } from "../constants";

export interface Tag {
    id: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    canonicalName: string;
    color: string;
}

export interface PaginatedResponse<T> {
    results: T[];
    count: number;
    previous: string | null;
    next: string | null;
}

interface SearchFilter {
    search?: string;
}

interface PaginationFilter {
    ordering?: string;
    page?: number;
}

interface GenericFilter {
    search: SearchFilter;
    pagination: PaginationFilter;
}

interface Stringable {
    toString: () => string;
}

interface CreateTag {
    name: string;
    color: string;
}

function filterToQuery(args?: Record<string, unknown>): string {
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

export default class AnoxApi {
    static headers: Record<string, string> = {};

    static apiFetch(input: string | URL, init?: RequestInit) {
        return fetch(input, {
            ...init,
            headers: {
                ...(init ? init.headers : {}),
                ...AnoxApi.headers
            }
        });
    }

    static async apiJsonFetch<T>(input: string | URL, init?: RequestInit) {
        const result = await AnoxApi.apiFetch(input, {
            ...init,
            headers: {
                "Content-Type": "application/json"
            }
        });
        return await result.json() as T;
    }

    static async listTags(filter?: GenericFilter): Promise<PaginatedResponse<Tag>> {
        const extra = filterToQuery({
            ...filter?.pagination,
            ...filter?.search
        });

        return AnoxApi.apiJsonFetch(BASE_API_URL + "/tags/" + extra);
    }

    static async createTag(args: CreateTag): Promise<Tag> {
        return AnoxApi.apiJsonFetch(BASE_API_URL + "/tags/", {
            method: "POST",
            body: JSON.stringify(args)
        })
    }
}