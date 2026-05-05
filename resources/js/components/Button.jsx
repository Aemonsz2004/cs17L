// src/components/ui/Button.jsx
const variantStyles = {
    primary: 'bg-[#24A18F] text-white hover:bg-[#1D7B6E] shadow-sm',
    secondary: 'bg-[#F5F0E8] text-[#1B2B4B] hover:bg-[#EDE5D8]',
    ghost: 'bg-transparent text-[#1B2B4B] hover:bg-[#F5F0E8]',
    danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
    outline:
        'bg-white text-[#1B2B4B] border border-[#1B2B4B]/20 hover:bg-[#F5F0E8] shadow-sm',
};
const sizeStyles = {
    xs: 'text-xs  px-2.5 py-1.5 gap-1',
    sm: 'text-xs  px-3   py-2   gap-1.5',
    md: 'text-sm  px-4   py-2.5 gap-2',
    lg: 'text-sm  px-5   py-3   gap-2',
};
export default function Button({
    variant = 'outline',
    size = 'md',
    loading = false,
    full = false,
    leftIcon,
    rightIcon,
    disabled,
    className = '',
    children,
    ...props
}) {
    return (
        <button
            disabled={disabled || loading}
            className={[
                'inline-flex items-center justify-center rounded-lg font-medium',
                'transition-all duration-150 select-none',
                'focus-visible:ring-2 focus-visible:ring-[#24A18F] focus-visible:ring-offset-2 focus-visible:outline-none',
                'disabled:pointer-events-none disabled:opacity-50',
                'active:scale-[0.98]',
                variantStyles[variant],
                sizeStyles[size],
                full ? 'w-full' : '',
                className,
            ].join(' ')}
            {...props}
        >
            {loading ? (
                /* Spinner placeholder — swap with your spinner icon */
                <span className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : leftIcon ? (
                <span className="flex-shrink-0">{leftIcon}</span>
            ) : null}

            {children}

            {!loading && rightIcon && (
                <span className="flex-shrink-0">{rightIcon}</span>
            )}
        </button>
    );
}
