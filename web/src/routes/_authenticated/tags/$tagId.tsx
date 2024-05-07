import { Await, createFileRoute, defer } from "@tanstack/react-router";
import AnoxApi from "../../../network/api";
import Breadcrumbs from "../../../components/breadcrumbs/breadcrumbs";
import Timestamp from "../../../components/timestamp/timestamp";
import { Suspense } from "react";
import Spinner from "../../../components/spinner";

export const Route = createFileRoute("/_authenticated/tags/$tagId")({
    component: TagPage,
    loader: async ({ params }) => {
        const tagTotals = AnoxApi.getTagTotals(params.tagId);
        const tag = await AnoxApi.getTag(params.tagId);

        return {
            tag,
            tagTotalsDeferred: defer(tagTotals)
        }
    }
});

function TagPage() {
    const { tag, tagTotalsDeferred } = Route.useLoaderData();

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
            <h1 className="mt-4 text-center text-xl font-semibold">{tag.name}</h1>
            <table className="mt-2 table-fixed w-full">
                <thead>
                    <tr>
                        <th className="border p-2 text-left">Type</th>
                        <th className="border p-2 text-left">Data</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border p-2 text-left">Preview</td>
                        <td className="border p-2 text-left">

                        </td>
                    </tr>
                    <tr>
                        <td className="border p-2 text-left">Created</td>
                        <td className="border p-2 text-left">
                            <Timestamp when={tag.createdAt} />
                        </td>
                    </tr>
                    <Suspense fallback={(
                        <>
                            <tr>
                                <td className="border p-2 text-left">References</td>
                                <td className="border p-2 text-left">
                                    <Spinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray" />
                                </td>
                            </tr>
                            <tr>
                                <td className="border p-2 text-left">Total time</td>
                                <td className="border p-2 text-left">
                                    <Spinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray" />
                                </td>
                            </tr>
                        </>
                    )}>
                        <Await promise={tagTotalsDeferred}>
                            {(data) => (
                                <>
                                    <tr>
                                        <td className="border p-2 text-left">References</td>
                                        <td className="border p-2 text-left">
                                            {data.references}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border p-2 text-left">Total time</td>
                                        <td className="border p-2 text-left">
                                            {data.totalTime}
                                        </td>
                                    </tr>
                                </>
                            )}
                        </Await>
                    </Suspense>
                </tbody>
            </table>
        </div>
    );
}