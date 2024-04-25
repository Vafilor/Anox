import { Link } from "@tanstack/react-router";
import { PageItem, PageType } from "../../util/pagination";

interface Props {
    item: PageItem;
    currentPage: number;
}

export default function PaginationItem({ item, currentPage }: Props) {
    if (item.type === PageType.ELLIPSES) {
        return <div className="px-4 py-2 border-l">…</div>;
    }

    return (
        <Link
            search={
                (prev) => ({
                    ...prev,
                    page: item.page
                })
            }
            disabled={currentPage === item.page}
            data-active={currentPage === item.page}
            className="px-4 py-2 border-l hover:bg-gray-100 transition-colors text-blue-500 data-[active=true]:bg-blue-500 data-[active=true]:text-white" >
            {item.page}
        </Link >
    );
}