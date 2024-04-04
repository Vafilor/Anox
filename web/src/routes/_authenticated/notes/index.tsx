import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/notes/")({
    component: Index
});

function Index() {
    return (
        <div>Notes Index</div>
    );
}