export enum SortOrder {
    ASCENDING,
    DESCENDING,
    NONE
}

export function toggleOrder(value: string | undefined, neutralValue: string) {
    if (!value || !value.endsWith(neutralValue)) {
        return neutralValue;
    }

    if (value.charAt(0) === "-") {
        return value.substring(1);
    }

    return "-" + value;
}

export function sortOrderFromString(value: string | undefined, neutralValue: string) {
    if (!value || !value.endsWith(neutralValue)) {
        return SortOrder.NONE;
    }

    if (value.charAt(0) === "-") {
        return SortOrder.DESCENDING;
    }

    return SortOrder.ASCENDING;
}