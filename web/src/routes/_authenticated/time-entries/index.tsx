import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/time-entries/")({
    component: Index
});

function Index() {
    return (
        <div>Time Entries Index</div>
    );
}