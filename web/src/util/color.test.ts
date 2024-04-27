import parseApiColor, { clientToApiColor } from "./color";

describe("Color", () => {
    describe("parseApiColor", () => {
        it("Prepends a #", () => {
            expect(parseApiColor("FF0000FF")).toBe("#FF0000FF");
        })
    });

    describe("clientToApiColor", () => {
        it("Strips leading #", () => {
            expect(clientToApiColor("#FF0000FF")).toBe("FF0000FF");
        });

        it("Fills in #RRGGBB length color to 8 length", () => {
            expect(clientToApiColor("#FF0000")).toBe("FF0000FF");
            expect(clientToApiColor("FF0000")).toBe("FF0000FF");
        });

        it("Accepts an #RRGGBBAA color", () => {
            expect(clientToApiColor("#FFFF00AB")).toBe("FFFF00AB");
            expect(clientToApiColor("FFFF00AB")).toBe("FFFF00AB");
        });

        it("Throws an exception on unknown color lengths", () => {
            expect(() => clientToApiColor("#FF0000F")).toThrow();
            expect(() => clientToApiColor("##F0000FF")).toThrow();
            expect(() => clientToApiColor("FFF")).toThrow();
        });
    });
});