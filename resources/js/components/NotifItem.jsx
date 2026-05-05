// src/components/ui/NotifItem.jsx
// Single notification / activity feed row.
const dotColor = {
    red: 'bg-red-400',
    amber: 'bg-amber-400',
    teal: 'bg-[#24A18F]',
    gray: 'bg-[#5C6B88]',
};
export default function NotifItem({
    variant = 'gray',
    message,
    timestamp,
    unread = false,
    className = '',
}) {
    return (
        <div
            className={[
                'flex gap-3 px-5 py-3.5',
                'border-b border-[#1B2B4B]/5 last:border-0',
                unread ? 'bg-[#FAF8F4]' : '',
                className,
            ].join(' ')}
        >
            {/* Dot */}
            <span
                className={[
                    'mt-1.5 h-2 w-2 flex-shrink-0 rounded-full',
                    dotColor[variant],
                ].join(' ')}
            />

            <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-[#1B2B4B]">{message}</p>
                {timestamp && (
                    <p className="mt-0.5 text-[11px] text-[#5C6B88]">
                        {timestamp}
                    </p>
                )}
            </div>
        </div>
    );
}
