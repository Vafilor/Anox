import classNames from "classnames";

interface Props {
    className?: string;
    height?: number;
    width?: number;
}

export default function Block({ height, width, className }: Props) {
    return (
        <div
            className={classNames("animate-pulse bg-slate-200 rounded", className)}
            style={{
                height,
                width
            }}
        >
        </div>
    );
}