import { forwardRef } from "react";
import tinycolor from "tinycolor2";
import classNames from "classnames";

interface Props {
    color: string; // Hex, RRGGBB or RRGGBBAA
    length: number;
    className?: string;
    border?: boolean;
    rounded?: boolean;
    onClick?: () => void;
}

const ColorSquare = forwardRef<HTMLDivElement, Props>(
    function ColorSquare({ color, length, border, rounded, className, onClick }, ref) {
        const extraStyles = border ? {
            borderColor: tinycolor(color).darken(20).toString()
        } : {};

        return (
            <div
                ref={ref}
                className={classNames(className, {
                    "border": !!border,
                    "rounded": !!rounded
                })}
                style={{
                    width: length,
                    height: length,
                    backgroundColor: color,
                    ...extraStyles
                }}
                data-color={color}
                onClick={() => onClick?.()}>

            </div>
        );
    }
);

export default ColorSquare;