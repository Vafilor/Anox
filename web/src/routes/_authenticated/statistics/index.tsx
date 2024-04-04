import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/statistics/")({
    component: Index
});

function Index() {
    return (
        <div>Statistics Index</div>
    );
}