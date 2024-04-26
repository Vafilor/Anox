import AnoxApi, { Tag, isApiError } from "../../../network/api";
import { createFileRoute, useRouter, } from "@tanstack/react-router";
import ColorSquare from "../../../components/color-square/color-square";
import Pagination from "../../../components/pagination/pagination";
import { useForm } from "react-hook-form";
import { DEFAULT_COLOR } from "../../../constants";
import { useState } from "react";
import { autoUpdate, offset, useFloating } from '@floating-ui/react';
import parseApiColor, { clientToApiColor } from "../../../util/color";
import ErrorText from "../../../components/error/error-text";
import Button from "../../../components/button/button";
import ColorPicker from "../../../components/color-picker/color-picker";

interface TagSearch {
    search?: string;
    page?: number;
    ordering?: string;
}

interface CreateTagInput {
    name: string;
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
    const { results, count } = Route.useLoaderData();
    const router = useRouter();
    const {
        register,
        handleSubmit,
        reset,
        formState: { isSubmitting, errors }
    } = useForm<CreateTagInput>();

    const [createErrors, setCreateErrors] = useState<string[]>([]);
    const [color, setColor] = useState(DEFAULT_COLOR);
    const [colorPickerOpen, setColorPickerOpen] = useState(false);
    const { refs, floatingStyles } = useFloating({
        whileElementsMounted: autoUpdate,
        placement: "bottom-end",
        middleware: [
            offset({
                mainAxis: 5
            })
        ]
    });

    async function submitCreateTag({ name }: CreateTagInput) {
        setCreateErrors([]);

        try {
            await AnoxApi.createTag({
                name,
                color: clientToApiColor(color || DEFAULT_COLOR)
            });

            reset();
            setColor(DEFAULT_COLOR);
            router.invalidate();
        } catch (err: unknown) {
            if (isApiError(err)) {
                setCreateErrors([err.error.message]);
            } else if (typeof err === "object") {
                const errors: string[] = [];
                for (let [key, value] of Object.entries(err as object)) {
                    errors.push(`${key}: ${value}`);
                }
                setCreateErrors(errors);
            } else {
                console.error(err);
            }
        }

        return { name, color };
    };

    if (!results) {
        return <div>No Results Tags</div>;
    }

    // TODO timestamps relative to local timezone?
    return (
        <>
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
                <div className="font-semibold text-lg">Add tag</div>
                <form
                    method="post"
                    onSubmit={handleSubmit(submitCreateTag)}
                    className="w-100">
                    <div className="flex gap-2 w-100">
                        <input
                            {...register("name", {
                                required: {
                                    value: true,
                                    message: "Tag must have a name"
                                }
                            })}
                            onInput={() => {
                                if (createErrors.length) {
                                    setCreateErrors([]);
                                }
                            }}
                            autoComplete="off"
                            className="p-2 border rounded w-full grow"
                            placeholder="tag name"
                        />
                        <div className="px-1.5 inline-flex items-center border rounded">
                            <ColorSquare
                                ref={refs.setReference}
                                color={color}
                                length={25}
                                className="border border-black"
                                onClick={() => setColorPickerOpen(true)}
                            />
                        </div>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={isSubmitting}
                            loading={isSubmitting}>
                            Create
                        </Button>
                    </div>
                    <ErrorText>{errors.name?.message}</ErrorText>
                    {createErrors.map((message, index) => (
                        <ErrorText key={index}>{message}</ErrorText>
                    ))}
                </form>
                <table className="table-fixed w-full border mt-2">
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
                                    <ColorSquare
                                        className="ml-2 border border-black"
                                        color={parseApiColor(tag.color)}
                                        length={25}
                                    />
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
            </div >
            {colorPickerOpen && (
                <ColorPicker
                    ref={refs.setFloating}
                    color={color}
                    setColor={setColor}
                    setOpen={setColorPickerOpen}
                    style={floatingStyles}
                />
            )}
        </>
    );
}