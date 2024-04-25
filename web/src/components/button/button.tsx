import Spinner from "../spinner";

interface Props extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
    variant: "primary"
    loading?: boolean;
}

const BUTTON_CLASSES = "px-3 py-2 select-none rounded inline-flex justify-center items-center transition-colors outline-none focus:shadow-focus disabled:opacity-80 disabled:pointer-events-none";

const VARIANT_CLASSES = {
    "primary": BUTTON_CLASSES + " bg-blue-500 hover:bg-blue-600 text-white"
};

export default function Button({ variant, loading, children, ...rest }: Props) {
    return (
        <button
            {...rest}
            className={VARIANT_CLASSES[variant]}>
            {loading && <Spinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />}
            {children}
        </button>
    );
}