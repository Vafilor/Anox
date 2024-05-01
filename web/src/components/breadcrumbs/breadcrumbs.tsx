import { Link, NavigateOptions } from "@tanstack/react-router";
import classNames from "classnames";

export interface BreadcrumbItem {
    name: string;
    options?: NavigateOptions;
}

interface Props {
    crumbs: BreadcrumbItem[];
    className?: string;
}

export default function Breadcrumbs({ crumbs, className }: Props) {
    return (
        <nav className={classNames("rounded bg-slate-200 p-2", className)}>
            <ol className="flex">
                {crumbs.map((crumb, index) => (
                    <li key={index}>
                        {crumb.options ? (
                            <Link
                                {...crumb.options}
                                className="web-link">
                                {crumb.name}
                            </Link>
                        ) : (
                            <span className="text-gray-600">{crumb.name}</span>
                        )}
                        {index < (crumbs.length - 1) && (
                            <span className="px-2 text-gray-600">/</span>
                        )}
                    </li>
                ))}
            </ol>
        </ nav>
    );
}