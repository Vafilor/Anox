import { Await, DeferredPromise } from "@tanstack/react-router";
import { Tag as TagModel, TagTimeReport as TagTimeReportModel } from "../../../../network/tag-api";
import { Suspense } from "react";
import Spinner from "../../../../components/spinner";

interface Props {
    tag: TagModel;
    timeReport: DeferredPromise<TagTimeReportModel>;
}

export default function TagTimeReport({ tag, timeReport }: Props) {
    return (
        <table className="mt-2 table-fixed w-full">
            <thead>
                <tr>
                    <th className="border p-2 text-left">Day</th>
                    <th className="border p-2 text-left">Time</th>
                </tr>
            </thead>
            <tbody>
                <Suspense fallback={(
                    // TODO loading blocks
                    <tr>
                        <td colSpan={2}><Spinner /></td>
                    </tr>
                )}>
                    <Await promise={timeReport}>
                        {(data) => Object.entries(data.report).map(([key, value]) => (
                            <tr key={key}>
                                <td>{key}</td>
                                <td>{value}</td>
                            </tr>
                        ))}
                    </Await>
                </Suspense>
            </tbody>
        </table>
    );
}