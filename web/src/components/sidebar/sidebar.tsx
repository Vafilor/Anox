import { Link } from "@tanstack/react-router";
import { memo } from "react";

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

interface Props {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

function Sidebar({ sidebarOpen, setSidebarOpen }: Props) {
    console.log("sidebar");
    return (
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
    );
}

export default memo(Sidebar);