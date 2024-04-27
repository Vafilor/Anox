import { forwardRef } from "react";

interface Props extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    className?: string;
}

const Input = forwardRef<HTMLInputElement, Props>(
    ({ className, ...rest }, ref) => {
        return (
            <input
                ref={ref}
                {...rest}
                className={`p-2 border rounded w-full bg-white transition-colors outline-none transition-shadow focus:shadow-focus ${className}`}
            />
        );
    })

export default Input;