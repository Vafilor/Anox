import { Link, Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { useState } from "react";

interface UrlElement {
    name: string;
    path: string;
}

const URLS: UrlElement[] = [{
    name: "Today",
    path: "/"
}, {
    name: "Time Entries",
    path: "/time-entries"
}, {
    name: "Tasks",
    path: "/tasks"
}, {
    name: "Timestamps",
    path: "/timestamps"
}, {
    name: "Tags",
    path: "/tags"
}, {
    name: "Statistics",
    path: "/statistics"
}, {
    name: "Records",
    path: "/records"
}, {
    name: "Notes",
    path: "/notes"
}];


export const Route = createFileRoute("/_authenticated")({
    component: AuthenticatedComponent,
    beforeLoad: ({ context, location }) => {
        if (!context.auth.isAuthenticated) {
            throw redirect({
                to: "/login",
                search: {
                    redirect: location.href
                }
            })
        }
    }
});

function AuthenticatedComponent() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <>
            <header className="min-h-[64px] bg-zinc-900 flex items-center">
                <button
                    type="button"
                    className="pl-3 block md:hidden text-white w-[30px] h-[30px]"
                    onClick={() => setSidebarOpen(prev => !prev)}>
                    <HamburgerMenuIcon className="h-full w-full" />
                </button>
            </header>
            <div className="flex h-[calc(100vh-64px)]">
                <div
                    className="hidden w-screen md:block md:w-[240px] bg-zinc-900 data-[manual-open]:fixed data-[manual-open]:text-center shrink-0 overflow-auto"
                    style={{
                        display: sidebarOpen ? "block" : undefined
                    }}
                    data-manual-open={sidebarOpen ? true : undefined}>
                    <ul>
                        {URLS.map(({ name, path }) => (
                            <li key={path}>
                                <Link
                                    to={path}
                                    activeProps={{
                                        className: "block p-3 bg-zinc-600"
                                    }}
                                    className="block text-sky-200 p-3 hover:bg-zinc-600"
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    {name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
                <Outlet />
            </div>
        </>
    );
}