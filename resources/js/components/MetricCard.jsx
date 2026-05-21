// src/components/ui/MetricCard.jsx
const trendStyles = {
    up: 'text-[#1D7B6E]',
    down: 'text-red-500',
    neutral: 'text-[#5C6B88]',
};
export default function MetricCard({
    label,
    value,
    sub,
    trend = 'neutral',
    icon,
    iconBg = 'bg-[#1D7B6E]/10 text-[#1D7B6E]',
    className = '',
    onClick,
}) {
    return (
        <div
            onClick={onClick}
            className={[
                'flex flex-col gap-1 rounded-xl border border-[#1B2B4B]/10 bg-white p-4 shadow-sm transition-colors hover:bg-gray-50',
                onClick ? 'cursor-pointer' : '',
                className,
            ].join(' ')}
        >
            <div className="flex items-start justify-between">
                <p className="text-[11px] font-semibold tracking-wider text-[#5C6B88] uppercase">
                    {label}
                </p>
                {icon && (
                    <span
                        className={[
                            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                            iconBg,
                        ].join(' ')}
                    >
                        {icon}
                    </span>
                )}
            </div>

            <p className="text-2xl leading-tight font-bold text-[#1B2B4B]">
                {value}
            </p>

            {sub && (
                <p
                    className={['text-xs font-medium', trendStyles[trend]].join(
                        ' ',
                    )}
                >
                    {sub}
                </p>
            )}
        </div>
    );
}
