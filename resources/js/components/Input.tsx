// src/components/ui/Input.tsx
import { forwardRef } from "react"

// ── Shared label + wrapper ────────────────────────────────────────────────────

interface WrapperProps {
  label?:    string
  error?:    string
  helper?:   string
  full?:     boolean
  className?: string
  htmlFor?:  string
  children:  React.ReactNode
}

function FieldWrapper({ label, error, helper, full, className, htmlFor, children }: WrapperProps) {
  return (
    <div className={["flex flex-col gap-1", full ? "w-full" : "", className ?? ""].join(" ")}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-[11px] font-semibold uppercase tracking-wider text-[#5C6B88]"
        >
          {label}
        </label>
      )}
      {children}
      {error  && <p className="text-xs text-red-500">{error}</p>}
      {!error && helper && <p className="text-xs text-[#5C6B88]">{helper}</p>}
    </div>
  )
}

const baseInput = [
  "w-full rounded-lg border bg-white",
  "text-sm text-[#1B2B4B] placeholder:text-[#1B2B4B]/30",
  "outline-none transition-colors duration-150",
  "focus:ring-2 focus:ring-[#24A18F]/20",
].join(" ")

const normalBorder = "border-[#1B2B4B]/15 hover:border-[#1B2B4B]/30 focus:border-[#24A18F]"
const errorBorder  = "border-red-300 focus:border-red-400 focus:ring-red-200/30"

// ── Input ─────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:     string
  error?:     string
  helper?:    string
  full?:      boolean
  leftIcon?:  React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helper, full, leftIcon, rightIcon, className, id, ...rest },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")

  return (
    <FieldWrapper label={label} error={error} helper={helper} full={full} htmlFor={inputId}>
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C6B88] pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            baseInput,
            error ? errorBorder : normalBorder,
            "px-3 py-2",
            leftIcon  ? "pl-9"  : "",
            rightIcon ? "pr-9"  : "",
            className ?? "",
          ].join(" ")}
          {...rest}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C6B88] pointer-events-none">
            {rightIcon}
          </span>
        )}
      </div>
    </FieldWrapper>
  )
})

// ── Select ────────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:    string
  error?:    string
  helper?:   string
  full?:     boolean
  children:  React.ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, helper, full, className, id, children, ...rest },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")

  return (
    <FieldWrapper label={label} error={error} helper={helper} full={full} htmlFor={inputId}>
      <select
        ref={ref}
        id={inputId}
        className={[
          baseInput,
          error ? errorBorder : normalBorder,
          "px-3 py-2 appearance-none cursor-pointer",
          className ?? "",
        ].join(" ")}
        {...rest}
      >
        {children}
      </select>
    </FieldWrapper>
  )
})

// ── Textarea ──────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:   string
  error?:   string
  helper?:  string
  full?:    boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, helper, full, className, id, rows = 3, ...rest },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")

  return (
    <FieldWrapper label={label} error={error} helper={helper} full={full} htmlFor={inputId}>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={[
          baseInput,
          error ? errorBorder : normalBorder,
          "px-3 py-2 resize-none",
          className ?? "",
        ].join(" ")}
        {...rest}
      />
    </FieldWrapper>
  )
})