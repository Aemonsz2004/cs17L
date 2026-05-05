// src/components/ui/Badge.jsx
const variantStyles = {
    green: 'bg-[#1D7B6E]/10 text-[#0F6E56] border-[#1D7B6E]/20',
    amber: 'bg-amber-50   text-amber-700  border-amber-200',
    red: 'bg-red-50     text-red-600    border-red-200',
    blue: 'bg-blue-50    text-blue-700   border-blue-200',
    gray: 'bg-[#F5F0E8]  text-[#5C6B88]  border-[#EDE5D8]',
    navy: 'bg-[#1B2B4B]/8 text-[#1B2B4B] border-[#1B2B4B]/15',
};
const dotStyles = {
    green: 'bg-[#24A18F]',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    gray: 'bg-[#5C6B88]',
    navy: 'bg-[#1B2B4B]',
};
export default function Badge({
    variant = 'gray',
    dot = false,
    className = '',
    children,
}) {
    return (
        <span
            className={[
                'inline-flex items-center gap-1.5',
                'rounded-full border px-2 py-0.5',
                'text-[10px] font-bold tracking-wider uppercase',
                variantStyles[variant],
                className,
            ].join(' ')}
        >
            {dot && (
                <span
                    className={[
                        'h-1.5 w-1.5 flex-shrink-0 rounded-full',
                        dotStyles[variant],
                    ].join(' ')}
                />
            )}
            {children}
        </span>
    );
}
