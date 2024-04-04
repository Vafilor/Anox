import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/timestamps/")({
    component: Timestamps
});

function Timestamps() {
    return <div>Timestamps!</div>;
}