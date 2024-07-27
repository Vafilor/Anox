import { Tag as TagModel, TagTotals } from "../../../../network/tag-api";
import Tag from "../../../../components/tags/tag";
import Timestamp from "../../../../components/timestamp/timestamp";
import { Suspense } from "react";
import Spinner from "../../../../components/spinner";
import { Await, DeferredPromise } from "@tanstack/react-router";
import Duration from "../../../../components/duration/duration";

interface Props {
    tag: TagModel;
    tagTotals: DeferredPromise<TagTotals>;
}

export default function TagDetails({ tag, tagTotals }: Props) {
    return (
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
                    <Await promise={tagTotals}>
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
    );
}