import { PageItem, PageItemEllipses, PageItemPage, PageType, countPages, generatePages, hasNextPage, hasPreviousPage } from "./pagination";

function createPageItem(page: number): PageItemPage {
    return {
        type: PageType.PAGE,
        page
    };
}

function createPageItemEllipses(): PageItemEllipses {
    return { type: PageType.ELLIPSES };
}

describe("Pagination Util", () => {
    describe("hasPrevious", () => {
        describe.each([
            [-1, -1, -1],
            [0, 0, 0],
            [0, 0, 1],
            [0, 1, 0],
            [0, 1, 1],
            [1, 0, 0],
            [1, 0, 1],
            [1, 1, 0],
        ])("hasPrevious({page: %i, pageSize: %i, count: %i})",
            (page: number, pageSize: number, count: number) => {
                it("throws an exception", () => {
                    expect(() => hasPreviousPage({ page, pageSize, count })).toThrow();
                });
            });

        describe.each([
            [1, 1, 1, false], // First page
            [1, 10, 100, false],
            [3, 5, 50, true], // Middle page
            [10, 10, 100, true], // Last Page
        ])("hasPrevious({page: %i, pageSize: %i, count: %i}",
            (page: number, pageSize: number, count: number, expected: boolean) => {
                it("has a previous page", () => {
                    expect(hasPreviousPage({ page, pageSize, count })).toBe(expected);
                });
            })
    });

    describe("hasNext", () => {
        describe.each([
            [0, 0, 0],
            [0, 0, 1],
            [0, 1, 0],
            [0, 1, 1],
            [1, 0, 0],
            [1, 0, 1],
            [1, 1, 0],
        ])("hasNext({page: %i, pageSize: %i, count: %i})",
            (page: number, pageSize: number, count: number) => {
                it("throws an exception", () => {
                    expect(() => hasNextPage({ page, pageSize, count })).toThrow();
                })
            });

        describe.each([
            [1, 1, 1, false], // First page
            [1, 10, 100, true], // First page with more
            [3, 5, 50, true], // Middle page
            [10, 10, 100, false], // Last Page
        ])("hasNext({page: %i, pageSize: %i, count: %i}",
            (page: number, pageSize: number, count: number, expected: boolean) => {
                it("has a next page", () => {
                    expect(hasNextPage({ page, pageSize, count })).toBe(expected);
                });
            })
    });

    describe("generatePageItems", () => {
        describe.each([
            // page, pages, maxItems, expected
            [1, 0, 5, []],
            [1, 3, 2, [
                createPageItem(1),
            ]],
            [3, 3, 2, [
                createPageItem(3)
            ]],
            [1, 3, 5, [
                createPageItem(1),
                createPageItem(2),
                createPageItem(3),
            ]],
            [1, 10, 3, [
                createPageItem(1),
                createPageItemEllipses(),
                createPageItem(10),
            ]],
            [2, 10, 3, [
                createPageItemEllipses(),
                createPageItem(2),
                createPageItemEllipses(),
            ]],
            [1, 10, 5, [
                createPageItem(1),
                createPageItem(2),
                createPageItem(3),
                createPageItemEllipses(),
                createPageItem(10),
            ]],
            [3, 10, 5, [
                createPageItem(1),
                createPageItemEllipses(),
                createPageItem(3),
                createPageItemEllipses(),
                createPageItem(10),
            ]],
            [4, 10, 5, [
                createPageItem(1),
                createPageItemEllipses(),
                createPageItem(4),
                createPageItemEllipses(),
                createPageItem(10),
            ]],
            [17, 20, 6, [
                createPageItem(1),
                createPageItemEllipses(),
                createPageItem(17),
                createPageItemEllipses(),
                createPageItem(20),
            ]],
            [20, 20, 6, [
                createPageItem(1),
                createPageItemEllipses(),
                createPageItem(17),
                createPageItem(18),
                createPageItem(19),
                createPageItem(20),
            ]],
            [11, 19, 8, [
                createPageItem(1),
                createPageItemEllipses(),
                createPageItem(10),
                createPageItem(11),
                createPageItem(12),
                createPageItemEllipses(),
                createPageItem(19),
            ]],
            [14, 19, 8, [
                createPageItem(1),
                createPageItemEllipses(),
                createPageItem(13),
                createPageItem(14),
                createPageItem(15),
                createPageItemEllipses(),
                createPageItem(19),
            ]],
        ])("generatePageItems({page: %i, pages: %i, maxItems: %i}",
            (page: number, pages: number, maxItems: number, expected: PageItem[]) => {
                it("generates pages correctly", () => {
                    expect(generatePages({ page, pages, maxItems })).toEqual(expected);
                });
            })
    });

    describe("countPages", () => {
        describe.each([
            [10, 100, 10],
            [1, 100, 100],
            [10, 101, 11],
            [3, 25, 9],
        ])("countPages(pages: %i, count: %i)",
            (pageSize: number, count: number, pages: number) => {
                it("gives the correct pages", () => {
                    expect(countPages(pageSize, count)).toBe(pages);
                })
            });
    });
});