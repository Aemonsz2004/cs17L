// src/components/ui/Modal.jsx
import { useEffect } from 'react';
import Icon from './Icon';
const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
};
export default function Modal({
    open,
    onClose,
    title,
    size = 'md',
    footer,
    hideClose = false,
    className = '',
    children,
}) {
    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);
    // Prevent body scroll
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B2B4B]/40 p-4 backdrop-blur-[2px]"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
        >
            <div
                className={[
                    'relative flex w-full flex-col rounded-2xl bg-white',
                    'max-h-[90vh] overflow-hidden',
                    'shadow-[0_20px_60px_rgba(27,43,75,0.18)]',
                    sizeStyles[size],
                    className,
                ].join(' ')}
            >
                {/* Header */}
                {(title || !hideClose) && (
                    <div className="flex flex-shrink-0 items-center justify-between border-b border-[#1B2B4B]/8 px-6 py-4">
                        {title && (
                            <h2 className="text-base font-semibold text-[#1B2B4B]">
                                {title}
                            </h2>
                        )}
                        {!hideClose && (
                            <button
                                onClick={onClose}
                                className="ml-auto rounded-lg p-1.5 text-[#5C6B88] transition-colors hover:bg-[#F5F0E8] hover:text-[#1B2B4B]"
                                aria-label="Close"
                            >
                                <Icon name="x" size={16} className="block" />
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-[#1B2B4B]/8 bg-[#FAF8F4]/60 px-6 py-4">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
