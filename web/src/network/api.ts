import AuthApi from "./auth-api";
import ProfileApi from "./profile-api";
import TagApi from "./tag-api";

export default class AnoxApi {
    static get Tag(): typeof TagApi {
        return TagApi;
    }

    static get Auth(): typeof AuthApi {
        return AuthApi;
    }

    static get Profile(): typeof ProfileApi {
        return ProfileApi;
    }
}