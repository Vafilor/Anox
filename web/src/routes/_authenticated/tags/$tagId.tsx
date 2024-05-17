import { Await, createFileRoute, defer } from "@tanstack/react-router";
import AnoxApi, { isApiError } from "../../../network/api";
import Breadcrumbs from "../../../components/breadcrumbs/breadcrumbs";
import Timestamp from "../../../components/timestamp/timestamp";
import { Suspense, useState } from "react";
import Spinner from "../../../components/spinner";
import Tag from "../../../components/tags/tag";
import Duration from "../../../components/duration/duration";
import { useForm } from "react-hook-form";
import parseApiColor, { clientToApiColor } from "../../../util/color";
import Button from "../../../components/button/button";
import toast from "react-hot-toast";
import Message from "../../../components/toasts/message";

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

interface TagInput {
    color: string;
}

function TagPage() {
    const { tag, tagTotalsDeferred } = Route.useLoaderData();

    const { register, handleSubmit } = useForm<TagInput>()
    const [updatingTag, setUpdatingTag] = useState(false);

    const onSubmit = async ({ color }: TagInput) => {
        setUpdatingTag(true);

        try {
            await AnoxApi.updateTag(tag.id, { color: clientToApiColor(color) });
            toast.success("Tag updated", { position: "top-right" });
        } catch (err: unknown) {
            if (isApiError(err)) {
                toast.error(
                    <Message title="Failed to update tag" body={err.error.message} />,
                    { position: "top-right" }
                );
            } else {
                toast.error("Unknown error occurred", { position: "top-right" });
                console.error(err);
            }
        } finally {
            setUpdatingTag(false);
        }
    }

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
                            <Tag name={tag.name} color={tag.color} />
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
                                            <Duration value={data.totalTime} />
                                        </td>
                                    </tr>
                                </>
                            )}
                        </Await>
                    </Suspense>
                </tbody>
            </table>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
                <input
                    type="color" {...register('color')}
                    defaultValue={parseApiColor(tag.color)}
                    className="h-[40px] w-[40px] mt-2"
                />
                <Button
                    type="submit"
                    variant="primary"
                    loading={updatingTag}
                    className="self-start">
                    Update
                </Button>
            </form>
        </div>
    );
}