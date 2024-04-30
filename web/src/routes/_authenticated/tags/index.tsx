import AnoxApi, { Tag, isApiError } from "../../../network/api";
import { Link, createFileRoute, useNavigate, useRouter, } from "@tanstack/react-router";
import ColorSquare from "../../../components/color-square/color-square";
import Pagination from "../../../components/pagination/pagination";
import { useForm } from "react-hook-form";
import { DEFAULT_COLOR } from "../../../constants";
import { useCallback, useState } from "react";
import parseApiColor, { clientToApiColor } from "../../../util/color";
import ErrorText from "../../../components/error/error-text";
import Button from "../../../components/button/button";
import debounce from 'debounce';
import Input from "../../../components/input/input";
import { sortOrderFromString, toggleOrder } from "../../../util/order";
import SortOrder from "../../../components/sort-order/sort-order";
import Timestamp from "../../../components/timestamp/timestamp";

interface TagSearch {
    search?: string;
    page?: number;
    ordering?: string;
}

interface CreateTagInput {
    name: string;
    color: string;
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

    const navigate = useNavigate({ from: Route.fullPath });

    const [createErrors, setCreateErrors] = useState<string[]>([]);
    async function submitCreateTag({ name, color }: CreateTagInput) {
        setCreateErrors([]);

        try {
            await AnoxApi.createTag({
                name,
                color: clientToApiColor(color)
            });

            reset();
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

    const searchTagName = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        navigate({
            search: {
                search: event.target.value,
                page: 1
            }
        })
    }, [navigate])

    return (
        <>
            <div className="p-2 overflow-auto bg-zinc-50">
                <h1 className="text-3xl text-center font-medium">Tags</h1>
                <fieldset className="border rounded p-2">
                    <legend className="px-2 font-semibold">Filter</legend>
                    <label htmlFor="filter-name" >Name</label>
                    <Input
                        id="filter-name"
                        name="filer-name"
                        autoComplete="off"
                        defaultValue={search ?? ""}
                        onInput={debounce(searchTagName, 250)}
                    />
                </fieldset>
                <div className="flex justify-center">
                    {count !== 0 && <Pagination
                        page={page ?? 1}
                        pageSize={15}
                        maxItems={8}
                        count={count}
                        className="my-4"
                    />}
                </div>
                <div className="font-semibold text-lg mt-4">Add tag</div>
                <form
                    method="post"
                    onSubmit={handleSubmit(submitCreateTag)}
                    className="w-100">
                    <div className="flex gap-2 w-100">
                        <Input
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
                            className="grow"
                            placeholder="tag name"
                        />
                        <div>
                            <input
                                type="color"
                                {...register("color")}
                                defaultValue={DEFAULT_COLOR}
                                className="h-full"
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
                <table className="table-fixed w-full mt-2 b">
                    <thead>
                        <tr>
                            <th className="border p-2 text-left">
                                <Link
                                    search={(prev: TagSearch) => ({
                                        ...prev,
                                        ordering: toggleOrder(prev.ordering, "name")
                                    })}
                                    className="web-link">
                                    <SortOrder
                                        className="mr-1"
                                        order={sortOrderFromString(ordering, "name")}
                                    />
                                    Name
                                </Link>
                            </th>
                            <th className="border p-2 text-left w-[80px]">Color</th>
                            <th className="border p-2 text-left">
                                <Link
                                    search={(prev: TagSearch) => ({
                                        ...prev,
                                        ordering: toggleOrder(prev.ordering, "created_at")
                                    })}
                                    className="web-link">
                                    <SortOrder
                                        className="mr-1"
                                        order={sortOrderFromString(ordering, "created_at")}
                                    />
                                    Created
                                </Link>
                            </th>
                            <th className="border p-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((tag: Tag) => (
                            <tr key={tag.id}>
                                <td className="border p-2 ">{tag.name}</td>
                                <td className="border p-2 ">
                                    <ColorSquare
                                        className="ml-2"
                                        color={parseApiColor(tag.color)}
                                        border
                                        rounded
                                        length={25}
                                    />
                                </td>
                                <td className="border p-2 ">
                                    <Timestamp when={tag.createdAt} />
                                </td>
                                <td className="border p-2 ">View</td>
                            </tr>
                        ))}
                        {results.length === 0 && (
                            <tr>
                                <td colSpan={4} className="border p-2 text-center">No tags found</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="flex justify-center">
                    {count !== 0 && <Pagination
                        page={page ?? 1}
                        pageSize={15}
                        maxItems={8}
                        count={count}
                        className="mt-4"
                    />}
                </div>
            </div >
        </>
    );
}