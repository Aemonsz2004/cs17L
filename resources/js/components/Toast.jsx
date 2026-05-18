import { useEffect, useState } from 'react';

const VARIANTS = {
    success: 'border-emerald-500 bg-emerald-50 text-emerald-900',
    error: 'border-red-500 bg-red-50 text-red-900',
    amber: 'border-amber-500 bg-amber-50 text-amber-900',
    teal: 'border-teal-500 bg-teal-50 text-teal-900',
};

export default function Toast({ message, variant = 'success', duration = 5000, onDismiss }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onDismiss?.(), 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onDismiss]);

    return (
        <div
            className={`pointer-events-auto fixed top-4 right-4 z-50 flex max-w-sm items-center gap-3 rounded-xl border-2 px-4 py-3 shadow-lg transition-all duration-300 ${
                visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
            } ${VARIANTS[variant] ?? VARIANTS.success}`}
            role="alert"
        >
            <span className="text-sm font-medium">{message}</span>
            <button
                type="button"
                onClick={() => {
                    setVisible(false);
                    setTimeout(() => onDismiss?.(), 300);
                }}
                className="ml-auto shrink-0 rounded-full p-0.5 text-current/60 hover:text-current"
                aria-label="Dismiss"
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

export function ToastContainer({ flash }) {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        if (!flash) return;
        const entries = [];
        if (flash.success) entries.push({ message: flash.success, variant: 'success', key: 's' + Date.now() });
        if (flash.error) entries.push({ message: flash.error, variant: 'error', key: 'e' + Date.now() });
        if (entries.length > 0) {
            setToasts((prev) => [...prev, ...entries]);
        }
    }, [flash]);

    const dismiss = (key) => setToasts((prev) => prev.filter((t) => t.key !== key));

    return (
        <div className="pointer-events-none fixed top-0 right-0 z-50 flex flex-col items-end gap-2 p-4">
            {toasts.map((t) => (
                <Toast key={t.key} message={t.message} variant={t.variant} onDismiss={() => dismiss(t.key)} />
            ))}
        </div>
    );
}
