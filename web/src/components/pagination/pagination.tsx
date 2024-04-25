import { useMemo } from "react";
import { countPages, generatePages, hasNextPage, hasPreviousPage } from "../../util/pagination";
import { Link } from "@tanstack/react-router";
import PaginationItem from "./pagination-item";

interface Props {
    page: number;
    pageSize: number;
    count: number;
    maxItems: number;
    className?: string;
}

const classes = {
    enabledLink: "p-2 text-blue-500 hover:bg-gray-100",
    disabledLink: "p-2 text-gray-300"
}

export default function Pagination({ page, pageSize, count, maxItems, className }: Props) {
    const hasPrevious = hasPreviousPage({ page, pageSize, count });
    const hasNext = hasNextPage({ page, pageSize, count });

    const pageItems = useMemo(() => {
        const pages = countPages(pageSize, count);
        return generatePages({ page, pages, maxItems });
    }, [page, pageSize, count, maxItems]);

    return (
        <div className={"bg-white border rounded inline-flex " + (className ?? "")}>
            <Link
                disabled={!hasPrevious}
                search={(prev) => ({
                    ...prev,
                    page: ((prev as { page?: number }).page ?? 2) - 1
                })}
                className={classes[hasPrevious ? "enabledLink" : "disabledLink"]}>
                «&nbsp;Previous
            </Link>
            {pageItems.map((item, index) => (
                <PaginationItem
                    key={index}
                    item={item}
                    currentPage={page}
                />
            ))}
            <Link
                disabled={!hasNext}
                search={(prev) => ({
                    ...prev,
                    page: ((prev as { page?: number }).page ?? 0) + 1
                })}
                className={"border-l " + classes[hasNext ? "enabledLink" : "disabledLink"]}>
                Next&nbsp;»
            </Link>
        </div>
    );
}