interface Props {
    children: string | undefined | null,
    className?: string
}

export default function ErrorText({ children, className }: Props) {
    if (!children) {
        return null;
    }

    return <p className={"text-red-500 " + className}>{children}</p>;
}