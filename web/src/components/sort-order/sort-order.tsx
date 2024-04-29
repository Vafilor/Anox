import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretUp } from "@fortawesome/free-solid-svg-icons";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { SortOrder as SortOrderType } from "../../util/order";

interface Props {
    order: SortOrderType;
    className?: string;
}

export default function SortOrder({ order, className }: Props) {
    if (order === SortOrderType.NONE) {
        return null;
    }

    if (order === SortOrderType.ASCENDING) {
        return <FontAwesomeIcon icon={faCaretUp} className={className} />;
    }

    return <FontAwesomeIcon icon={faCaretDown} className={className} />;
}