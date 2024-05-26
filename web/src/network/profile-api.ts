import { BASE_API_URL } from "../constants";
import Network from "./network";

export interface Profile {
    id: string;
    username: string;
    timezone: string;
    dateFormat: string;
    datetimeFormat: string;
    todayDatetimeFormat: string;
    durationFormat: string;
}

export default class ProfileApi {
    static async get(): Promise<Profile> {
        return Network.apiJsonFetch(BASE_API_URL + "/user/profile/", {
            method: "GET"
        });
    }

    static async update(profile: Partial<Profile>): Promise<Profile> {
        return Network.apiJsonFetch(BASE_API_URL + "/user/profile/", {
            method: "PUT",
            body: JSON.stringify(profile)
        });
    }
}