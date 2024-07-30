import { useMemo } from "react";
import formatDuration from "./util";

interface Props {
    value: number; // Seconds
    className?: string;
}

export default function Duration({ value, className }: Props) {
    const display = useMemo(() => {
        return formatDuration(value);
    }, [value]);

    return (
        <span className={className}>{display}</span>
    );
}