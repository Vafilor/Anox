import { SortOrder, sortOrderFromString, toggleOrder } from "./order";

describe("order", () => {
    describe("toggleOrder", () => {
        it("toggles neutral to negative", () => {
            expect(toggleOrder("createdAt", "createdAt")).toBe("-createdAt");
        });

        it("toggles negative to positive", () => {
            expect(toggleOrder("-createdAt", "createdAt")).toBe("createdAt");
        });

        it("handles undefined", () => {
            expect(toggleOrder(undefined, "createdAt")).toBe("createdAt");
        })

        it("returns neutral when a different name is given", () => {
            expect(toggleOrder("updatedAt", "createdAt")).toBe("createdAt");
        });
    });

    describe("sortOrderFromString", () => {
        it("handles wrong neutral value", () => {
            expect(sortOrderFromString("createdAt", "updatedAt")).toBe(SortOrder.NONE);
        });

        it("handles ascending", () => {
            expect(sortOrderFromString("createdAt", "createdAt")).toBe(SortOrder.ASCENDING);
        });

        it("handles descending", () => {
            expect(sortOrderFromString("-createdAt", "createdAt")).toBe(SortOrder.DESCENDING);
        });
    });
});