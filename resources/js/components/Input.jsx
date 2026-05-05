// src/components/ui/Input.jsx
import { forwardRef } from 'react';
function FieldWrapper({
    label,
    error,
    helper,
    full,
    className,
    htmlFor,
    children,
}) {
    return (
        <div
            className={[
                'flex flex-col gap-1',
                full ? 'w-full' : '',
                className ?? '',
            ].join(' ')}
        >
            {label && (
                <label
                    htmlFor={htmlFor}
                    className="text-[11px] font-semibold tracking-wider text-[#5C6B88] uppercase"
                >
                    {label}
                </label>
            )}
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
            {!error && helper && (
                <p className="text-xs text-[#5C6B88]">{helper}</p>
            )}
        </div>
    );
}
const baseInput = [
    'w-full rounded-lg border bg-white',
    'text-sm text-[#1B2B4B] placeholder:text-[#1B2B4B]/30',
    'outline-none transition-colors duration-150',
    'focus:ring-2 focus:ring-[#24A18F]/20',
].join(' ');
const normalBorder =
    'border-[#1B2B4B]/15 hover:border-[#1B2B4B]/30 focus:border-[#24A18F]';
const errorBorder = 'border-red-300 focus:border-red-400 focus:ring-red-200/30';
export const Input = forwardRef(function Input(
    { label, error, helper, full, leftIcon, rightIcon, className, id, ...rest },
    ref,
) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
        <FieldWrapper
            label={label}
            error={error}
            helper={helper}
            full={full}
            htmlFor={inputId}
        >
            <div className="relative">
                {leftIcon && (
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#5C6B88]">
                        {leftIcon}
                    </span>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={[
                        baseInput,
                        error ? errorBorder : normalBorder,
                        'px-3 py-2',
                        leftIcon ? 'pl-9' : '',
                        rightIcon ? 'pr-9' : '',
                        className ?? '',
                    ].join(' ')}
                    {...rest}
                />
                {rightIcon && (
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#5C6B88]">
                        {rightIcon}
                    </span>
                )}
            </div>
        </FieldWrapper>
    );
});
export const Select = forwardRef(function Select(
    { label, error, helper, full, className, id, children, ...rest },
    ref,
) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
        <FieldWrapper
            label={label}
            error={error}
            helper={helper}
            full={full}
            htmlFor={inputId}
        >
            <select
                ref={ref}
                id={inputId}
                className={[
                    baseInput,
                    error ? errorBorder : normalBorder,
                    'cursor-pointer appearance-none px-3 py-2',
                    className ?? '',
                ].join(' ')}
                {...rest}
            >
                {children}
            </select>
        </FieldWrapper>
    );
});
export const Textarea = forwardRef(function Textarea(
    { label, error, helper, full, className, id, rows = 3, ...rest },
    ref,
) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
        <FieldWrapper
            label={label}
            error={error}
            helper={helper}
            full={full}
            htmlFor={inputId}
        >
            <textarea
                ref={ref}
                id={inputId}
                rows={rows}
                className={[
                    baseInput,
                    error ? errorBorder : normalBorder,
                    'resize-none px-3 py-2',
                    className ?? '',
                ].join(' ')}
                {...rest}
            />
        </FieldWrapper>
    );
});
