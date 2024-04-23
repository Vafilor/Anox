import { useState } from "react";
import { HOMEPAGE_ROUTE } from "../constants";
import { useAuth } from "../auth/authContext";
import Spinner from "../components/spinner";
import { createFileRoute, getRouteApi, redirect, useNavigate } from "@tanstack/react-router";
import AnoxApi from "../network/api";
import { useForm } from "react-hook-form";
import { flushSync } from "react-dom";

const FALLBACK = '/';

export const Route = createFileRoute('/login')({
    validateSearch: (search: Record<string, unknown>): { redirect: string } => ({
        redirect: (search.redirect as string) || HOMEPAGE_ROUTE
    }),
    beforeLoad: ({ context, search }) => {
        if (context.auth.isAuthenticated) {
            throw redirect({ to: search.redirect || FALLBACK });
        }
    },
    component: Login,
})

const routeApi = getRouteApi('/login')

interface LoginInput {
    username: string;
    password: string;
}

function ErrorMessage({ children, className }: { children: string | undefined | null, className?: string }) {
    if (!children) {
        return null;
    }

    return <p className={"text-red-500 " + className}>{children}</p>;
}

export default function Login() {
    const navigate = useNavigate();
    const auth = useAuth();
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const search = routeApi.useSearch();

    const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>();

    async function onSubmit({ username, password }: LoginInput) {
        setLoading(true);

        try {
            const result = await AnoxApi.login(username, password);

            flushSync(() => {
                auth.signIn({
                    username,
                    token: result.access
                });
            })

            navigate({ to: search.redirect || FALLBACK });
        } catch (err: unknown) {
            const detailError = err as { detail: string };
            if (detailError.detail) {
                setSubmitError(detailError.detail);
            } else {
                setSubmitError("Unknown error occurred");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex justify-center items-center h-screen bg-stone-50">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="border p-2 rounded w-[340px] bg-white">
                <div className="text-lg text-center font-semibold">Anox</div>
                <hr />
                <ErrorMessage className="my-2">{submitError}</ErrorMessage>
                <div className="flex flex-col gap-2 mt-2">
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        {...register("username", {
                            required: {
                                value: true,
                                message: "Username is required"
                            },
                            minLength: {
                                value: 6,
                                message: "Username must be at least 6 characters"
                            }
                        })}
                        className="border p-2 rounded"
                    />
                    <ErrorMessage>{errors.username?.message}</ErrorMessage>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        {...register("password", {
                            required: {
                                value: true,
                                message: "Password is required"
                            },
                            minLength: {
                                value: 6,
                                message: "Password must be at least 6 characters"
                            }
                        })}
                        type="password"
                        className="border p-2 rounded"
                    />
                    <ErrorMessage>{errors.password?.message}</ErrorMessage>
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