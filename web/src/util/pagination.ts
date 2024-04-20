export interface Pageable {
    page: number;
    pageSize: number;
    count: number;
}

export function hasPreviousPage({ page, pageSize, count }: Pageable): boolean {
    if (count <= 0 || pageSize <= 0 || page <= 0) {
        throw new Error("Page, PageSize, and Count must all be non-zero");
    }

    return page > 1;
}

export function hasNextPage({ page, pageSize, count }: Pageable): boolean {
    if (count <= 0 || pageSize <= 0 || page <= 0) {
        throw new Error("Page, PageSize, and Count must all be non-zero");
    }

    return (page * pageSize) < count;
}

export enum PageType {
    PAGE,
    ELLIPSES
}

export interface PageItemPage {
    type: PageType.PAGE;
    page: number;
}

export interface PageItemEllipses {
    type: PageType.ELLIPSES;
}

export type PageItem = PageItemPage | PageItemEllipses;


export function generatePages(
    { page, pages, maxItems }: { page: number, pages: number, maxItems: number }): PageItem[] {

    if (pages === 0 || maxItems === 0) {
        return [];
    }

    if (maxItems >= pages) {
        const result: PageItem[] = [];
        for (let i = 0; i < pages; i++) {
            result.push({ type: PageType.PAGE, page: i + 1 });
        }

        return result;
    }

    if (maxItems <= 2) {
        return [{ type: PageType.PAGE, page }];
    }

    if (page < (maxItems - 3)) {
        const result: PageItem[] = [{ type: PageType.PAGE, page: 1 }];
        for (let i = 1; i < maxItems - 2; i++) {
            result.push({ type: PageType.PAGE, page: i + 1 });
        }
        result.push({ type: PageType.ELLIPSES });
        result.push({ type: PageType.PAGE, page: pages });
        return result;
    }

    if (page > (pages - maxItems + 3)) {
        const result: PageItem[] = [{ type: PageType.PAGE, page: 1 }];
        result.push({ type: PageType.ELLIPSES });
        for (let i = (pages - maxItems + 3); i < pages + 1; i++) {
            result.push({ type: PageType.PAGE, page: i });
        }
        return result;
    }

    if (maxItems <= 4) {
        if (page === 1 || page === pages) {
            return [
                { type: PageType.PAGE, page },
                { type: PageType.ELLIPSES },
                { type: PageType.PAGE, page: pages },
            ];
        }

        return [
            { type: PageType.ELLIPSES },
            { type: PageType.PAGE, page },
            { type: PageType.ELLIPSES },
        ];
    }

    const result: PageItem[] = [{ type: PageType.PAGE, page: 1 }];
    result.push({ type: PageType.ELLIPSES });

    const itemsLeft = maxItems - 5;
    const leftStart = page - Math.floor(itemsLeft / 2);
    const rightEnd = page + Math.floor(itemsLeft / 2);

    for (let i = leftStart; i <= rightEnd; i++) {
        result.push({ type: PageType.PAGE, page: i });
    }

    result.push({ type: PageType.ELLIPSES });
    result.push({ type: PageType.PAGE, page: pages });

    return result;
}

export function countPages(pageSize: number, count: number): number {
    return Math.ceil(count / pageSize);
}