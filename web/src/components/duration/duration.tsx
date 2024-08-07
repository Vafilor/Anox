import { useMemo } from "react";
import { formatDuration } from "./util";

type DurationFormatter = (duration: number) => string;
interface Props {
    value: number; // Seconds
    className?: string;
    formatter?: DurationFormatter;
}

export default function Duration({ value, className, formatter }: Props) {
    const display = useMemo(() => {
        if (formatter) {
            return formatter(value);
        }

        return formatDuration(value);
    }, [value, formatter]);

    return (
        <span className={className}>{display}</span>
    );
}