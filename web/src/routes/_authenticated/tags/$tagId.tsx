import { createFileRoute } from "@tanstack/react-router";
import AnoxApi from "../../../network/api";
import Breadcrumbs from "../../../components/breadcrumbs/breadcrumbs";

export const Route = createFileRoute("/_authenticated/tags/$tagId")({
    component: TagPage,
    loader: ({ params }) => {
        return AnoxApi.getTag(params.tagId);
    }
});

function TagPage() {
    const tag = Route.useLoaderData();

    return (
        <div className="p-2 overflow-auto bg-zinc-50 w-full">
            <Breadcrumbs
                className="w-full"
                crumbs={[{
                    name: "Tags",
                    options: { to: "/tags" }
                }, {
                    name: tag.name
                }]}
            />
            {tag.name}
        </div>
    );
}