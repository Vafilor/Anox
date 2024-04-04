import { createContext, useCallback, useContext, useMemo, useState } from "react";
import AnoxApi from "../network/api";

export interface UserInfo {
    username: string;
    token: string;
}

export interface AuthContextInterface {
    isAuthenticated: boolean;
    user: UserInfo | null;
    signIn: (user: UserInfo) => void;
    signOut: VoidFunction;
}

export const AuthContext = createContext<AuthContextInterface>({
    isAuthenticated: false,
    user: null,
    signIn: (user: UserInfo) => null,
    signOut: () => null
});

function loadLocalAuth(): UserInfo | null {
    const localUser = localStorage.getItem("user");
    if (localUser === null) {
        return null;
    }

    const parsed = JSON.parse(localUser) as UserInfo;
    if (!parsed.token || !parsed.username) {
        return null;
    }


    AnoxApi.headers["Authorization"] = "Bearer " + parsed.token;

    return parsed;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserInfo | null>(loadLocalAuth);

    const signIn = useCallback((user: UserInfo) => {
        AnoxApi.headers["Authorization"] = "Bearer " + user.token;
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
    }, [setUser]);

    const signOut = useCallback(() => {
        delete AnoxApi.headers["Authorization"];
        localStorage.removeItem("user");
        setUser(null);
    }, [setUser]);

    const contextValue: AuthContextInterface = useMemo(() => {
        return {
            isAuthenticated: !!user,
            user,
            signIn,
            signOut
        }
    }, [user, signIn, signOut]);

    return (
        <AuthContext.Provider value={contextValue}>{children} </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }

    return context;
}