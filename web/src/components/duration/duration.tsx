import { useMemo } from "react";
import formatDuration from "./util";

interface Props {
    value: number; // Seconds
}

export default function Duration({ value }: Props) {
    const display = useMemo(() => {
        return formatDuration(value);
    }, [value]);

    return (
        <span>{display}</span>
    );
}