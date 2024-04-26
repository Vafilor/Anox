import { forwardRef } from "react";
import parseApiColor from "../../util/color";

interface Props {
    color: string; // Hex, RGB or RGBA
    length: number;
    className?: string;
    onClick?: () => void;
}

const ColorSquare = forwardRef<HTMLDivElement, Props>(
    function ColorSquare({ color, length, className, onClick }, ref) {
        return (
            <div
                ref={ref}
                className={className}
                style={{
                    width: length,
                    height: length,
                    backgroundColor: color
                }}
                data-color={color}
                onClick={() => onClick?.()}>

            </div>
        );
    }
);

export default ColorSquare;