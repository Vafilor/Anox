interface Props {
    title: string;
    body: string;
}

export default function Message({ title, body }: Props) {
    return (
        <div>
            <div className="font-bold">{title}</div>
            <div>{body}</div>
        </div>
    );
}