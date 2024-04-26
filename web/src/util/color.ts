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
    if (color.charAt(0) === "#") {
        return color.substring(1);
    }

    return color;
}