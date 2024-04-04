import { useState } from "react";
import { BASE_API_URL, HOMEPAGE_ROUTE } from "../constants";
import { useAuth } from "../auth/authContext";
import Spinner from "../components/spinner";
import { createFileRoute, getRouteApi, useNavigate } from "@tanstack/react-router";

// TODO move this to network and add a login method
interface SignInResponse {
    refresh: string;
    access: string;
}

export const Route = createFileRoute('/login')({
    validateSearch: (search: Record<string, unknown>): { redirect: string } => ({
        redirect: (search.redirect as string) || HOMEPAGE_ROUTE
    }),
    component: Login,
})

const routeApi = getRouteApi('/login')

export default function Login() {
    const navigate = useNavigate();
    const auth = useAuth();
    const [loading, setLoading] = useState(false);

    const search = routeApi.useSearch();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        setLoading(true);
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const username = formData.get("username") as string;
        const password = formData.get("password") as string;

        const result = await fetch(BASE_API_URL + "/token/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username, password
            })
        })

        // TODO on failure set loading and errors
        const body = await result.json() as SignInResponse;

        auth.signIn({
            username,
            token: body.access
        });

        navigate({ to: search.redirect });
    }

    return (
        <div className="flex justify-center items-center h-screen bg-stone-50">
            <form onSubmit={handleSubmit} className="border p-2 rounded min-w-[340px] bg-white">
                <div className="text-lg text-center font-semibold">Anox</div>
                <hr />
                <div className="flex flex-col gap-2 mt-2">
                    <label htmlFor="username">Username</label>
                    <input id="username" type="text" name="username" className="border p-2 rounded" />
                    <label htmlFor="password">Password</label>
                    <input id="password" type="password" name="password" className="border p-2 rounded" />
                    <button
                        type="submit"
                        className="bg-sky-400 hover:bg-sky-600 p-2 rounded inline-flex justify-center items-center disabled:cursor-not-allowed transition ease-in-out duration-150"
                        disabled={loading}
                    >
                        {loading ? <Spinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /> : null}
                        Log in
                    </button>
                </div>
            </form>
        </div>
    );
}