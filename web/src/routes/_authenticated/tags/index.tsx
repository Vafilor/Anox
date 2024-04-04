import { FormEvent, useCallback } from "react";
import AnoxApi, { Tag } from "../../../network/api";
import { createFileRoute, useRouter, } from "@tanstack/react-router";

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
    const { results, count } = Route.useLoaderData();
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

    return (
        <div>
            <form method="post" onSubmit={handleCreateTag}>
                <input name="name" placeholder="name" />
                <input name="color" placeholder="color" />
                <button type="submit">Create new tag</button>
            </form>
            {results.map((tag: Tag) => (
                <div key={tag.id}>
                    {tag.name}
                </div>
            ))}
        </div>
    );
}