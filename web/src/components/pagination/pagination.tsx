import { useMemo } from "react";
import { PageType, countPages, generatePages, hasNextPage, hasPreviousPage } from "../../util/pagination";
import { Link } from "@tanstack/react-router";

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

// TODO-Andrey 
// OnSetPage update the query param - see how to use router for that and to detect loading state
// pass in loadingPage to indicate loading state
// on page change, scroll to top
// tanstack router might remove the need for a reducer
// page must be passed in, no local state change for that.
// pass in options to controller how many items to display or... maybe get it based on width?
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
                <>
                    {item.type === PageType.ELLIPSES ? (
                        <div className="px-4 py-2 border-l">…</div>
                    ) :
                        <Link
                            key={index}
                            search={(prev) => ({
                                ...prev,
                                page: item.page
                            })}
                            disabled={page === item.page}
                            data-active={page === item.page}
                            className="px-4 py-2 border-l hover:bg-gray-100 transition-colors text-blue-500 data-[active=true]:bg-blue-500 data-[active=true]:text-white">
                            {item.page}
                        </Link>
                    }
                </>
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