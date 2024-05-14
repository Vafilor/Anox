import parseApiColor from "../../util/color";

interface Props {
    name: string;
    color: string;
}

export default function Tag({ name, color }: Props) {
    return (
        <span
            className="py-1 px-2 rounded-full text-white font-semibold"
            style={{ backgroundColor: parseApiColor(color) }}>
            {name}
        </span>
    )
}