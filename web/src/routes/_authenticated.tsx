import { Link, Outlet, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser, faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { useDismiss, useFloating, useInteractions, offset } from "@floating-ui/react";
import { useAuth } from "../auth/authContext";
import Button from "../components/button/button";
import { LOGIN_ROUTE } from "../constants";

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
    const [profileOpen, setProfileOpen] = useState(false);
    const navigate = useNavigate();

    const { refs, floatingStyles, context } = useFloating({
        open: profileOpen,
        onOpenChange: setProfileOpen,
        placement: "bottom-end",
        middleware: [
            offset({
                mainAxis: 10,
                crossAxis: -10,
            })
        ]
    });

    const dismiss = useDismiss(context);
    const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

    const auth = useAuth();

    const signOut = () => {
        auth.signOut();
        navigate({ to: LOGIN_ROUTE });
    };

    return (
        <>
            <header className="min-h-[64px] bg-zinc-900 flex items-center justify-between">
                <button
                    type="button"
                    className="pl-3 block md:invisible text-white w-[30px] h-[30px]"
                    onClick={() => setSidebarOpen(prev => !prev)}>
                    <HamburgerMenuIcon className="h-full w-full" />
                </button>
                <button
                    ref={refs.setReference}
                    {...getReferenceProps()}
                    className="pr-3 flex gap-2 items-center"
                    onClick={() => setProfileOpen(prev => !prev)}>
                    <FontAwesomeIcon icon={faCircleUser} size="lg" color="white" />
                    <FontAwesomeIcon icon={faCaretDown} color="white" />
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
            {profileOpen && (
                <div
                    ref={refs.setFloating}
                    {...getFloatingProps()}
                    style={floatingStyles}
                    className="bg-zinc-50 border rounded">
                    <div className="px-3 py-2">{auth.user?.username}</div>
                    <hr />
                    <Button
                        variant="basic"
                        className=""
                        onClick={() => signOut()}>
                        Logout
                    </Button>
                </div>
            )}
        </>
    );
}