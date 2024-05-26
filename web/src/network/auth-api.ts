import { BASE_API_URL } from "../constants";
import Network from "./network";

export interface LoginResponse {
    refresh: string;
    access: string;
}

export default class AuthApi {
    static async login(username: string, password: string) {
        return Network.apiJsonFetch<LoginResponse>(BASE_API_URL + "/token/", {
            method: "POST",
            body: JSON.stringify({
                username, password
            })
        })
    }
}