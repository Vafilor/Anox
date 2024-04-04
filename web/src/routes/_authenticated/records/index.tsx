import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/records/")({
    component: Index
});

function Index() {
    return (
        <div>Records Index</div>
    );
}