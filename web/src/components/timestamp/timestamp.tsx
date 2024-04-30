import { useMemo } from "react";

interface Props {
    when: string;
}

export default function Timestamp({ when }: Props) {
    const value = useMemo(() => {
        return (new Date(when)).toLocaleString();
    }, [when]);

    return (
        <span>{value}</span>
    )
}