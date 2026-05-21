export default function InputError({ message, className, id }) {
    if (!message) {
        return null;
    }
    return (
        <p id={id} className={`mt-1 text-xs text-red-600 ${className ?? ''}`}>
            {message}
        </p>
    );
}
