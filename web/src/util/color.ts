/**
 * Parses an API color, which comes in format RRGGBBAA as hex,
 * and returns an html-friendly color.
 */
export default function parseApiColor(color: string): string {
    return "#" + color;
}