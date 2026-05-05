// src/components/ui/Card.jsx
function Card({ hover = false, padding = false, className = '', children }) {
    return (
        <div
            className={[
                'rounded-xl border border-[#1B2B4B]/10 bg-white',
                'shadow-[0_1px_3px_rgba(27,43,75,0.08),0_1px_2px_rgba(27,43,75,0.04)]',
                hover
                    ? 'cursor-pointer transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(27,43,75,0.12)]'
                    : '',
                padding ? 'p-5' : '',
                className,
            ].join(' ')}
        >
            {children}
        </div>
    );
}
Card.Header = function CardHeader({
    title,
    action,
    border = true,
    className = '',
    children,
}) {
    return (
        <div
            className={[
                'flex items-center justify-between px-5 py-3.5',
                border ? 'border-b border-[#1B2B4B]/8' : '',
                className,
            ].join(' ')}
        >
            {title ? (
                <h3 className="text-sm font-semibold text-[#1B2B4B]">
                    {title}
                </h3>
            ) : (
                children
            )}
            {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
    );
};
Card.Body = function CardBody({ flush = false, className = '', children }) {
    return (
        <div className={[flush ? '' : 'p-5', className].join(' ')}>
            {children}
        </div>
    );
};
Card.Footer = function CardFooter({ className = '', children }) {
    return (
        <div
            className={[
                'border-t border-[#1B2B4B]/8 px-5 py-3',
                'rounded-b-xl bg-[#FAF8F4]/60 text-sm text-[#5C6B88]',
                className,
            ].join(' ')}
        >
            {children}
        </div>
    );
};
export default Card;
