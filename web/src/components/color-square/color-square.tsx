import parseApiColor from "../../util/color";

interface Props {
    color: string; // Hex RGB or RGBA. Only 
    length: number;
    className?: string;
}

export default function ColorSquare({ color, length, className }: Props) {
    return (
        <div
            className={className}
            style={{
                width: length,
                height: length,
                backgroundColor: parseApiColor(color)
            }}>

        </div>
    );
}