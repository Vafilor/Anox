import { Await, DeferredPromise } from "@tanstack/react-router";
import { Tag as TagModel, TagTimeReport as TagTimeReportModel } from "../../../../network/tag-api";
import { Suspense } from "react";
import Spinner from "../../../../components/spinner";
import Duration from "@/components/duration/duration";
import classNames from "classnames";
import Block from "@/components/loading/block";

interface Props {
    tag: TagModel;
    timeReport: DeferredPromise<TagTimeReportModel>;
}

export default function TagTimeReport({ tag, timeReport }: Props) {
    return (
        <table className="mt-2 table-fixed w-full">
            <thead>
                <tr className="border bg-sky-200">
                    <th className="p-2 text-left">Day</th>
                    <th className="p-2 text-left">Time</th>
                </tr>
            </thead>
            <Suspense fallback={Array(4).fill(0).map(() => (
                <tbody>
                    <tr className="border-x">
                        <td className="p-2"><Block height={30} className="w-full" /></td>
                        <td className="p-2"><Block height={30} className="w-full" /></td>
                    </tr>
                </tbody>
            ))}>
                <Await promise={timeReport}>
                    {(response) => <ReportBody model={response} />}
                </Await>
            </Suspense>
        </table >
    );
}

function ReportBody({ model }: { model: TagTimeReportModel }) {
    return (
        <>
            <tbody>
                {model.report.map((item, index) => (
                    <tr key={item.date} className={classNames("border-x", {
                        "bg-slate-200": index % 2 === 1
                    })}>
                        <td className="p-2">
                            {item.date}
                        </td>
                        <td className="p-2">
                            <Duration value={item.seconds} />
                        </td>
                    </tr>
                ))}
            </tbody>
            <tfoot>
                <tr className="border-x border-b border-t border-t-slate-900 bg-sky-200">
                    <td className="p-2 font-bold">Total</td>
                    <td className="p-2 font-bold">
                        <Duration value={model.total} />
                    </td>
                </tr>
            </tfoot>
        </>
    )
}