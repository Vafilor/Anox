import { BASE_API_URL } from "../constants";
import Network from "./network";
import { GenericFilter, PaginatedResponse } from "./types";
import { filterToQuery } from "./utils";

export interface Tag {
    id: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    canonicalName: string;
    color: string;
}

export interface CreateTag {
    name: string;
    color: string;
}

export interface TagTotals {
    references: number;
    totalTime: number; // seconds
}

export interface TagTimeReport {
    report: Record<string, number>
}

export default class TagApi {
    static async list(filter?: GenericFilter): Promise<PaginatedResponse<Tag>> {
        let extra = filterToQuery({
            ...filter?.pagination,
            ...filter?.search
        });

        if (extra !== "") {
            extra = "?" + extra;
        }

        return Network.apiJsonFetch(BASE_API_URL + "/tags/" + extra);
    }

    static async get(id: string): Promise<Tag> {
        return Network.apiJsonFetch(BASE_API_URL + "/tags/" + id + "/");
    }

    static async create(args: CreateTag): Promise<Tag> {
        return Network.apiJsonFetch(BASE_API_URL + "/tags/", {
            method: "POST",
            body: JSON.stringify(args)
        })
    }

    static async update(tagId: string, args: { color: string }): Promise<Tag> {
        return Network.apiJsonFetch(BASE_API_URL + "/tags/" + tagId + "/", {
            method: "PUT",
            body: JSON.stringify(args)
        })
    }

    static async getTotals(id: string): Promise<TagTotals> {
        return Network.apiJsonFetch(`${BASE_API_URL}/tags/${id}/totals/`);
    }

    static async getTimeReport(id: string): Promise<TagTimeReport> {
        return Network.apiJsonFetch(`${BASE_API_URL}/tags/${id}/time-report/`);
    }
}