/**
 * Parses an API color, which comes in format RRGGBBAA as hex,
 * and returns an html-friendly color.
 */
export default function parseApiColor(color: string): string {
    return "#" + color;
}

/**
 * Converts a client color with a leading # to a formatted API value.
 * This is safe to use if the color doesn't have a leading #.
 */
export function clientToApiColor(color: string): string {
    let final = color;

    while (final.charAt(0) === "#") {
        final = final.substring(1);
    }

    // Regular RGB hex string
    if (final.length === 6) {
        final = final.padEnd(8, "F");
    } else if (final.length !== 8) {
        throw new Error(`Unsupported color '${color}'. Must be RRGGBB or RRGGBBAA, leading # is optional`);
    }

    return final;
}