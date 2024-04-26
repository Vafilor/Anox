import { forwardRef } from "react";
import { SketchPicker } from "react-color";

interface Props {
    color: string;
    className?: string;
    style?: React.CSSProperties;
    setColor: (color: string) => void;
    setOpen: (open: boolean) => void;
}

const ColorPicker = forwardRef<HTMLDivElement, Props>(
    function ({ color, className, style, setColor, setOpen }: Props, ref) {
        return (
            <div
                className={"fixed w-full h-full " + className}
                onMouseDown={() => setOpen(false)}>
                <div
                    ref={ref}
                    className="inline-block"
                    style={style}
                    onMouseDown={(event) => event?.stopPropagation()}>
                    <SketchPicker
                        disableAlpha
                        color={color}
                        onChange={(color) => setColor(color.hex + "FF")}
                    />
                </div>
            </div>
        );
    }
);

export default ColorPicker;