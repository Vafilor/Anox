import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/tasks/")({
    component: Index
});

function Index() {
    return (
        <div>Tasks Index</div>
    );
}