import { FormEvent, useCallback } from "react";
import AnoxApi, { Tag } from "../../../network/api";
import { createFileRoute, useRouter, } from "@tanstack/react-router";
import ColorSquare from "../../../components/color-square/color-square";
import Pagination from "../../../components/pagination/pagination";

interface TagSearch {
    search?: string;
    page?: number;
    ordering?: string;
}

export const Route = createFileRoute("/_authenticated/tags/")({
    component: Tags,
    validateSearch: (search: Record<string, unknown>): TagSearch => ({
        search: search.search as string | undefined,
        page: search.page as number | undefined,
        ordering: search.ordering as string | undefined
    }),
    loaderDeps: (opts) => {
        return {
            search: opts.search.search,
            page: opts.search.page,
            ordering: opts.search.ordering
        }
    },
    loader: ({ deps }) => {
        return AnoxApi.listTags({
            search: {
                search: deps.search
            },
            pagination: {
                page: deps.page,
                ordering: deps.ordering
            }
        });
    }
});

function Tags() {
    const { page, search, ordering } = Route.useSearch();
    const { results, count, ...rest } = Route.useLoaderData();
    const router = useRouter();

    const handleCreateTag = useCallback(async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const name = formData.get("name") as string;
        const color = formData.get("color") as string;

        const result = await AnoxApi.createTag({
            name, color
        });

        console.log(result);

        router.invalidate();

        return { name, color };
    }, [router]);

    if (!results) {
        return <div>No Results Tags</div>;
    }

    // TODO timestamps relative to local timezone?
    return (
        <div className="p-2 overflow-auto">
            <h1 className="text-3xl text-center font-medium">Tags</h1>
            <div className="flex justify-center">
                <Pagination
                    page={page ?? 1}
                    pageSize={15}
                    maxItems={8}
                    count={count}
                    className="my-4"
                />
            </div>
            <form method="post" onSubmit={handleCreateTag}>
                <input name="name" placeholder="name" />
                <input name="color" placeholder="color" />
                <button type="submit">Create new tag</button>
            </form>
            <table className="table-fixed w-full border">
                <thead>
                    <tr>
                        <th className="border p-2 text-left">Name</th>
                        <th className="border p-2 text-left w-[80px]">Color</th>
                        <th className="border p-2 text-left">Created</th>
                        <th className="border p-2 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((tag: Tag) => (
                        <tr key={tag.id}>
                            <td className="border p-2 ">{tag.name}</td>
                            <td className="border p-2 ">
                                <ColorSquare className="ml-2 border border-black" color={tag.color} length={25} />
                            </td>
                            <td className="border p-2 ">{tag.createdAt}</td>
                            <td className="border p-2 ">View</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-center">
                <Pagination
                    page={page ?? 1}
                    pageSize={15}
                    maxItems={8}
                    count={count}
                    className="mt-4"
                />
            </div>
        </div>
    );
}